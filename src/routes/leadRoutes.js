// ============================================================
// Enrutador de Leads
// Sistema Integral de Gestión de Leads (SIGL)
// ============================================================

const express = require('express');
const router = express.Router();
const { obtenerLeads, crearLead, actualizarLead, eliminarLead } = require('../controllers/leadController');
const { verifyToken } = require('../middleware/authMiddleware');

// Todas las rutas de leads requieren que el usuario esté autenticado
// (que tenga una cookie HttpOnly válida)
router.use(verifyToken);

// Rutas del CRUD
router.get('/', obtenerLeads);          // Obtener todos (o los del asesor)
router.post('/', crearLead);            // Crear un nuevo lead
router.put('/:id', actualizarLead);     // Actualizar un lead por ID
router.delete('/:id', eliminarLead);    // Eliminar un lead por ID

module.exports = router;