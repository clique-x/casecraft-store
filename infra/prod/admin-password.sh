#!/usr/bin/env bash
# Admin logins without email. The admin's "Forgot password?" sends its link by email, and the store has no
# email provider yet, so that email never arrives. This lists the admin logins, or gives one a new password:
#   /opt/casecraft/infra/prod/admin-password.sh                  list the admin logins
#   /opt/casecraft/infra/prod/admin-password.sh you@example.com  new random password for that login, printed once
set -euo pipefail
cd "$(dirname "$0")/../.."
docker compose -f infra/prod/docker-compose.yml --env-file infra/prod/.env \
  exec -T medusa-server npx medusa exec ./src/scripts/admin-password.js "$@" 2>&1 \
  | grep -Ev '^\s*$|^[^ ]*(info|warn)[^ ]*:' || true
