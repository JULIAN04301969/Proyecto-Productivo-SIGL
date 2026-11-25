# Proyecto Productivo SIGL — API de Gestión de Leads

API REST de autenticación para el Sistema Integral de Gestión de Leads (SIGL), desarrollada con Node.js, Express y MySQL.

**SENA — Análisis y Desarrollo de Software — Ficha 3118307**  
**Aprendiz:** JULIAN ENRIQUE OCAMPO LOPEZ

## Estado y alcance

La fase actual implementa autenticación de usuarios mediante JWT almacenado en una cookie `HttpOnly`.

- El backend permite registrar usuarios, iniciar/cerrar sesión, consultar el perfil y verificar la conexión a MySQL.
- El JWT no se devuelve en el cuerpo JSON ni se almacena en `sessionStorage`.
- El módulo de leads del frontend es actualmente una **demostración local**: sus datos se guardan en `sessionStorage` y todavía no se persisten en MySQL ni se gestionan mediante endpoints de leads.
- El backend y el frontend tienen configuraciones para despliegue en Railway y Vercel, respectivamente.

## Tecnologías

- Node.js 22 y Express 5
- MySQL y `mysql2/promise`
- JWT (`jsonwebtoken`), `cookie-parser` y `bcryptjs`
- `dotenv` y `dotenv-cli`
- pnpm
- Jest y Supertest
- Cypress
- HTML, CSS, JavaScript ES Modules y Materialize CSS

## Requisitos

- Node.js 22 o superior
- pnpm
- MySQL 9.5 (o una versión compatible)

## Instalación local

### 1. Clonar e instalar dependencias

```bash
git clone https://github.com/JULIAN04301969/Proyecto-Productivo-SIGL.git
cd Proyecto-Productivo-SIGL
pnpm install
```

### 2. Configurar variables de entorno

Crea `.env` a partir de la plantilla. En PowerShell:

```powershell
Copy-Item .env.example .env
```

En macOS, Linux o Git Bash:

```bash
cp .env.example .env
```

Edita `.env` y configura los valores de tu entorno:

| Variable | Requerida | Descripción |
|---|---:|---|
| `PORT` | Sí | Puerto del servidor, normalmente `3000`. |
| `DB_HOST` | Sí | Host de MySQL, normalmente `localhost`. |
| `DB_PORT` | No | Puerto de MySQL; por defecto `3306`. |
| `DB_USER` | Sí | Usuario de MySQL. |
| `DB_PASSWORD` | Sí | Contraseña de MySQL. |
| `DB_NAME` | Sí | Base de datos; para la instalación inicial, `leads_db`. |
| `JWT_SECRET` | Sí | Secreto largo, único y privado para firmar JWT. No uses el valor de ejemplo en producción. |
| `JWT_EXPIRES_IN` | No | Vigencia del JWT, por ejemplo `1h` u `8h`; por defecto `8h`. |
| `FRONTEND_URL` | Sí | Origen autorizado del frontend, por ejemplo `http://127.0.0.1:5500`. |
| `NODE_ENV` | No | Usa `development` localmente y `production` en despliegue. Afecta las opciones de la cookie. |

El servidor valida las variables marcadas como requeridas al iniciar. Mantén `.env` fuera del repositorio y no compartas sus secretos.

### 3. Crear la base de datos

Inicia MySQL y ejecuta [`database.sql`](./database.sql) con MySQL Workbench o una herramienta equivalente. El script crea la base `leads_db`, la tabla `usuarios` y un usuario administrador de demostración.

La cuenta sembrada por el script es solo para desarrollo. Cambia su contraseña antes de usar el sistema en un entorno real. [`update.sql`](./update.sql) modifica el hash de contraseña del administrador; úsalo únicamente cuando hayas preparado el hash que deseas establecer.

### 4. Iniciar el backend y abrir el frontend

Con MySQL activo y `.env` configurado, inicia el servidor en modo desarrollo:

```bash
pnpm dev
```

También puedes iniciarlo sin Nodemon:

```bash
pnpm start
```

Express sirve el contenido de `frontend/` y `public/`. Abre `http://localhost:3000/` para cargar el frontend.

