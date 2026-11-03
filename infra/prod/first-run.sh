#!/usr/bin/env bash
# Run once after the first deploy: loads the India store and the catalogue, and creates your admin login.
#   /opt/casecraft/infra/prod/first-run.sh you@example.com
# The seed is safe to run again (it only adds what is missing), e.g. after new products are exported.
set -euo pipefail
cd "$(dirname "$0")/../.."
compose() { docker compose -f infra/prod/docker-compose.yml --env-file infra/prod/.env "$@"; }

email="${1:-}"
echo "==> Seeding the store and catalogue"
compose exec -T medusa-server npx medusa exec ./src/scripts/seed.js

if [[ -n "$email" ]]; then
  password=$(openssl rand -base64 18)
  echo "==> Creating admin user $email"
  compose exec -T medusa-server npx medusa user -e "$email" -p "$password"
  echo "Admin login: $email / $password   (change it in the admin under Settings → Profile)"
fi

domain=$(grep '^API_DOMAIN=' infra/prod/.env | cut -d= -f2)
secret=$(grep '^STOREFRONT_REVALIDATE_SECRET=' infra/prod/.env | cut -d= -f2)
cat <<NEXT

Storefront settings for Vercel (Project → Settings → Environment Variables, Production):
  MEDUSA_BACKEND_URL=https://$domain
  MEDUSA_PUBLISHABLE_KEY=<the MEDUSA_PUBLISHABLE_KEY printed by the seed above>
  MEDUSA_REGION_ID=<the MEDUSA_REGION_ID printed by the seed above>
  REVALIDATE_SECRET=$secret
Then redeploy the storefront. Admin: https://$domain/app
NEXT
