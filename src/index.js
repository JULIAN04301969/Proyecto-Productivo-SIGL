// ============================================================
// Punto de entrada del servidor Express
// Sistema Integral de Gestión de Leads (SIGL)
// ============================================================

require('dotenv').config();

// --- 1. VALIDACIÓN ESTRICTA DE VARIABLES DE ENTORNO (Fase 0) ---
const requiredEnvVars = [
    'PORT', 
    'DB_HOST', 
    'DB_USER', 
    'DB_PASSWORD', 
    'DB_NAME', 
    'JWT_SECRET', 
    'FRONTEND_URL'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.error(`\x1b[31m[ERROR CRÍTICO] Faltan variables de entorno obligatorias: ${missingVars.join(', ')}\x1b[0m`);
    console.error('El servidor no puede iniciar sin estas variables. Revise el archivo .env');
    process.exit(1);
}

const express = require('express');
const cors    = require('cors');
const path    = require('path');

const { testConnection, checkConnection } = require('./config/database');
const authRoutes                          = require('./routes/authRoutes');

const app  = express();
const PORT = process.env.PORT || 3000;

// --- 2. CONFIGURACIÓN DE MIDDLEWARES GLOBALES ---

// CORS Restrictivo
const allowedOrigins = [
    process.env.FRONTEND_URL, 
    `http://localhost:${PORT}`,
    `http://127.0.0.1:${PORT}`,
    'http://localhost:5500',    // Live Server VSCode
    'http://127.0.0.1:5500'     // Live Server VSCode
];

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.error(`[CORS BLOQUEADO] Origen no autorizado: ${origin}`);
            callback(new Error('Acceso denegado por políticas de CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- 3. SERVIR ARCHIVOS ESTÁTICOS ---
app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.use(express.static(path.join(__dirname, '..', 'public')));

// --- 4. REGISTRO DE RUTAS ---
app.use('/api/auth', authRoutes);

// --- 5. ENDPOINT DE MONITOREO ---
app.get('/api/estado', async (req, res) => {
  const estadoBD = await checkConnection();

  return res.status(estadoBD.conectada ? 200 : 503).json({
    exito:       estadoBD.conectada,
    mensaje:     estadoBD.conectada
      ? 'API del Sistema de Gestión Integral de Leads operativa.'
      : 'API operativa pero sin conexión a la base de datos.',
    version:     '2.0.0',
    baseDeDatos: estadoBD.conectada ? 'Conectada' : 'No disponible', // Seguridad aplicada
    timestamp:   new Date().toISOString()
  });
});

// --- 6. MANEJO DE RUTAS NO ENCONTRADAS (404) ---
app.use((req, res) => {
  res.status(404).json({
    exito:   false,
    mensaje: 'Ruta no encontrada en esta API.'
  });
});

// --- 7. MANEJADOR GLOBAL DE ERRORES ---
// Middleware para capturar errores de CORS y otros errores no controlados.
app.use((err, req, res, next) => {
    if (err.message === 'Acceso denegado por políticas de CORS') {
        return res.status(403).json({ 
            exito: false, 
            mensaje: err.message 
        });
    }
    
    console.error('[ERROR GLOBAL]', err.stack);
    res.status(err.status || 500).json({
        exito: false,
        mensaje: 'Error interno del servidor'
    });
});

// Se exporta la app para Jest
module.exports = app;

// --- 8. INICIALIZACIÓN DEL SERVIDOR ---
if (require.main === module) {
  const iniciarServidor = async () => {
    await testConnection();
    app.listen(PORT, () => {
      console.log('═══════════════════════════════════════════════════');
      console.log('  🚀 Sistema de Gestión Integral de Leads — API   ');
      console.log('═══════════════════════════════════════════════════');
      console.log(`  ✅ Servidor en:  http://localhost:${PORT}`);
      console.log(`  ✅ CORS activo:  Lista blanca configurada`);
      console.log('═══════════════════════════════════════════════════');
    });
  };
  iniciarServidor();
}