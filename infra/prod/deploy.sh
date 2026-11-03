#!/usr/bin/env bash
# Build and (re)start the backend from the latest main. Safe to run any time; migrations run on start.
#   /opt/casecraft/infra/prod/deploy.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
compose() { docker compose -f infra/prod/docker-compose.yml --env-file infra/prod/.env "$@"; }

if [[ "${SKIP_PULL:-}" != "1" ]]; then
  git fetch --quiet origin main
  git reset --hard --quiet origin/main
fi
echo "==> $(git log --oneline -1)"

compose build medusa-server
compose up -d --remove-orphans

echo "==> Waiting for the API to report healthy"
for _ in $(seq 1 60); do
  state=$(docker inspect -f '{{.State.Health.Status}}' "$(compose ps -q medusa-server)" 2>/dev/null || echo starting)
  [[ "$state" == healthy ]] && break
  sleep 5
done
compose ps
if [[ "$state" != healthy ]]; then
  echo "The API did not become healthy. Last log lines:" >&2
  compose logs --tail 80 medusa-server >&2
  exit 1
fi
docker image prune -f >/dev/null
domain=$(grep '^API_DOMAIN=' infra/prod/.env | cut -d= -f2)
echo "==> Live: https://$domain/health  ·  admin: https://$domain/app"
