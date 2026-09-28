# SIPREL - Proyecto integrador final seguro

**Sistema de Prestamos y Reservas de Equipos de Laboratorio** desarrollado para el proyecto final de Seguridad en Aplicaciones Web.

La entrega integra front end Angular, API REST Node/Express, MariaDB, Stored Procedures, Docker Compose, documentacion DFD/STRIDE y estructura para las evidencias SAST/DAST.

## Controles implementados

- Registro y login.
- Hash de contrasenas con bcrypt (cost 12).
- JWT HS256 con expiracion de 15 minutos.
- RBAC: ADMIN, ENCARGADO y SOLICITANTE.
- CRUD completo de usuarios exclusivo para ADMIN.
- Proteccion IDOR en detalle de prestamos.
- Consultas a BD exclusivamente mediante Stored Procedures parametrizados.
- Usuario `siprel_app` con permiso `EXECUTE`, sin SELECT/INSERT/UPDATE directo sobre tablas.
- Validacion de entrada en frontend y backend.
- CORS restringido.
- Rate limiting global, en login, registro y busquedas.
- Manejo centralizado de errores sin stack trace al cliente.
- Helmet y cabeceras de seguridad en Nginx.
- HTTPS local con certificado autofirmado generado en la imagen del frontend.
- Auditoria de login, altas/cambios/bajas, reservas, incidencias y accesos denegados.

## Inicio rapido

Requisitos: Docker Engine, Docker Compose v2 y OpenSSL.

```bash
cd siprel-proyecto-final
./scripts/configurar.sh
docker compose up -d --build
```

Abrir:

- Aplicacion segura: **https://localhost:8443**
- HTTP: `http://localhost:8082` redirige a HTTPS.
- API local: `http://localhost:3000/api/v1/health`
- Adminer local: `http://localhost:8081`
- MariaDB local: `127.0.0.1:3307`

El navegador mostrara una advertencia porque el certificado de laboratorio es autofirmado. Para produccion se debe sustituir por un certificado emitido por una CA confiable.

## Credenciales de demostracion

| Usuario | Contrasena | Rol |
|---|---|---|
| `admin` | `Admin123!` | ADMIN |
| `encargado` | `Encargado123!` | ENCARGADO |
| `jose` | `Jose123!` | SOLICITANTE |
| `maria` | `Maria123!` | SOLICITANTE |

Las contrasenas anteriores son exclusivamente datos de laboratorio; en la BD solo se guardan hashes bcrypt.

## Si ya ejecutaste una Fase 0 anterior

El esquema final cambia `password` por `password_hash` y cambia los Stored Procedures. Para evitar mezclar la BD vulnerable con la final, reinicia el volumen:

```bash
./scripts/configurar.sh   # solo si aun no tienes .env
docker compose down -v --remove-orphans
docker compose up -d --build
```

**`down -v` borra la BD local de laboratorio.** Haz respaldo si agregaste datos que deseas conservar.

## Verificacion rapida

```bash
./scripts/verificar.sh
```

Tambien puedes validar los procedimientos:

```bash
docker exec -it siprel-db mariadb \
  -uroot -p"$(grep DB_ROOT_PASSWORD .env | cut -d= -f2-)" \
  siprel_db -e "SHOW PROCEDURE STATUS WHERE Db='siprel_db';"
```

Y comprobar el minimo privilegio de la cuenta de aplicacion:

```bash
docker exec -it siprel-db mariadb \
  -uroot -p"$(grep DB_ROOT_PASSWORD .env | cut -d= -f2-)" \
  -e "SHOW GRANTS FOR 'siprel_app'@'%';"
```

## Estructura de la entrega

```text
backend/                  API REST y controles de seguridad
database/                 Tablas, datos demo, SPs y permisos minimos
frontend/                 Aplicacion Angular + Nginx HTTPS
docs/                     Arquitectura, DFD, STRIDE y controles
pentest/                  Alcance, guia SAST/DAST, reporte antes/despues
pentest/evidencias/       Carpetas para capturas y reportes exportados
postman/                  Coleccion de pruebas de API
scripts/                  Configuracion y verificacion
```

## Documentacion principal

1. `docs/ARQUITECTURA.md`
2. `docs/DFD.md`
3. `docs/STRIDE.md`
4. `docs/CONTROLES_SEGURIDAD.md`
5. `docs/MATRIZ_REQUISITOS.md`
6. `pentest/ALCANCE.md`
7. `pentest/GUIA_SAST_DAST.md`
8. `pentest/REPORTE_ANTES_DESPUES.md`
9. `docs/PRESENTACION_10_MIN.md`

## Nota sobre SAST/DAST

El ZIP incluye configuracion, comandos, plantilla y carpetas de evidencia. Los resultados finales de SonarLint/Semgrep y OWASP ZAP deben ejecutarse en la computadora donde se levante SIPREL, ya que constituyen evidencia del entorno real de presentacion. No se incluyen resultados inventados.

## CRUD completo agregado: Equipos y Prestamos

La version actual incluye CRUD administrativo adicional:

- **Equipos (ADMIN):** registrar, listar/buscar, editar y baja logica. La baja conserva historial y cancela reservas pendientes/aprobadas; no permite dar de baja un equipo ligado a un prestamo activo.
- **Prestamos (ADMIN y ENCARGADO):** registrar, listar, consultar detalle, editar estado/datos y cancelar logicamente. SOLICITANTE mantiene acceso solo a sus propios prestamos.
- Todas las operaciones de persistencia se realizan mediante Stored Procedures.
- Los cambios administrativos generan eventos en `bitacora_seguridad`.

### Actualizacion de una instalacion ya existente

Si ya tenias el volumen de MariaDB creado con una version anterior, los scripts de `/docker-entrypoint-initdb.d` no se ejecutan de nuevo automaticamente. Ejecuta una sola vez:

```bash
docker exec -i siprel-db mariadb \
  -uroot \
  -p"$(grep '^DB_ROOT_PASSWORD=' .env | cut -d= -f2-)" \
  siprel_db < database/06_crud_equipos_prestamos.sql
```

Luego reconstruye API y frontend sin eliminar la base:

```bash
docker compose up -d --build api frontend
docker compose ps
```

Para una instalacion desde cero, `06_crud_equipos_prestamos.sql` se ejecuta automaticamente durante la inicializacion de MariaDB.

## Flujo Reserva -> Prestamo (actualizacion)

- El SOLICITANTE selecciona el equipo por codigo y nombre; ya no captura IDs internos.
- ADMIN y ENCARGADO ven todas las reservas en `Reservas`.
- Una reserva inicia como `PENDIENTE`.
- El personal puede `APROBAR` o `RECHAZAR`.
- Una reserva `APROBADA` puede convertirse en un prestamo `PENDIENTE`.
- Al convertirla, la reserva pasa a `ATENDIDA` y el equipo a `RESERVADO`.
- El prestamo aparece inmediatamente en `Mis prestamos` del solicitante.
- Desde Gestion de prestamos, ADMIN/ENCARGADO puede cambiarlo a `ENTREGADO` y posteriormente `DEVUELTO`.

Para una base ya inicializada, ejecutar una sola vez `database/07_flujo_reservas_prestamos.sql` y reconstruir API/frontend.

### Actualizar una instalacion existente sin borrar datos

Si ya tienes SIPREL levantado y quieres agregar el flujo de gestion de reservas, ejecuta:

```bash
chmod +x scripts/*.sh
./scripts/aplicar-flujo-reservas.sh
```

No uses `docker compose down -v` para esta actualizacion, porque `-v` elimina el volumen de MariaDB.
