// ============================================================
// Módulo de gestión de leads
// Sistema Integral de Gestión de Leads — Frontend
// ============================================================

import { leadsService } from './api.js';

const CLASE_ESTADO = {
  'Nuevo':      'badge-Nuevo',
  'En proceso': 'badge-En-proceso',
  'Calificado': 'badge-Calificado',
  'Cerrado':    'badge-Cerrado',
  'Descartado': 'badge-Descartado'
};

const CLASE_PRIORIDAD = {
  'Alta':  'red-text text-darken-2',
  'Media': 'orange-text text-darken-1',
  'Baja':  'grey-text'
};

// CORRECCIÓN AUDITORÍA: Estado local del módulo y bandera de inicialización.
// Evita que los listeners se acumulen si la vista se vuelve a cargar o 
// si se guarda/elimina un lead repetidamente.
let leadsState = [];
let isInitialized = false;

export const renderTablaLeads = (leads, onEditar, onEliminar) => {
  const tbody = document.getElementById('leads-tbody');
  if (!tbody) return;

  if (leads.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="center-align grey-text" style="padding:40px 0;">
          <i class="material-icons medium grey-text">inbox</i>
          <p>No hay leads registrados. Use el botón "Nuevo Lead" para crear el primero.</p>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = leads.map(lead => `
    <tr>
      <td><strong>${lead.id_lead}</strong></td>
      <td>${lead.nombre}</td>
      <td>${lead.email}</td>
      <td>
        <span class="badge-estado ${CLASE_ESTADO[lead.estado] || 'badge-Nuevo'}">
          ${lead.estado}
        </span>
      </td>
      <td class="${CLASE_PRIORIDAD[lead.prioridad] || ''}">
        <strong>${lead.prioridad || '—'}</strong>
      </td>
      <td>${lead.fecha_ultimo_contacto}</td>
      <td>
        <button class="btn-accion btn-editar waves-effect waves-light blue"
                data-id="${lead.id_lead}" title="Editar lead">
          <i class="material-icons" style="font-size:16px;line-height:28px;">edit</i>
        </button>
        <button class="btn-accion btn-eliminar waves-effect waves-light red"
                data-id="${lead.id_lead}" title="Eliminar lead">
          <i class="material-icons" style="font-size:16px;line-height:28px;">delete</i>
        </button>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('.btn-editar').forEach(btn =>
    btn.addEventListener('click', () => onEditar(btn.dataset.id))
  );
  tbody.querySelectorAll('.btn-eliminar').forEach(btn =>
    btn.addEventListener('click', () => onEliminar(btn.dataset.id))
  );
};

// CORRECCIÓN AUDITORÍA: Función pura de renderizado.
// No enlaza eventos, solo lee el estado actual (leadsState) y pinta la tabla.
const renderizar = () => {
  const busqueda  = (document.getElementById('buscar-lead')?.value || '').toLowerCase();
  const filtroEst = document.getElementById('filtro-estado')?.value || '';

  const filtrados = leadsState.filter(l => {
    const coincideBusqueda = !busqueda ||
      l.nombre.toLowerCase().includes(busqueda) ||
      l.email.toLowerCase().includes(busqueda);
    const coincideEstado = !filtroEst || l.estado === filtroEst;
    return coincideBusqueda && coincideEstado;
  });

  renderTablaLeads(filtrados, abrirEdicion, confirmarEliminacion);

  const contador = document.getElementById('contador-leads');
  if (contador) {
    contador.textContent = `${filtrados.length} de ${leadsState.length} leads`;
  }
};

export const iniciarModuloLeads = () => {
  // Sincroniza el estado local con el almacenamiento
  leadsState = leadsService.obtenerTodos();
  if (leadsState.length === 0) {
    leadsState = leadsService.generarDemo();
  }

  // CORRECCIÓN AUDITORÍA: Solo enlazar eventos la primera vez que se entra a la vista.
  if (!isInitialized) {
    document.getElementById('buscar-lead')
      ?.addEventListener('input', renderizar);
    document.getElementById('filtro-estado')
      ?.addEventListener('change', renderizar);
    document.getElementById('btn-nuevo-lead')
      ?.addEventListener('click', abrirNuevo);
    
    isInitialized = true;
  }

  // Renderiza los datos actuales
  renderizar();
};

// ── Funciones internas del módulo ────────────────────────────

const abrirNuevo = () => {
  document.getElementById('modal-lead-titulo').textContent = 'Nuevo Lead';
  document.getElementById('form-lead').reset();
  document.getElementById('lead-id-edicion').value = '';
  M.FormSelect.init(document.querySelectorAll('select'));
  M.Modal.getInstance(document.getElementById('modal-lead')).open();
};

const abrirEdicion = (id) => {
  const lead = leadsState.find(l => l.id_lead === id);
  if (!lead) return;

  document.getElementById('modal-lead-titulo').textContent = 'Editar Lead';
  document.getElementById('lead-id-edicion').value   = lead.id_lead;
  document.getElementById('lead-nombre').value        = lead.nombre;
  document.getElementById('lead-email').value         = lead.email;
  document.getElementById('lead-estado').value        = lead.estado;
  document.getElementById('lead-prioridad').value     = lead.prioridad;
  document.getElementById('lead-fuente').value        = lead.fuente || '';
  document.getElementById('lead-feedback').value      = lead.feedback_cliente || '';

  M.FormSelect.init(document.querySelectorAll('select'));
  M.Modal.getInstance(document.getElementById('modal-lead')).open();
};

const confirmarEliminacion = (id) => {
  document.getElementById('confirm-lead-id').textContent    = id;
  document.getElementById('btn-confirmar-eliminar').dataset.id = id;
  M.Modal.getInstance(document.getElementById('modal-confirmar')).open();
};

export const guardarLead = () => {
  const id        = document.getElementById('lead-id-edicion').value;
  const nombre    = document.getElementById('lead-nombre').value.trim();
  const email     = document.getElementById('lead-email').value.trim();
  const estado    = document.getElementById('lead-estado').value;
  const prioridad = document.getElementById('lead-prioridad').value;
  const fuente    = document.getElementById('lead-fuente').value;
  const feedback  = document.getElementById('lead-feedback').value.trim();

  if (!nombre || !email) {
    M.toast({ html: '⚠️ Los campos nombre y email son obligatorios.', classes: 'orange darken-2' });
    return;
  }

  const datos = { nombre, email, estado, prioridad, fuente, feedback_cliente: feedback };

  if (id) {
    leadsService.actualizar(id, datos);
    M.toast({ html: `✅ Lead ${id} actualizado correctamente.`, classes: 'teal darken-2' });
  } else {
    const nuevo = leadsService.guardar(datos);
    M.toast({ html: `✅ Lead ${nuevo.id_lead} creado correctamente.`, classes: 'teal darken-2' });
  }

  M.Modal.getInstance(document.getElementById('modal-lead')).close();
  
  // CORRECCIÓN AUDITORÍA: Ya no llamamos a iniciarModuloLeads().
  // Actualizamos el estado local y re-renderizamos.
  leadsState = leadsService.obtenerTodos();
  renderizar();
};

export const eliminarLead = (id) => {
  leadsService.eliminar(id);
  M.toast({ html: `🗑️ Lead ${id} eliminado.`, classes: 'red darken-1' });
  M.Modal.getInstance(document.getElementById('modal-confirmar')).close();
  
  // CORRECCIÓN AUDITORÍA: Ya no llamamos a iniciarModuloLeads().
  leadsState = leadsService.obtenerTodos();
  renderizar();
};