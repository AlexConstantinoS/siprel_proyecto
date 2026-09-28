#!/usr/bin/env sh
set -eu
if ! command -v openssl >/dev/null 2>&1; then echo "Se requiere openssl para generar secretos." >&2; exit 1; fi
ROOT_PASS="$(openssl rand -hex 18)"
APP_PASS="$(openssl rand -hex 18)"
JWT_SECRET="$(openssl rand -hex 48)"
cat > .env <<ENV
DB_ROOT_PASSWORD=${ROOT_PASS}
DB_APP_PASSWORD=${APP_PASS}
JWT_SECRET=${JWT_SECRET}
ENV
chmod 600 .env
echo "Archivo .env generado. No lo subas al repositorio."
