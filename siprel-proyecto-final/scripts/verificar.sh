#!/usr/bin/env sh
set -eu
echo "== Contenedores =="
docker compose ps
echo "\n== API =="
curl -sk https://localhost:8443/api/v1/health
echo "\n\n== Headers HTTPS =="
curl -skI https://localhost:8443 | sed -n '1,25p'
