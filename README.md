# Proyecto Productivo SIGL - API de Gestión de Leads

API RESTful desarrollada en Node.js y Express para la gestión segura de clientes potenciales (Leads).  
**SENA — Análisis y Desarrollo de Software — Ficha 3118307**  
**Aprendiz:** JULIAN ENRIQUE OCAMPO LOPEZ

---

## 🚀 Estado del Proyecto (Etapa Productiva)
Actualmente el proyecto se encuentra en la **Fase 0: Seguridad Crítica Inmediata** de la etapa productiva.
Se han implementado las siguientes mejoras de seguridad:
*   Validación estricta de variables de entorno al iniciar el servidor.
*   Configuración restrictiva de CORS mediante lista blanca (whitelist).
*   Manejo global de errores y saneamiento de respuestas de base de datos.

---

## Descripción General
Servicio web de autenticación desarrollado con Node.js, Express y MySQL.  
Implementa registro de usuarios, inicio de sesión con JWT y rutas protegidas por middleware.

El proyecto incluye:
- Backend desplegado en **Railway**
- Frontend estático desplegado en **Vercel**
- Pruebas unitarias e integración con **Jest + Supertest**
- Pruebas end‑to‑end con **Cypress** (local y remoto)
- Gestor de paquetes **pnpm** (más seguro y rápido que npm)

---

## Tecnologías
- Node.js v22 + Express
- MySQL 9.5 + mysql2
- JSON Web Tokens (JWT)
- bcryptjs para hash de contraseñas
- dotenv para variables de entorno
- **pnpm** (gestor de paquetes)
- **Jest** + **Supertest** (pruebas)
- **Cypress** (pruebas E2E)

---

## Scripts de Base de Datos
- `database.sql` – Script principal para crear la base de datos `leads_db` y la tabla `usuarios`.
- `update.sql` – Script para actualizar el hash de la contraseña del usuario administrador en despliegues en la nube (Railway).

---

## Instalación y ejecución local

```bash
git clone https://github.com/JULIAN04301969/Proyecto-Productivo-SIGL.git
cd Proyecto-Productivo-SIGL
pnpm install