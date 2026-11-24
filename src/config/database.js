// ============================================================
// Módulo de conexión a la base de datos MySQL
// Sistema Integral de Gestión de Leads (SIGL)
// ============================================================

const mysql = require('mysql2/promise');
require('dotenv').config();

// Pool de conexiones configurado con los parámetros del servidor MySQL.
const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  database:           process.env.DB_NAME     || 'leads_db',
  port:               process.env.DB_PORT     || 3306,
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0
});

// ------------------------------------------------------------
// testConnection
// Verifica la conectividad con MySQL al iniciar el servidor.
// ------------------------------------------------------------
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conexión a MySQL establecida correctamente.');
    connection.release();
  } catch (error) {
    console.error('❌ Error al conectar con MySQL:', error.message);
    process.exit(1);
  }
};

// ------------------------------------------------------------
// checkConnection
// Verifica la conectividad en tiempo real. Usa try/finally para
// garantizar que la conexión SIEMPRE se libere, incluso si falla.
// ------------------------------------------------------------
const checkConnection = async () => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.query('SELECT 1');
    return { conectada: true, mensaje: 'Conectada' };
  } catch (error) {
    // Registrar el error internamente, pero no exponerlo al cliente
    console.error('[DB ERROR] Fallo en checkConnection:', error.message);
    return { conectada: false, mensaje: 'No disponible' };
  } finally {
    // Garantiza que la conexión vuelva al pool
    if (connection) connection.release();
  }
};

module.exports = { pool, testConnection, checkConnection };