#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [ ! -f .env ]; then
  echo "ERROR: no existe .env. Ejecuta primero ./scripts/configurar.sh"
  exit 1
fi

DB_ROOT_PASSWORD="$(grep '^DB_ROOT_PASSWORD=' .env | cut -d= -f2-)"
if [ -z "$DB_ROOT_PASSWORD" ]; then
  echo "ERROR: DB_ROOT_PASSWORD esta vacio en .env"
  exit 1
fi

if ! docker ps --format '{{.Names}}' | grep -qx 'siprel-db'; then
  echo "ERROR: siprel-db no esta ejecutandose. Levanta el proyecto primero."
  exit 1
fi

echo "Aplicando flujo Reserva -> Prestamo..."
docker exec -i siprel-db mariadb \
  -uroot \
  -p"$DB_ROOT_PASSWORD" \
  siprel_db < database/07_flujo_reservas_prestamos.sql

echo "Reconstruyendo API y frontend..."
docker compose up -d --build api frontend

echo "Verificando procedimientos..."
docker exec siprel-db mariadb \
  -uroot \
  -p"$DB_ROOT_PASSWORD" \
  siprel_db \
  -e "SHOW PROCEDURE STATUS WHERE Db='siprel_db' AND Name IN ('usp_ReservasListarGestion','usp_ReservaCambiarEstado','usp_ReservaConvertirAPrestamo');"

echo "Actualizacion aplicada. Abre https://localhost:8443"
