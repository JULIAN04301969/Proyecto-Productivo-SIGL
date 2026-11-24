// ============================================================
// Enrutador de autenticación
// ============================================================

const express      = require('express');
const router       = express.Router();
const { registrar, iniciarSesion, cerrarSesion, perfil } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

// Rutas públicas
router.post('/registro', registrar);
router.post('/login', iniciarSesion);
router.post('/logout', cerrarSesion); // PÚBLICA: Garantiza limpieza de cookie incluso si el JWT expiró

// Ruta privada
router.get('/perfil', verifyToken, perfil);

module.exports = router;