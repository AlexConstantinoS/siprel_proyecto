# Modelado de amenazas STRIDE

| ID | Categoria STRIDE | Amenaza | Componente | Riesgo | Contramedida implementada |
|---|---|---|---|---|---|
| T01 | Spoofing | Fuerza bruta de credenciales | Login | Alto | bcrypt + 5 intentos/15 min + auditoria |
| T02 | Spoofing | Token JWT falsificado | API | Alto | HS256, secreto aleatorio >= 32 caracteres, algoritmo fijado |
| T03 | Tampering | Manipulacion de parametros de busqueda para SQLi | Equipos/BD | Critico | SP parametrizado sin SQL dinamico |
| T04 | Tampering | Manipulacion de rol desde el front end | Usuarios | Alto | el backend toma rol del JWT y exige ADMIN |
| T05 | Repudiation | Usuario niega haber realizado una operacion administrativa | CRUD usuarios | Medio | bitacora con usuario, accion, fecha, IP y User-Agent |
| T06 | Repudiation | Negacion de intento de acceso fallido | Login | Medio | LOGIN_FALLIDO auditado sin registrar password |
| T07 | Information Disclosure | IDOR sobre prestamos ajenos | Prestamos | Alto | SP recibe cuenta autenticada y rol |
| T08 | Information Disclosure | Stack trace o SQL expuesto | API | Alto | manejador central devuelve mensajes genericos |
| T09 | Information Disclosure | XSS almacenado en incidencias | Front end | Alto | interpolacion Angular + CSP + validacion de longitud |
| T10 | Denial of Service | Abuso de login, registro o busquedas | API | Medio | rate limiting por IP y limites de payload |
| T11 | Elevation of Privilege | SOLICITANTE consulta `/admin/usuarios` | API | Critico | `requireRole('ADMIN')` + 403 + auditoria |
| T12 | Elevation of Privilege | Acceso directo a tablas por credenciales de la API | MariaDB | Alto | `siprel_app` solo tiene EXECUTE sobre SPs |
