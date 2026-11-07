#!/usr/bin/env bash
# Build and (re)start the platform from the latest main. Safe to run any time; migrations run on start.
#   /opt/casecraft/infra/prod/deploy.sh
# The storefront is built once first-run.sh has written the store keys into .env.
set -euo pipefail
cd "$(dirname "$0")/../.."
envget() { { grep "^$1=" infra/prod/.env || true; } | tail -1 | cut -d= -f2-; }
# Caddy serves 80/443 unless the server's own nginx does (PROXY=nginx, set by use-host-nginx.sh).
# If another program already holds port 80, Caddy could not start anyway: skip it and say what to do.
proxy="$(envget PROXY)"
if [[ "$proxy" != nginx ]]; then
  holder=""
  if command -v ss >/dev/null; then
    holder=$(ss -tlnpH 'sport = :80' 2>/dev/null | grep -o 'users:(("[^"]*' | cut -d'"' -f2 | head -1 || true)
  elif (exec 3<>/dev/tcp/127.0.0.1/80) 2>/dev/null && [[ "$(docker inspect -f '{{.State.Running}}' casecraft-caddy-1 2>/dev/null)" != true ]]; then
    holder="another program"
  fi
  if [[ -n "$holder" && "$holder" != docker-proxy ]]; then
    echo "==> Port 80 is held by $holder, so Caddy is not started. Run infra/prod/use-host-nginx.sh <email> to serve the domains through it."
    proxy=nginx
    docker rm -f casecraft-caddy-1 >/dev/null 2>&1 || true
  fi
fi
if [[ "$proxy" == nginx ]]; then PROXY_PROFILE=""; else PROXY_PROFILE="caddy"; fi
compose() { COMPOSE_PROFILES="${PROFILES:-$PROXY_PROFILE}" docker compose -f infra/prod/docker-compose.yml --env-file infra/prod/.env "$@"; }

wait_healthy() {  # service, tries
  local id state=starting
  for _ in $(seq 1 "${2:-60}"); do
    id=$(compose ps -q "$1" 2>/dev/null || true)
    state=$( [[ -n "$id" ]] && docker inspect -f '{{.State.Health.Status}}' "$id" 2>/dev/null || echo starting)
    [[ "$state" == healthy ]] && return 0
    sleep 5
  done
  echo "$1 did not become healthy. Last log lines:" >&2
  compose logs --tail 80 "$1" >&2
  return 1
}

if [[ "${SKIP_PULL:-}" != "1" ]]; then
  git fetch --quiet origin main
  git reset --hard --quiet origin/main
fi
echo "==> $(git log --oneline -1)"

echo "==> Backend"
compose build medusa-server
compose up -d --remove-orphans
wait_healthy medusa-server

if grep -q '^MEDUSA_PUBLISHABLE_KEY=pk_' infra/prod/.env; then
  # The seed only adds what is missing: new products from data/catalog.json are created and stocked,
  # existing products, prices and stock counts (including edits made in the admin) are left alone.
  echo "==> Catalogue: adding new products"
  if ! seed_out=$(compose exec -T medusa-server npx medusa exec ./src/scripts/seed.js 2>&1); then
    echo "$seed_out" >&2
    echo "The catalogue seed failed; the storefront was not rebuilt." >&2
    exit 1
  fi
  grep -E 'Created|Stocked|added' <<<"$seed_out" || echo "    (no new products)"

  echo "==> Storefront (built from the live catalogue)"
  key=$(envget MEDUSA_PUBLISHABLE_KEY)
  region=$(envget MEDUSA_REGION_ID)
  mport=$(envget MEDUSA_HOST_PORT); mport="${mport:-9100}"
  # Host network: the build reads the catalogue from Medusa on 127.0.0.1 (published on loopback only).
  docker build --network host -f apps/storefront/Dockerfile \
    --build-arg MEDUSA_BACKEND_URL="http://127.0.0.1:$mport" \
    --build-arg MEDUSA_PUBLISHABLE_KEY="$key" \
    --build-arg MEDUSA_REGION_ID="$region" \
    -t casecraft-storefront:latest .
  PROFILES="web${PROXY_PROFILE:+,$PROXY_PROFILE}" compose up -d storefront
  PROFILES="web${PROXY_PROFILE:+,$PROXY_PROFILE}" wait_healthy storefront 40
else
  echo "==> Storefront skipped: run infra/prod/first-run.sh once to load the store and start it"
fi

PROFILES="web${PROXY_PROFILE:+,$PROXY_PROFILE}" compose ps
docker image prune -f >/dev/null
site=$(grep '^SITE_DOMAIN=' infra/prod/.env | cut -d= -f2)
api=$(grep '^API_DOMAIN=' infra/prod/.env | cut -d= -f2)
echo "==> Store: https://$site   API: https://$api/health   Admin: https://$api/app"
