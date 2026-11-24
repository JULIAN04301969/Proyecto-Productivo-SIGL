// ============================================================
// Módulo de comunicación con la API REST
// Sistema Integral de Gestión de Leads — Frontend
// ============================================================

const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:3000/api'
  : 'https://leads-auth-api-production.up.railway.app/api';

// Solo guardamos datos públicos del usuario. El token es HttpOnly.
const USUARIO_KEY = 'leads_usuario';

export const session = {
  guardarUsuario: (usuario) => sessionStorage.setItem(USUARIO_KEY, JSON.stringify(usuario)),
  obtenerUsuario: () => {
    const datos = sessionStorage.getItem(USUARIO_KEY);
    return datos ? JSON.parse(datos) : null;
  },
  estaAutenticado: () => !!sessionStorage.getItem(USUARIO_KEY),
  cerrarSesionLocal: () => sessionStorage.removeItem(USUARIO_KEY)
};

const peticion = async (endpoint, opciones = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...opciones.headers
  };

  try {
    const respuesta = await fetch(`${API_BASE}${endpoint}`, {
      ...opciones,
      headers,
      credentials: 'include' // CRÍTICO: Envía y recibe la cookie HttpOnly
    });

    const datos = await respuesta.json();
    return { ok: respuesta.ok, status: respuesta.status, datos };

  } catch (error) {
    return {
      ok: false,
      status: 0,
      datos: { exito: false, mensaje: 'No se pudo conectar con el servidor.' }
    };
  }
};

export const authService = {
  login: (credenciales) => peticion('/auth/login', { method: 'POST', body: JSON.stringify(credenciales) }),
  registro: (datos) => peticion('/auth/registro', { method: 'POST', body: JSON.stringify(datos) }),
  logout: () => peticion('/auth/logout', { method: 'POST' }),
  perfil: () => peticion('/auth/perfil'),
  estado: () => peticion('/estado')
};

// CRUD LOCAL DE LEADS (Para la demo del frontend)
export const leadsService = {
  obtenerTodos: () => {
    const datos = sessionStorage.getItem('leads_datos');
    return datos ? JSON.parse(datos) : [];
  },
  guardar: (lead) => {
    const leads = leadsService.obtenerTodos();
    const nuevo = {
      ...lead,
      id_lead: `L-${String(leads.length + 1).padStart(3, '0')}`,
      fecha_registro: new Date().toISOString().split('T')[0],
      fecha_ultimo_contacto: new Date().toISOString().split('T')[0]
    };
    leads.unshift(nuevo);
    sessionStorage.setItem('leads_datos', JSON.stringify(leads));
    return nuevo;
  },
  actualizar: (id, cambios) => {
    const leads = leadsService.obtenerTodos();
    const indice = leads.findIndex(l => l.id_lead === id);
    if (indice === -1) return null;
    leads[indice] = { ...leads[indice], ...cambios, fecha_ultimo_contacto: new Date().toISOString().split('T')[0] };
    sessionStorage.setItem('leads_datos', JSON.stringify(leads));
    return leads[indice];
  },
  eliminar: (id) => {
    const leads = leadsService.obtenerTodos();
    const filtrado = leads.filter(l => l.id_lead !== id);
    sessionStorage.setItem('leads_datos', JSON.stringify(filtrado));
    return filtrado.length < leads.length;
  },
  generarDemo: () => {
    const estados = ['Nuevo', 'En proceso', 'Calificado', 'Cerrado', 'Descartado'];
    const prioridades = ['Alta', 'Media', 'Baja'];
    const fuentes = ['Web', 'Referido', 'Redes sociales', 'Llamada entrante', 'Evento'];
    const nombres = ['Laura Jiménez', 'Carlos Méndez', 'Sofía Ruiz', 'Andrés Mora', 'Valentina Ríos', 'Diego Salcedo', 'Camila Torres', 'Felipe Castro'];
    const leads = nombres.map((nombre, i) => ({
      id_lead: `L-${String(i + 1).padStart(3, '0')}`,
      nombre,
      email: `${nombre.toLowerCase().replace(/ /g, '.')}@empresa.com`,
      estado: estados[i % estados.length],
      prioridad: prioridades[i % prioridades.length],
      fuente: fuentes[i % fuentes.length],
      feedback_cliente: 'Lead generado para demostración del sistema.',
      fecha_registro: '2026-04-01',
      fecha_ultimo_contacto: new Date().toISOString().split('T')[0]
    }));
    sessionStorage.setItem('leads_datos', JSON.stringify(leads));
    return leads;
  }
};