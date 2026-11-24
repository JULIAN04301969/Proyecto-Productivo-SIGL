# Constitución del Proyecto SIGL

Documento normativo vinculante. Toda modificación de código debe cumplirlo.
Si una tarea entra en conflicto con esta constitución, prevalece la constitución.

## 1. Stack y restricciones no negociables
- Node.js + Express + MySQL (mysql2/promise) + JWT + bcrypt + Jest + Supertest.
- PROHIBIDO: Helmet, Knex, Swagger, Winston, Pino.
- Librerías adicionales permitidas solo si son estándar y justificadas
  (ej. cookie-parser para cookies HttpOnly).

## 2. Seguridad
- Tokens JWT NO se exponen al JavaScript del cliente (cookie HttpOnly + SameSite).
- CORS restrictivo con whitelist explícita y `credentials: true`.
- Toda entrada se valida antes de tocar la BD (defensa en profundidad).
- Contraseñas siempre con bcrypt; nunca loggear credenciales ni tokens.

## 3. Arquitectura
- Capas separadas: rutas → controladores → servicios → repositorio/modelo.
- Principios SOLID y DRY. Sin lógica de negocio en controladores.
- Tipado estricto en contratos (JSDoc con @typedef cuando no haya TS).
- Manejo defensivo de errores: toda ruta responde con código HTTP semántico
  y cuerpo JSON consistente `{ error: string, code: string }`.

## 4. Comentarios
- Se comenta el POR QUÉ (decisión de negocio, trade-off, restricción técnica).
- Prohibido comentar el QUÉ obvio (ej. `// suma 1`).
- Cada bloque de lógica compleja debe responder: ¿qué se rompe si lo quito?

## 5. Pruebas
- Todo endpoint nuevo o modificado requiere:
  - Test unitario del servicio (si aplica).
  - Test de integración con Supertest cubriendo happy path + bordes.
- Cobertura mínima de casos: campos obligatorios ausentes, tipos inválidos,
  valores límite, auth fallida, errores de BD simulados.
- No se cierra un paso sin `npm test` en verde y evidencia (captura).

## 6. Proceso de entrega
- Fase 1: Análisis + Contrato + Matriz de bordes → esperar aprobación.
- Fase 2: Archivos COMPLETOS (nunca fragmentos) + suite de tests.
- Fase 3: Reporte de Validación (matriz de pruebas ejecutadas + resultados
  reales + self-review de seguridad/rendimiento y deuda técnica).

## 7. Evidencias SENA
- Cada paso cerrado deja captura de Postman / DevTools / salida de Jest.
- Sin evidencia, el paso no existe para la bitácora.

## 8. Fuera de alcance SIGL — pista de aprendizaje personal
Las librerías Helmet, Knex, Swagger, Winston y Pino NO están prohibidas por
criterio técnico, sino porque SIGL se evalúa sobre implementación manual
de esos conceptos. Queda abierta, como pista paralela, la exploración de
dichas herramientas en ramas o repositorios SEPARADOS del código evaluable,
sujetos a las mismas reglas de esta constitución (tests, comentarios,
self-review, evidencias).