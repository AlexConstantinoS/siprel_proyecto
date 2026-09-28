# Configuracion paso a paso

## 1. Descomprimir y entrar

```bash
unzip siprel-proyecto-final.zip
cd siprel-proyecto-final
```

## 2. Generar secretos locales

```bash
chmod +x scripts/*.sh
./scripts/configurar.sh
```

Se crea `.env` con passwords aleatorios para MariaDB y un `JWT_SECRET` aleatorio. No compartas ese archivo.

## 3. Si vienes de SIPREL Fase 0

La base final no es compatible con el volumen anterior porque ahora usa `password_hash` y procedimientos seguros.

```bash
docker compose down -v --remove-orphans
```

Este comando elimina la BD local anterior.

## 4. Construir y levantar

```bash
docker compose up -d --build
```

## 5. Validar

```bash
docker compose ps
./scripts/verificar.sh
```

Los cuatro contenedores deben aparecer `Up` y `siprel-db` debe mostrar `healthy`.

## 6. Abrir la aplicacion

- `https://localhost:8443`
- acepta la excepcion del certificado autofirmado solo para este laboratorio.

El puerto `8082` solo redirige a HTTPS.

## 7. Primer acceso

```text
usuario: admin
password: Admin123!
```

Entra a **Usuarios** para crear, consultar, editar y dar de baja cuentas.

## 8. Adminer

Abrir `http://localhost:8081`.

- Sistema: MySQL
- Servidor: `db` si Adminer corre dentro de Compose. Si la interfaz no resuelve `db`, usa el servicio preconfigurado desde el contenedor.
- Usuario de aplicacion: `siprel_app`
- Password: valor de `DB_APP_PASSWORD` en `.env`
- BD: `siprel_db`

La cuenta de aplicacion no tiene acceso directo a tablas por diseno. Para administracion completa usa root con el valor `DB_ROOT_PASSWORD` exclusivamente en laboratorio.

## 9. Pruebas de seguridad

Sigue `pentest/GUIA_SAST_DAST.md` y guarda resultados en:

```text
pentest/evidencias/antes/
pentest/evidencias/despues/
```
