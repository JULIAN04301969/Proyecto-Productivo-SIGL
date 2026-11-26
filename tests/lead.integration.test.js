const request = require('supertest');
const app = require('../src/index');
const { pool } = require('../src/config/database');
const jwt = require('jsonwebtoken');

// Mock de la base de datos para no depender de MySQL en las pruebas
jest.mock('../src/config/database', () => ({
  pool: { query: jest.fn() },
  checkConnection: jest.fn(),
  testConnection: jest.fn()
}));

describe('Leads CRUD - Integration Tests', () => {
  let tokenAsesor;
  let tokenAdmin;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test_secret_key_sigl';
    process.env.NODE_ENV = 'test';
    // Generamos tokens falsos para simular la cookie
    tokenAsesor = jwt.sign({ id: 2, rol: 'asesor' }, process.env.JWT_SECRET);
    tokenAdmin = jwt.sign({ id: 1, rol: 'admin' }, process.env.JWT_SECRET);
  });

  beforeEach(() => jest.clearAllMocks());

  it('POST /api/leads - Debe rechazar si no hay cookie', async () => {
    const res = await request(app).post('/api/leads').send({ nombre: 'Test', email: 'test@test.com' });
    expect(res.status).toBe(401);
  });

  it('POST /api/leads - Debe crear lead con cookie válida', async () => {
    pool.query.mockResolvedValueOnce([{ insertId: 1 }]); // Simula el insert
    const res = await request(app)
      .post('/api/leads')
      .set('Cookie', [`jwt=${tokenAsesor}`])
      .send({ nombre: 'Empresa Test', email: 'test@empresa.com' });
    
    expect(res.status).toBe(201);
    expect(res.body.datos.id_lead).toBe('L-001');
  });

  it('POST /api/leads - Debe rechazar tipos de datos inválidos', async () => {
    const res = await request(app)
      .post('/api/leads')
      .set('Cookie', [`jwt=${tokenAsesor}`])
      .send({ nombre: 12345, email: 'test@empresa.com' }); // Nombre numérico
    
    expect(res.status).toBe(400);
    expect(res.body.mensaje).toContain('El nombre debe ser texto');
  });

  it('GET /api/leads - Debe retornar solo los leads del asesor', async () => {
    // Simulamos que la BD devuelve un lead del asesor 2
    pool.query.mockResolvedValueOnce([[{ id: 1, nombre: 'Lead 1', asesor_id: 2 }]]);
    
    const res = await request(app)
      .get('/api/leads')
      .set('Cookie', [`jwt=${tokenAsesor}`]);
    
    expect(res.status).toBe(200);
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('WHERE asesor_id = ?'), [2]);
  });

  it('PUT /api/leads/:id - Debe denegar si un asesor intenta editar un lead ajeno', async () => {
    // Simulamos que el lead pertenece al asesor 3 (no es el 2)
    pool.query.mockResolvedValueOnce([[{ asesor_id: 3 }]]);
    
    const res = await request(app)
      .put('/api/leads/1')
      .set('Cookie', [`jwt=${tokenAsesor}`])
      .send({ nombre: 'Hack', email: 'hack@test.com' });
    
    expect(res.status).toBe(403); // Forbidden
  });

  it('DELETE /api/leads/:id - Debe permitir al admin borrar cualquier lead', async () => {
    pool.query.mockResolvedValueOnce([[{ asesor_id: 2 }]]); // Lead del asesor 2
    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // Simula el delete
    
    const res = await request(app)
      .delete('/api/leads/1')
      .set('Cookie', [`jwt=${tokenAdmin}`]); // Admin lo borra
    
    expect(res.status).toBe(200);
  });
});