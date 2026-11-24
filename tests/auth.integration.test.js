const request = require('supertest');
const app = require('../src/index');
const { pool } = require('../src/config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

jest.mock('../src/config/database', () => ({
  pool: { query: jest.fn() },
  checkConnection: jest.fn(),
  testConnection: jest.fn()
}));

describe('Auth Integration - HttpOnly Cookies (Auditoría Final)', () => {
  const agent = request.agent(app);

  beforeAll(() => {
    process.env.JWT_SECRET = 'test_secret_key_sigl';
    process.env.NODE_ENV = 'test';
  });

  beforeEach(() => jest.clearAllMocks());

  it('Login: debe retornar 200, setear cookie HttpOnly y sincronizar Max-Age con el JWT', async () => {
    const hash = await bcrypt.hash('password123', 10);
    pool.query.mockResolvedValueOnce([[{ id: 1, nombre: 'Admin', email: 'admin@test.com', password_hash: hash, rol: 'admin', activo: 1 }]]);

    const res = await agent.post('/api/auth/login').send({ email: 'admin@test.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeUndefined(); // El token no va en el JSON
    
    const cookies = res.headers['set-cookie'];
    expect(cookies[0]).toContain('jwt=');
    expect(cookies[0]).toContain('HttpOnly');
    
    // Validar que la cookie expira al mismo tiempo que el JWT
    const tokenString = cookies[0].split('jwt=')[1].split(';')[0];
    const decodedJwt = jwt.decode(tokenString);
    
    // Extraer el Max-Age de la cookie (en segundos)
    const maxAgeMatch = cookies[0].match(/Max-Age=(\d+)/);
    expect(maxAgeMatch).not.toBeNull();
    const maxAgeMs = parseInt(maxAgeMatch[1], 10) * 1000;
    
    // Calcular la diferencia entre la expiración del JWT y el tiempo actual + maxAge
    const ahora = Date.now();
    const tiempoExpiracionJwt = decodedJwt.exp * 1000;
    const tiempoExpiracionCookie = ahora + maxAgeMs;
    
    // Tolerancia de 2 segundos (por el tiempo de ejecución del test)
    const diferencia = Math.abs(tiempoExpiracionJwt - tiempoExpiracionCookie);
    expect(diferencia).toBeLessThan(2000); 
  });

  it('Perfil: debe permitir acceso usando la cookie guardada por el agent', async () => {
    pool.query.mockResolvedValueOnce([[{ id: 1, nombre: 'Admin', email: 'admin@test.com', rol: 'admin', creado_en: new Date() }]]);
    const res = await agent.get('/api/auth/perfil');
    expect(res.status).toBe(200);
    expect(res.body.datos.email).toBe('admin@test.com');
  });

  it('Perfil: debe denegar acceso si no hay cookie', async () => {
    const res = await request(app).get('/api/auth/perfil');
    expect(res.status).toBe(401);
  });

  it('Logout: debe borrar la cookie de sesión (Expires en el pasado)', async () => {
    const res = await agent.post('/api/auth/logout');
    expect(res.status).toBe(200);
    const cookies = res.headers['set-cookie'];
    expect(cookies[0]).toContain('jwt=;');
    expect(cookies[0]).toContain('Expires=Thu, 01 Jan 1970'); 
  });
});