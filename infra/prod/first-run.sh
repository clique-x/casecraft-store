#!/usr/bin/env bash
# Run once after the first deploy: loads the India store and the catalogue, creates your admin login,
# saves the store keys in .env, and builds and starts the storefront.
#   /opt/casecraft/infra/prod/first-run.sh you@example.com
# Safe to run again (the seed only adds what is missing), e.g. after new products are exported.
set -euo pipefail
cd "$(dirname "$0")/../.."
compose() { docker compose -f infra/prod/docker-compose.yml --env-file infra/prod/.env "$@"; }
ENV_FILE=infra/prod/.env
set_var() { sed -i "s|^$1=.*|$1=$2|" "$ENV_FILE"; grep -q "^$1=" "$ENV_FILE" || echo "$1=$2" >> "$ENV_FILE"; }

email="${1:-}"
echo "==> Seeding the store and catalogue"
out=$(compose exec -T medusa-server npx medusa exec ./src/scripts/seed.js 2>&1 | tee /dev/stderr)
key=$(grep -o 'MEDUSA_PUBLISHABLE_KEY=pk_[A-Za-z0-9]*' <<<"$out" | head -1 | cut -d= -f2 || true)
region=$(grep -o 'MEDUSA_REGION_ID=reg_[A-Za-z0-9]*' <<<"$out" | head -1 | cut -d= -f2 || true)
if [[ -z "$key" || -z "$region" ]]; then echo "Could not read the publishable key and region from the seed output." >&2; exit 1; fi
set_var MEDUSA_PUBLISHABLE_KEY "$key"
set_var MEDUSA_REGION_ID "$region"
echo "==> Saved MEDUSA_PUBLISHABLE_KEY and MEDUSA_REGION_ID in $ENV_FILE"

if [[ -n "$email" ]]; then
  password=$(openssl rand -base64 18)
  echo "==> Creating admin user $email"
  if compose exec -T medusa-server npx medusa user -e "$email" -p "$password" >/dev/null 2>&1; then
    echo "Admin login: $email / $password   (change it in the admin under Settings → Profile)"
  else
    echo "Admin user $email not created (it may exist already)."
  fi
fi

echo "==> Building and starting the storefront"
SKIP_PULL=1 "$(dirname "$0")/deploy.sh"
