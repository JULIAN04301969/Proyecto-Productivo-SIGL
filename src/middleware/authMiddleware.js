// ============================================================
// Middleware de verificación de tokens JWT
// Sistema de Gestión Integral de Leads
// ============================================================
// Intercepta peticiones a rutas protegidas y valida el JWT.
// MIGRACIÓN: Ahora lee el token desde una HttpOnly Cookie
// en lugar del header Authorization.
// ============================================================

const jwt = require('jsonwebtoken');
require('dotenv').config();

const verifyToken = (req, res, next) => {
  try {
    // SEGURIDAD: El token ya no viaja en el header Authorization.
    // Express, gracias a cookie-parser, lo extrae de req.cookies.
    const token = req.cookies.jwt;

    if (!token) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Acceso denegado. No se encontró sesión activa.'
      });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // El payload decodificado queda disponible para los controladores
    req.usuario = payload;

    next();

  } catch (error) {
    // Se distingue token vencido de token inválido para mensajes claros al cliente
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        exito: false,
        mensaje: 'La sesión ha expirado. Por favor inicie sesión nuevamente.'
      });
    }

    return res.status(401).json({
      exito: false,
      mensaje: 'Token inválido. Autenticación rechazada.'
    });
  }
};

module.exports = { verifyToken };