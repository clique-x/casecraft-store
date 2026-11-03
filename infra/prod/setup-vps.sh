#!/usr/bin/env bash
# One-time setup of a fresh Ubuntu 22.04/24.04 VPS (Hostinger KVM 2) for the whole CaseCraft platform.
# Run as root:
#   curl -fsSL https://raw.githubusercontent.com/clique-x/casecraft-store/main/infra/prod/setup-vps.sh -o setup-vps.sh
#   bash setup-vps.sh gadgetshub.io
#
# The store is served at https://<domain> (www redirects to it) and the Medusa API and admin at
# https://api.<domain>. It installs Docker, a firewall (22, 80, 443 only), fail2ban and automatic security
# updates, adds 2 GB of swap, clones the repository to /opt/casecraft, writes infra/prod/.env with random
# secrets, and schedules a nightly database backup. It does not start anything: run deploy.sh next.
set -euo pipefail

SITE_DOMAIN="${1:-}"
API_DOMAIN="${API_DOMAIN:-api.$SITE_DOMAIN}"
# Other origins that may call the API from a browser, comma-separated (optional).
EXTRA_ORIGINS="${EXTRA_ORIGINS:-}"
REPO_URL="${REPO_URL:-https://github.com/clique-x/casecraft-store.git}"
APP_DIR="${APP_DIR:-/opt/casecraft}"

if [[ $EUID -ne 0 ]]; then echo "Run as root (sudo bash setup-vps.sh ...)." >&2; exit 1; fi
if [[ -z "$SITE_DOMAIN" ]]; then echo "Usage: bash setup-vps.sh <domain>   e.g. bash setup-vps.sh gadgetshub.io" >&2; exit 1; fi

echo "==> Packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y
apt-get install -y ca-certificates curl git ufw fail2ban unattended-upgrades openssl
dpkg-reconfigure -f noninteractive unattended-upgrades

echo "==> Docker"
if ! command -v docker >/dev/null; then
  curl -fsSL https://get.docker.com | sh
fi
systemctl enable --now docker

echo "==> Firewall: SSH, HTTP, HTTPS only"
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 443/udp
ufw --force enable
systemctl enable --now fail2ban

echo "==> Swap (2 GB) for build spikes"
if ! swapon --show | grep -q .; then
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "==> Code in $APP_DIR"
if [[ -d "$APP_DIR/.git" ]]; then
  git -C "$APP_DIR" pull --ff-only
else
  git clone "$REPO_URL" "$APP_DIR"
fi

ENV_FILE="$APP_DIR/infra/prod/.env"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "==> Writing $ENV_FILE with new secrets"
  cp "$APP_DIR/infra/prod/.env.example" "$ENV_FILE"
  set_var() { sed -i "s|^$1=.*|$1=$2|" "$ENV_FILE"; }
  origins="https://$SITE_DOMAIN,https://www.$SITE_DOMAIN"
  [[ -n "$EXTRA_ORIGINS" ]] && origins="$origins,$EXTRA_ORIGINS"
  set_var SITE_DOMAIN "$SITE_DOMAIN"
  set_var API_DOMAIN "$API_DOMAIN"
  set_var STOREFRONT_URL "https://$SITE_DOMAIN"
  set_var STORE_CORS "$origins"
  set_var ADMIN_CORS "https://$API_DOMAIN"
  set_var AUTH_CORS "https://$API_DOMAIN,$origins"
  for k in POSTGRES_PASSWORD JWT_SECRET COOKIE_SECRET STOREFRONT_REVALIDATE_SECRET; do set_var "$k" "$(openssl rand -hex 32)"; done
  chmod 600 "$ENV_FILE"
else
  echo "==> $ENV_FILE exists; left as is"
fi

echo "==> Nightly backup at 02:30"
mkdir -p /var/backups/casecraft
cat > /etc/cron.d/casecraft-backup <<CRON
30 2 * * * root $APP_DIR/infra/prod/backup.sh >> /var/log/casecraft-backup.log 2>&1
CRON

ip=$(curl -fsS https://api.ipify.org 2>/dev/null || hostname -I | awk '{print $1}')
if ss -tlnp 2>/dev/null | grep -E ':(80|443) ' | grep -q nginx; then
cat <<NEXT

Done. This server already runs nginx on ports 80/443 (other sites), so CaseCraft goes through it:
  1. DNS (hPanel → Domains → $SITE_DOMAIN → DNS): A records @, www and api → $ip
  2. Add the site to nginx:      $APP_DIR/infra/prod/use-host-nginx.sh you@example.com
  3. Start the backend:          $APP_DIR/infra/prod/deploy.sh
  4. Load the store and go live: $APP_DIR/infra/prod/first-run.sh you@example.com
NEXT
exit 0
fi
cat <<NEXT

Done. Next:
  1. DNS (hPanel → Domains → $SITE_DOMAIN → DNS): A records @, www and api → $ip
  2. Start the backend:          $APP_DIR/infra/prod/deploy.sh
  3. Load the store and go live: $APP_DIR/infra/prod/first-run.sh you@example.com
NEXT
