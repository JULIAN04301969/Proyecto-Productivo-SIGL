// ============================================================
// Controlador de autenticación
// Sistema Integral de Gestión de Leads
// ============================================================

const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { pool } = require('../config/database');
require('dotenv').config();

const BCRYPT_SALT_ROUNDS = 10;
const ROLES_VALIDOS = ['admin', 'asesor', 'supervisor'];

// ----------------------------------------------------------------
// REGISTRO DE USUARIO
// ----------------------------------------------------------------
const registrar = async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ exito: false, mensaje: 'Los campos nombre, email y password son obligatorios.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ exito: false, mensaje: 'El formato del correo electrónico no es válido.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ exito: false, mensaje: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    const [existentes] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email.toLowerCase().trim()]);

    if (existentes.length > 0) {
      return res.status(409).json({ exito: false, mensaje: 'Ya existe una cuenta registrada con este correo electrónico.' });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    const rolValido = ROLES_VALIDOS.includes(rol) ? rol : 'asesor';

    const [resultado] = await pool.query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)`,
      [nombre.trim(), email.toLowerCase().trim(), passwordHash, rolValido]
    );

    return res.status(201).json({
      exito: true,
      mensaje: 'Usuario registrado exitosamente.',
      datos: { id: resultado.insertId, nombre: nombre.trim(), email: email.toLowerCase().trim(), rol: rolValido }
    });

  } catch (error) {
    console.error('❌ Error en registrar():', error);
    return res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};

// ----------------------------------------------------------------
// INICIO DE SESIÓN
// ----------------------------------------------------------------
const iniciarSesion = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ exito: false, mensaje: 'Los campos email y password son obligatorios.' });
    }

    const [usuarios] = await pool.query(
      `SELECT id, nombre, email, password_hash, rol, activo FROM usuarios WHERE email = ? LIMIT 1`,
      [email.toLowerCase().trim()]
    );

    if (usuarios.length === 0) {
      return res.status(401).json({ exito: false, mensaje: 'Error en la autenticación. Credenciales incorrectas.' });
    }

    const usuario = usuarios[0];

    if (!usuario.activo) {
      return res.status(403).json({ exito: false, mensaje: 'La cuenta está deshabilitada. Contacte al administrador.' });
    }

    const passwordValida = await bcrypt.compare(password, usuario.password_hash);

    if (!passwordValida) {
      return res.status(401).json({ exito: false, mensaje: 'Error en la autenticación. Credenciales incorrectas.' });
    }

    const payload = { id: usuario.id, email: usuario.email, rol: usuario.rol, nombre: usuario.nombre };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h'
    });

    // CORRECCIÓN AUDITORÍA: Sincronización exacta de expiración.
    // Decodificamos el token para obtener el timestamp exacto de expiración y calcular el maxAge.
    const decoded = jwt.decode(token);
    const maxAgeMs = (decoded.exp * 1000) - Date.now();

    const esProduccion = process.env.NODE_ENV === 'production';
    
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: esProduccion, 
      sameSite: esProduccion ? 'none' : 'lax',
      maxAge: maxAgeMs // Ahora está perfectamente sincronizado con el JWT
    });

    return res.status(200).json({
      exito: true,
      mensaje: 'Autenticación satisfactoria.',
      usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol }
    });

  } catch (error) {
    console.error('❌ Error en iniciarSesion():', error);
    return res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};

// ----------------------------------------------------------------
// CERRAR SESIÓN
// ----------------------------------------------------------------
const cerrarSesion = (req, res) => {
  res.clearCookie('jwt', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  });

  return res.status(200).json({
    exito: true,
    mensaje: 'Sesión cerrada correctamente.'
  });
};

// ----------------------------------------------------------------
// PERFIL — RUTA PROTEGIDA
// ----------------------------------------------------------------
const perfil = async (req, res) => {
  try {
    const { id } = req.usuario;

    const [usuarios] = await pool.query(
      'SELECT id, nombre, email, rol, creado_en FROM usuarios WHERE id = ? AND activo = 1',
      [id]
    );

    if (usuarios.length === 0) {
      return res.status(404).json({ exito: false, mensaje: 'Usuario no encontrado o inactivo.' });
    }

    return res.status(200).json({
      exito: true,
      mensaje: 'Perfil obtenido correctamente.',
      datos: usuarios[0]
    });

  } catch (error) {
    console.error('❌ Error en perfil():', error);
    return res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};

module.exports = { registrar, iniciarSesion, cerrarSesion, perfil };