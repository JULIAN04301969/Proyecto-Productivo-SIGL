// ============================================================
// Controlador de Leads
// Sistema Integral de Gestión de Leads (SIGL)
// ============================================================

const { pool } = require('../config/database');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ESTADOS_VALIDOS = ['Nuevo', 'En proceso', 'Calificado', 'Cerrado', 'Descartado'];
const PRIORIDADES_VALIDAS = ['Alta', 'Media', 'Baja'];

const validarId = (id) => Number.isInteger(Number(id)) && Number(id) > 0;

// ----------------------------------------------------------------
// OBTENER LEADS
// ----------------------------------------------------------------
const obtenerLeads = async (req, res) => {
  try {
    let query = 'SELECT * FROM leads ORDER BY fecha_registro DESC';
    let params = [];

    if (req.usuario.rol === 'asesor') {
      query = 'SELECT * FROM leads WHERE asesor_id = ? ORDER BY fecha_registro DESC';
      params = [req.usuario.id];
    }

    const [leads] = await pool.query(query, params);

    const leadsFormateados = leads.map(lead => ({
      ...lead,
      id_lead: `L-${String(lead.id).padStart(3, '0')}`
    }));

    return res.status(200).json({ exito: true, datos: leadsFormateados });

  } catch (error) {
    console.error('❌ Error en obtenerLeads():', error);
    return res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};

// ----------------------------------------------------------------
// CREAR LEAD
// ----------------------------------------------------------------
const crearLead = async (req, res) => {
  try {
    const { nombre, email, telefono, estado, prioridad, fuente, feedback_cliente } = req.body;

    // [AUDITORÍA] Validación estricta de tipos antes de usar métodos de string
    if (!nombre || typeof nombre !== 'string' || nombre.trim().length < 3 || nombre.trim().length > 100) {
      return res.status(400).json({ exito: false, mensaje: 'El nombre debe ser texto y tener entre 3 y 100 caracteres.' });
    }
    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ exito: false, mensaje: 'El formato del correo electrónico no es válido.' });
    }
    if (estado && !ESTADOS_VALIDOS.includes(estado)) {
      return res.status(400).json({ exito: false, mensaje: 'El estado proporcionado no es válido.' });
    }
    if (prioridad && !PRIORIDADES_VALIDAS.includes(prioridad)) {
      return res.status(400).json({ exito: false, mensaje: 'La prioridad proporcionada no es válida.' });
    }

    const asesor_id = req.usuario.id; 

    const [resultado] = await pool.query(
      `INSERT INTO leads (nombre, email, telefono, estado, prioridad, fuente, feedback_cliente, asesor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombre.trim(), email.trim(), telefono || null, estado || 'Nuevo', prioridad || 'Media', fuente || null, feedback_cliente || null, asesor_id]
    );

    const nuevoId = resultado.insertId;

    return res.status(201).json({
      exito: true,
      mensaje: 'Lead creado exitosamente.',
      datos: { id: nuevoId, id_lead: `L-${String(nuevoId).padStart(3, '0')}`, nombre: nombre.trim(), email: email.trim() }
    });

  } catch (error) {
    console.error('❌ Error en crearLead():', error);
    return res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};

// ----------------------------------------------------------------
// ACTUALIZAR LEAD
// ----------------------------------------------------------------
const actualizarLead = async (req, res) => {
  try {
    const id = req.params.id;
    const { nombre, email, telefono, estado, prioridad, fuente, feedback_cliente } = req.body;

    if (!validarId(id)) {
      return res.status(400).json({ exito: false, mensaje: 'El ID proporcionado no es válido.' });
    }
    
    // [AUDITORÍA] Validación estricta de tipos
    if (!nombre || typeof nombre !== 'string' || !email || typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ exito: false, mensaje: 'Nombre (texto) y email válido son obligatorios.' });
    }
    if (estado && !ESTADOS_VALIDOS.includes(estado)) {
      return res.status(400).json({ exito: false, mensaje: 'Estado inválido.' });
    }
    if (prioridad && !PRIORIDADES_VALIDAS.includes(prioridad)) {
      return res.status(400).json({ exito: false, mensaje: 'Prioridad inválida.' });
    }

    const [leads] = await pool.query('SELECT asesor_id FROM leads WHERE id = ?', [id]);
    
    if (leads.length === 0) {
      return res.status(404).json({ exito: false, mensaje: 'Lead no encontrado.' });
    }

    const esPropietario = leads[0].asesor_id === req.usuario.id;
    const esAdmin = req.usuario.rol === 'admin';

    if (!esAdmin && !esPropietario) {
      return res.status(403).json({ exito: false, mensaje: 'No tienes permiso para editar este lead.' });
    }

    await pool.query(
      `UPDATE leads SET nombre = ?, email = ?, telefono = ?, estado = ?, prioridad = ?, fuente = ?, feedback_cliente = ? WHERE id = ?`,
      [nombre.trim(), email.trim(), telefono || null, estado || 'Nuevo', prioridad || 'Media', fuente || null, feedback_cliente || null, id]
    );

    return res.status(200).json({ exito: true, mensaje: 'Lead actualizado correctamente.' });

  } catch (error) {
    console.error('❌ Error en actualizarLead():', error);
    return res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};

// ----------------------------------------------------------------
// ELIMINAR LEAD
// ----------------------------------------------------------------
const eliminarLead = async (req, res) => {
  try {
    const id = req.params.id;

    if (!validarId(id)) {
      return res.status(400).json({ exito: false, mensaje: 'El ID proporcionado no es válido.' });
    }

    const [leads] = await pool.query('SELECT asesor_id FROM leads WHERE id = ?', [id]);
    
    if (leads.length === 0) {
      return res.status(404).json({ exito: false, mensaje: 'Lead no encontrado.' });
    }

    const esPropietario = leads[0].asesor_id === req.usuario.id;
    const esAdmin = req.usuario.rol === 'admin';

    if (!esAdmin && !esPropietario) {
      return res.status(403).json({ exito: false, mensaje: 'No tienes permiso para eliminar este lead.' });
    }

    await pool.query('DELETE FROM leads WHERE id = ?', [id]);

    return res.status(200).json({ exito: true, mensaje: 'Lead eliminado correctamente.' });

  } catch (error) {
    console.error('❌ Error en eliminarLead():', error);
    return res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};

module.exports = { obtenerLeads, crearLead, actualizarLead, eliminarLead };