// ============================================================
// Orquestador principal — Aplicación frontend
// Sistema Integral de Gestión de Leads
// ============================================================

import { authService, session } from './modules/api.js';
import { iniciarModuloLeads, guardarLead, eliminarLead } from './modules/leads.js';

const escapeHTML = (str) => {
  if (!str) return '';
  return String(str).replace(/[&<>'"]/g,
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
};

let validacionSesionPendiente = true;

document.addEventListener('DOMContentLoaded', () => {
  M.Modal.init(document.querySelectorAll('.modal'));
  M.FormSelect.init(document.querySelectorAll('select'));
  M.Sidenav.init(document.querySelectorAll('.sidenav'));

  const btnLogin = document.getElementById('btn-login');
  btnLogin.disabled = true;
  btnLogin.textContent = 'Verificando sesión...';

  document.getElementById('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (validacionSesionPendiente) return;

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const msgError = document.getElementById('login-error');

    btnLogin.disabled = true;
    btnLogin.textContent = 'Verificando...';
    msgError.style.display = 'none';

    try {
      const { ok, datos } = await authService.login({ email, password });
      if (ok && datos.exito) {
        session.guardarUsuario(datos.usuario);
        mostrarApp();
      } else {
        msgError.textContent = datos.mensaje || 'Error de autenticación.';
        msgError.style.display = 'block';
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      msgError.textContent = 'No se pudo completar el inicio de sesión.';
      msgError.style.display = 'block';
    } finally {
      btnLogin.disabled = false;
      btnLogin.textContent = 'Iniciar Sesión';
    }
  });

  // Formulario de Registro
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
      const nombreSeguro = escapeHTML(respuesta.datos.nombre);
      M.toast({ html: `✅ Usuario ${nombreSeguro} registrado correctamente.`, classes: 'teal darken-2' });
      M.Modal.getInstance(document.getElementById('modal-registro')).close();
      document.getElementById('form-registro').reset();
    } else {
      const mensajeSeguro = escapeHTML(respuesta.mensaje || 'Error al registrar.');
      M.toast({ html: `⚠️ ${mensajeSeguro}`, classes: 'red darken-1' });
    }
  });

  document.querySelectorAll('.btn-cerrar-sesion').forEach(btn =>
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
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

  document.getElementById('btn-guardar-lead')?.addEventListener('click', guardarLead);
  document.getElementById('btn-confirmar-eliminar')?.addEventListener('click', (e) => {
    eliminarLead(e.currentTarget.dataset.id);
  });

  document.getElementById('btn-health-check')?.addEventListener('click', async () => {
    const resultado = document.getElementById('health-resultado');
    resultado.innerHTML = '<span class="grey-text">Verificando...</span>';
    const { ok, datos } = await authService.estado();
    resultado.innerHTML = ok
      ? `<span class="teal-text darken-2"><i class="material-icons tiny">check_circle</i> Servidor operativo | BD: <strong>${escapeHTML(datos.baseDeDatos)}</strong> | v${escapeHTML(datos.version)}</span>`
      : `<span class="red-text"><i class="material-icons tiny">error</i> ${escapeHTML(datos.mensaje)}</span>`;
  });

  validarSesion(btnLogin);
});

const validarSesion = async (btnLogin) => {
  try {
    const { ok, datos } = await authService.perfil();
    if (ok && datos.exito) {
      session.guardarUsuario(datos.datos);
      mostrarApp();
    } else {
      session.cerrarSesionLocal();
      mostrarLogin();
    }
  } catch (error) {
    console.error('Error al validar la sesión:', error);
    session.cerrarSesionLocal();
    mostrarLogin();
  } finally {
    validacionSesionPendiente = false;
    btnLogin.disabled = false;
    btnLogin.textContent = 'Iniciar Sesión';
  }
};

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

const mostrarVista = async (nombre) => {
  document.querySelectorAll('.vista-seccion').forEach(s => s.style.display = 'none');
  const seccion = document.getElementById(`seccion-${nombre}`);
  if (seccion) seccion.style.display = 'block';
  
  if (nombre === 'leads') {
    try {
      await iniciarModuloLeads();
    } catch (error) {
      console.error('Error al cargar el módulo de leads:', error);
      const tbody = document.getElementById('leads-tbody');
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" class="center-align red-text">
              No se pudo cargar la lista de leads. Intente nuevamente.
            </td>
          </tr>`;
      }
    }
  }
};