También puedes usar Live Server desde la raíz del repositorio. En ese caso, configura `FRONTEND_URL` con el origen exacto de Live Server (por ejemplo, `http://127.0.0.1:5500`) y abre `http://127.0.0.1:5500/frontend/index.html`.

## Endpoints

La API local usa `http://localhost:3000` como URL base.

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `POST` | `/api/auth/registro` | Público | Registra un usuario. Requiere `nombre`, `email` y `password`; `rol` es opcional. |
| `POST` | `/api/auth/login` | Público | Verifica las credenciales y establece la cookie JWT `HttpOnly`. |
| `POST` | `/api/auth/logout` | Público | Borra la cookie de sesión, incluso si el JWT ya expiró. |
| `GET` | `/api/auth/perfil` | Cookie válida | Devuelve el perfil del usuario autenticado. |
| `GET` | `/api/estado` | Público | Informa el estado de la API y de la conexión a MySQL. Puede responder `503` si la base de datos no está disponible. |

El registro valida el formato del correo y exige una contraseña de al menos seis caracteres. Los roles admitidos son `admin`, `asesor` y `supervisor`; si se omite un rol o no es válido, se asigna `asesor`.

### Flujo de autenticación desde el navegador

El login devuelve los datos del usuario y envía el JWT mediante `Set-Cookie`; **no devuelve el token en el JSON**. Las peticiones del frontend deben incluir credenciales (`credentials: 'include'`) para que el navegador envíe la cookie. El endpoint de perfil no usa `Authorization: Bearer`.

## Seguridad: consideraciones actuales

- `HttpOnly` impide que JavaScript lea directamente la cookie, pero no evita que un XSS realice peticiones autenticadas. Se requieren validación de entradas, escape contextual de salidas y otras defensas de aplicación.
- En desarrollo la cookie usa `SameSite=Lax`; en producción usa `SameSite=None; Secure` para permitir el flujo entre sitios distintos.
- CORS restringe los orígenes permitidos, pero **no es por sí solo una protección CSRF completa**. Antes de agregar endpoints autenticados que modifiquen datos, implementa y valida una defensa CSRF, por ejemplo un patrón Double Submit Cookie.
- La duración de la cookie se calcula a partir de la expiración del JWT.
- La configuración de CORS permite credenciales y debe incluir únicamente los orígenes de frontend confiables.

## Pruebas

### Jest y Supertest

Ejecuta la suite:

```bash
pnpm test
```

Las pruebas de autenticación ejercitan la aplicación HTTP con Supertest. MySQL se simula con mocks para que la suite sea reproducible y no dependa de una base de datos activa; por tanto, estas pruebas **no sustituyen una validación contra MySQL real**. La aplicación también valida la presencia de variables requeridas al cargarse, así que configura `.env` antes de ejecutar Jest.

El proyecto incluye el comando `pnpm test:integration`, que carga `.env.test` mediante `dotenv-cli`. En Windows PowerShell, si el prefijo `NODE_ENV=test` del script no es reconocido, puedes ejecutar:

```powershell
$env:NODE_ENV = 'test'
pnpm exec dotenv -e .env.test -- pnpm exec jest --runInBand tests/auth.integration.test.js
Remove-Item Env:NODE_ENV
```

La prueba de cookies también usa una base de datos simulada; el nombre del archivo no implica que se conecte a MySQL real.

### Cypress

Abre Cypress con:

```bash
pnpm cypress:open
```

La prueba `cypress/e2e/flujo_auth.cy.js` espera el frontend en `http://127.0.0.1:5500/frontend/index.html`, el backend local en el puerto `3000`, MySQL activo y una cuenta de prueba con las credenciales definidas en ese archivo. Configura esos requisitos antes de ejecutar la prueba.

## Despliegue

Configura en Railway las variables requeridas por el backend, con `NODE_ENV=production`, y define `FRONTEND_URL` con el origen real del frontend en Vercel. El frontend debe apuntar a la URL pública actual de la API. En producción, la cookie requiere HTTPS porque se envía con `Secure`.

No uses valores de desarrollo ni secretos del repositorio en producción. Asegúrate de que los orígenes autorizados y los dominios de cookie correspondan al despliegue real.
