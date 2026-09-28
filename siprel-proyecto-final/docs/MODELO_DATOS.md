# Modelo de datos

Tablas principales: `roles`, `cuentas`, `categorias_equipo`, `equipos`, `reservas`, `prestamos`, `prestamo_detalle`, `incidencias`, `historial_equipo` y `bitacora_seguridad`.

## Seguridad de credenciales

`cuentas.password_hash` almacena bcrypt (255 caracteres). No existe columna de password en texto plano.

## Integridad referencial

`cuentas` se relaciona con roles, reservas, prestamos, incidencias, historial y bitacora. Por eso la eliminacion administrativa de usuarios es una **baja logica** (`activo=0`).

## Acceso desde la API

El usuario MariaDB `siprel_app` tiene solamente `EXECUTE` sobre `siprel_db.*`. Los procedimientos, creados durante inicializacion con definidor privilegiado, encapsulan el acceso a tablas.
