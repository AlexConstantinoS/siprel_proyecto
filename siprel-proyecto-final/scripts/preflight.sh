#!/usr/bin/env sh
set -eu
node --check backend/src/app.js
find backend/src -name '*.js' -type f -exec node --check {} \;
python3 -m json.tool backend/package.json >/dev/null
python3 -m json.tool frontend/package.json >/dev/null
python3 -m json.tool postman/SIPREL_Final.postman_collection.json >/dev/null
if grep -RniE "origin:[[:space:]]*['\"]\*|expiresIn:[[:space:]]*['\"]7d|SELECT .*\+" backend/src >/dev/null 2>&1; then
  echo "Se encontro un patron inseguro inesperado." >&2
  exit 1
fi
echo "Preflight basico OK."
