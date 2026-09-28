# Arquitectura de SIPREL

## Objetivo

SIPREL administra prestamos, reservas e incidencias de equipos de laboratorio. La aplicacion se compone de un front end Angular, una API REST Node/Express y una base MariaDB. La version final incorpora seguridad desde el diseno.

## Componentes

```text
Navegador
   |
   | HTTPS :8443
   v
Nginx + Angular
   |
   | proxy /api
   v
Node / Express :3000
   |
   | CALL Stored Procedures
   v
MariaDB :3306
```

## Limites de confianza

1. **Navegador -> Nginx:** datos del usuario no confiables. Se fuerza HTTPS y se aplican cabeceras CSP/HSTS.
2. **Nginx -> API:** trafico interno de la red Docker. La API sigue validando JWT, rol y entrada; no confia en el front end.
3. **API -> MariaDB:** la cuenta `siprel_app` solo tiene permiso `EXECUTE` sobre Stored Procedures.
4. **ADMIN -> modulo administrativo:** tanto el guard de Angular como la API exigen rol ADMIN; el backend es la autoridad final.

## Autenticacion y autorizacion

- El registro publico crea unicamente cuentas `SOLICITANTE`.
- Las contrasenas se hashean con bcrypt, cost 12.
- El login compara el hash en la API y emite JWT HS256 de 15 minutos.
- Los tokens se conservan en `sessionStorage` para reducir persistencia entre sesiones del navegador.
- El backend aplica RBAC en endpoints administrativos.
- El detalle de prestamos comprueba propietario o rol privilegiado para evitar IDOR.

## Base de datos

Toda operacion de la API se realiza con `CALL usp_*` y parametros. No se construyen consultas concatenando datos del usuario. El usuario de aplicacion no tiene permisos directos sobre tablas.

## Despliegue de laboratorio

Docker Compose levanta:

- `siprel-db`: MariaDB 11.4.
- `siprel-api`: Node 20 + Express.
- `siprel-frontend`: Nginx 1.26 con Angular y TLS local.
- `siprel-adminer`: herramienta de administracion local.

Los puertos de MariaDB, API y Adminer se enlazan a `127.0.0.1`; el frontend se publica en `8082/8443`.
