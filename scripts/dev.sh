#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "Starting hub-db + hub-api containers..."
docker compose up -d

echo "Waiting for hub-api to be healthy..."
for i in $(seq 1 30); do
  if curl -sf http://localhost:8003/api/health > /dev/null 2>&1; then
    echo "hub-api is healthy."
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "hub-api did not become healthy in time. Check 'docker compose logs hub-api'."
    exit 1
  fi
  sleep 1
done

echo "Creating dev session..."
curl -sf -X POST http://localhost:8003/api/auth/dev-login -c /tmp/dc_dev_cookies.txt > /dev/null
echo "Dev session created. Cookies saved to /tmp/dc_dev_cookies.txt"

echo "Starting Astro dev server..."
npm run dev
