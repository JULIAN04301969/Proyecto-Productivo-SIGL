// ============================================================
// Orquestador principal — Aplicación frontend
// ============================================================

import { authService, session } from './modules/api.js';
import { iniciarModuloLeads, guardarLead, eliminarLead } from './modules/leads.js';

// CORRECCIÓN AUDITORÍA: Bandera para evitar múltiples bindings de eventos
let isLeadsModuleInitialized = false;

document.addEventListener('DOMContentLoaded', async () => {
  M.Modal.init(document.querySelectorAll('.modal'));
  M.FormSelect.init(document.querySelectorAll('select'));
  M.Sidenav.init(document.querySelectorAll('.sidenav'));

  const validarSesion = async () => {
    const { ok, datos } = await authService.perfil();
    if (ok && datos.exito) {
      session.guardarUsuario(datos.datos);
      mostrarApp();
    } else {
      session.cerrarSesionLocal();
      mostrarLogin();
    }
  };
  validarSesion();

  document.getElementById('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const btnLogin = document.getElementById('btn-login');
    const msgError = document.getElementById('login-error');

    btnLogin.disabled = true;
    btnLogin.textContent = 'Verificando...';
    msgError.style.display = 'none';

    const { ok, datos } = await authService.login({ email, password });

    btnLogin.disabled = false;
    btnLogin.textContent = 'Iniciar Sesión';

    if (ok && datos.exito) {
      session.guardarUsuario(datos.usuario);
      mostrarApp();
    } else {
      msgError.textContent = datos.mensaje || 'Error de autenticación.';
      msgError.style.display = 'block';
    }
  });

  document.getElementById('form-registro')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const datos = {
      nombre: document.getElementById('reg-nombre').value.trim(),
      email: document.getElementById('reg-email').value.trim(),
      password: document.getElementById('reg-password').value,
      rol: document.getElementById('reg-rol').value
    };

    const { ok, datos: respuesta } = await authService.registro(datos);
    if (ok && respuesta.exito) {
      M.toast({ html: `✅ Usuario ${respuesta.datos.nombre} registrado correctamente.`, classes: 'teal darken-2' });
      M.Modal.getInstance(document.getElementById('modal-registro')).close();
      document.getElementById('form-registro').reset();
    } else {
      M.toast({ html: `⚠️ ${respuesta.mensaje || 'Error al registrar.'}`, classes: 'red darken-1' });
    }
  });

  document.querySelectorAll('.btn-cerrar-sesion').forEach(btn =>
    btn.addEventListener('click', async () => {
      const { ok } = await authService.logout();
      if (ok) {
        session.cerrarSesionLocal();
        mostrarLogin();
      } else {
        M.toast({ html: 'Error de red al cerrar sesión. Intente de nuevo.', classes: 'red darken-1' });
      }
    })
  );

  document.querySelectorAll('[data-vista]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const vista = btn.dataset.vista;
      document.querySelectorAll('[data-vista]').forEach(b => b.classList.remove('activo'));
      btn.classList.add('activo');
      mostrarVista(vista);
      const sidenav = document.querySelector('.sidenav');
      if (sidenav) M.Sidenav.getInstance(sidenav)?.close();
    });
  });

  document.getElementById('btn-health-check')?.addEventListener('click', async () => {
    const resultado = document.getElementById('health-resultado');
    resultado.innerHTML = '<span class="grey-text">Verificando...</span>';
    const { ok, datos } = await authService.estado();
    resultado.innerHTML = ok
      ? `<span class="teal-text darken-2"><i class="material-icons tiny">check_circle</i> Servidor operativo | BD: <strong>${datos.baseDeDatos}</strong> | v${datos.version}</span>`
      : `<span class="red-text"><i class="material-icons tiny">error</i> ${datos.mensaje}</span>`;
  });
});

const mostrarLogin = () => {
  document.getElementById('vista-login').style.display = 'flex';
  document.getElementById('vista-app').style.display = 'none';
  document.getElementById('form-login').reset();
  document.getElementById('login-error').style.display = 'none';
};

const mostrarApp = () => {
  const usuario = session.obtenerUsuario();
  document.getElementById('vista-login').style.display = 'none';
  document.getElementById('vista-app').style.display = 'block';

  if (usuario) {
    document.getElementById('usuario-nombre').textContent = usuario.nombre;
    document.getElementById('usuario-rol').textContent = usuario.rol.toUpperCase();
    const menuRegistro = document.getElementById('menu-registro');
    if (menuRegistro) menuRegistro.style.display = usuario.rol === 'admin' ? 'block' : 'none';
  }
  mostrarVista('leads');
};

const mostrarVista = (nombre) => {
  document.querySelectorAll('.vista-seccion').forEach(s => s.style.display = 'none');
  const seccion = document.getElementById(`seccion-${nombre}`);
  if (seccion) seccion.style.display = 'block';
  
  // CORRECCIÓN AUDITORÍA: Solo inicializar eventos de leads una vez.
  if (nombre === 'leads' && !isLeadsModuleInitialized) {
    iniciarModuloLeads();
    isLeadsModuleInitialized = true;
  }
};