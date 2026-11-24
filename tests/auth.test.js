const request = require('supertest');
const app = require('../src/index');
const { pool } = require('../src/config/database');
const bcrypt = require('bcryptjs');

jest.mock('../src/config/database', () => ({
  pool: { query: jest.fn() },
  checkConnection: jest.fn(),
  testConnection: jest.fn()
}));

describe('Auth - Pruebas Unitarias del Controlador', () => {
  const agent = request.agent(app);

  beforeAll(() => {
    process.env.JWT_SECRET = 'test_secret_key_sigl';
    process.env.NODE_ENV = 'test';
  });

  beforeEach(() => jest.clearAllMocks());

  describe('POST /api/auth/login', () => {
    it('Debe fallar si falta el email o password', async () => {
      const res = await agent.post('/api/auth/login').send({ email: 'test@test.com' });
      expect(res.status).toBe(400);
    });

    it('Debe fallar si el usuario está inactivo', async () => {
      pool.query.mockResolvedValueOnce([[{ id: 1, activo: 0, password_hash: 'hashed' }]]);
      const res = await agent.post('/api/auth/login').send({ email: 'inactivo@test.com', password: '123' });
      expect(res.status).toBe(403);
    });

    it('Debe autenticar correctamente y setear cookie HttpOnly', async () => {
      const hash = await bcrypt.hash('password123', 10);
      pool.query.mockResolvedValueOnce([[{ id: 1, nombre: 'Test', email: 'test@test.com', password_hash: hash, rol: 'asesor', activo: 1 }]]);

      const res = await agent.post('/api/auth/login').send({ email: 'test@test.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeUndefined(); // El token NO va en el JSON
      expect(res.headers['set-cookie'][0]).toContain('HttpOnly');
    });
  });

  describe('GET /api/auth/perfil', () => {
    it('Debe denegar acceso sin token', async () => {
      const res = await request(app).get('/api/auth/perfil');
      expect(res.status).toBe(401);
    });

    it('Debe retornar el perfil con cookie válida', async () => {
      pool.query.mockResolvedValueOnce([[{ id: 1, nombre: 'Test', email: 'test@test.com', rol: 'asesor', creado_en: new Date() }]]);
      const res = await agent.get('/api/auth/perfil'); // Reutiliza la cookie del login
      expect(res.status).toBe(200);
      expect(res.body.datos.email).toBe('test@test.com');
    });
  });
});