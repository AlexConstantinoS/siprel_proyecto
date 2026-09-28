# Matriz de cumplimiento del proyecto final

| Punto del proyecto | Implementacion SIPREL | Evidencia |
|---|---|---|
| 1. Definicion | Registro/login, catalogo sensible y administracion por rol | README + arquitectura + aplicacion |
| 2. Modelado de amenazas | DFD y 12 amenazas STRIDE | `docs/DFD.md`, `docs/STRIDE.md` |
| 3. Inyeccion y validacion | SP parametrizados, usuario DB solo EXECUTE, validacion cliente/servidor | `database/04_sp_final.sql`, backend/frontend |
| 4. Auth y acceso | bcrypt, JWT 15 min, RBAC, proteccion IDOR, login generico | `auth.routes.js`, `auth.js`, SP seguro |
| 5. Errores/configuracion | error handler generico, CSP/HSTS/nosniff/frame, HTTPS | `backend/src/app.js`, `frontend/nginx.conf` |
| 6. API | CORS restrictivo, rate limiting, endpoints autenticados | `security.js`, `rate-limit.js`, rutas |
| 7. Auditoria | login, CRUD, reservas, incidencias y denegaciones | `bitacora_seguridad`, middleware `audit.js` |
| 8. Verificacion | estructura antes/despues, guia Semgrep/SonarLint + ZAP | `pentest/` |

## Ampliacion CRUD funcional

- Equipos: CRUD administrativo completo para ADMIN, con baja logica y validacion de prestamos activos.
- Prestamos: CRUD de gestion para ADMIN/ENCARGADO, con cancelacion logica, control de estados y trazabilidad.
- SOLICITANTE conserva acceso de solo lectura a sus propios prestamos y al catalogo activo de equipos.
