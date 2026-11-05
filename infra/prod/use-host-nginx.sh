#!/usr/bin/env bash
# For a server that already runs nginx on ports 80/443 (other sites): serve CaseCraft through that nginx
# instead of Caddy. Adds one nginx site for the store, www and api domains, gets their HTTPS certificates
# with certbot, and sets PROXY=nginx in infra/prod/.env. Other nginx sites are left as they are.
#   /opt/casecraft/infra/prod/use-host-nginx.sh you@example.com
# It then runs deploy.sh, so the store is built and started too.
set -euo pipefail
cd "$(dirname "$0")/../.."
ENV_FILE=infra/prod/.env
email="${1:-}"
if [[ $EUID -ne 0 ]]; then echo "Run as root." >&2; exit 1; fi
if [[ -z "$email" ]]; then echo "Usage: use-host-nginx.sh <email for certificate notices>" >&2; exit 1; fi
command -v nginx >/dev/null || { echo "nginx is not installed on this server." >&2; exit 1; }

envget() { { grep "^$1=" "$ENV_FILE" || true; } | tail -1 | cut -d= -f2-; }
set_var() { if grep -q "^$1=" "$ENV_FILE"; then sed -i "s|^$1=.*|$1=$2|" "$ENV_FILE"; else echo "$1=$2" >> "$ENV_FILE"; fi; }
site=$(envget SITE_DOMAIN); api=$(envget API_DOMAIN)
sport=$(envget STOREFRONT_HOST_PORT); sport="${sport:-3100}"
mport=$(envget MEDUSA_HOST_PORT); mport="${mport:-9100}"

# The two loopback ports must be free (or already ours).
for port in "$sport" "$mport"; do
  holder=$(ss -tlnpH "sport = :$port" 2>/dev/null | grep -o 'users:(("[^"]*' | cut -d'"' -f2 | head -1 || true)
  if [[ -n "$holder" && "$holder" != docker-proxy ]]; then
    echo "Port $port is used by $holder. Set another port in $ENV_FILE (STOREFRONT_HOST_PORT or MEDUSA_HOST_PORT) and run again." >&2
    exit 1
  fi
done

echo "==> PROXY=nginx in $ENV_FILE (Caddy will not be started)"
set_var PROXY nginx
set_var STOREFRONT_HOST_PORT "$sport"
set_var MEDUSA_HOST_PORT "$mport"
docker compose -f infra/prod/docker-compose.yml --env-file "$ENV_FILE" --profile caddy rm -sf caddy >/dev/null 2>&1 || true

echo "==> nginx site for $site, www.$site and $api"
conf=/etc/nginx/sites-available/casecraft.conf
sed -e "s/__SITE_DOMAIN__/$site/g" -e "s/__API_DOMAIN__/$api/g" \
    -e "s/__STOREFRONT_PORT__/$sport/g" -e "s/__MEDUSA_PORT__/$mport/g" \
    infra/prod/nginx-site.conf.template > "$conf"
ln -sf "$conf" /etc/nginx/sites-enabled/casecraft.conf
nginx -t
systemctl reload nginx

echo "==> HTTPS certificates (Let's Encrypt)"
# A name whose DNS does not point here yet is listed and left out, so it cannot block the others.
"$(dirname "$0")/fix-https.sh" "$email" \
  || echo "==> HTTPS is not complete yet (see above). Fix that, then run infra/prod/fix-https.sh again."

echo "==> Building and starting CaseCraft"
"$(dirname "$0")/deploy.sh"

cat <<NEXT

Done: nginx now sends $site and $api to CaseCraft (other sites unchanged).
First time only, if the store has no products yet:  /opt/casecraft/infra/prod/first-run.sh $email
NEXT
