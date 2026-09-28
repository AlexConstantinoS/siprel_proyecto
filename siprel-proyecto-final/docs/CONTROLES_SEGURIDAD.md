# Controles de seguridad implementados

## Prevencion de inyeccion

`usp_BuscarEquipos` utiliza una consulta estatica con `LIKE CONCAT('%', p_filtro, '%')`. La API llama al procedimiento con placeholders de `mysql2`: `CALL usp_BuscarEquipos(?)`.

## Contrasenas

La API usa `bcryptjs` con cost 12. La base almacena `password_hash`; nunca devuelve el hash al navegador.

## JWT y sesiones

- HS256.
- Expiracion: 15 minutos.
- Secreto generado con `openssl rand -hex 48`.
- Algoritmo aceptado fijado a HS256 en verificacion.

## RBAC e IDOR

- `ADMIN`: CRUD usuarios y auditoria.
- `ENCARGADO`: acceso operativo ampliado a incidencias/prestamos.
- `SOLICITANTE`: sus prestamos, reservas e incidencias.
- El backend verifica permisos incluso si el front end oculta opciones.

## CORS y rate limiting

- Origen permitido por defecto: `https://localhost:8443`.
- Login: 5 solicitudes por 15 min/IP.
- Registro: 5 solicitudes por hora/IP.
- Busqueda: 100 solicitudes por minuto/IP.
- Limite global: 300 solicitudes por 15 min/IP.

## Manejo de errores

La API registra internamente el error y devuelve al cliente una respuesta generica. Solo se muestran mensajes controlados de validacion y reglas de negocio.

## HTTPS y headers

Nginx redirige HTTP a HTTPS y configura HSTS, CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy y Permissions-Policy. Para laboratorio se genera certificado autofirmado; en produccion debe instalarse certificado de CA.

## Auditoria

Se registran logins correctos/fallidos, registros, reservas, incidencias, operaciones del CRUD administrativo y accesos denegados. No se registran passwords, hashes ni JWT completos.
