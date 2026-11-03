#!/usr/bin/env bash
# One-time setup of a fresh Ubuntu 22.04/24.04 VPS (Hostinger KVM 2) for the CaseCraft backend.
# Run as root:
#   curl -fsSL https://raw.githubusercontent.com/clique-x/casecraft-store/main/infra/prod/setup-vps.sh -o setup-vps.sh
#   bash setup-vps.sh api.yourstore.in https://casecraft-store.vercel.app
#
# It installs Docker, a firewall (22, 80, 443 only), fail2ban and automatic security updates, adds 2 GB of
# swap, clones the repository to /opt/casecraft, writes infra/prod/.env with random secrets, and schedules
# a nightly database backup. It does not start anything: run deploy.sh next.
set -euo pipefail

API_DOMAIN="${1:-}"
STOREFRONT_URL="${2:-https://casecraft-store.vercel.app}"
REPO_URL="${REPO_URL:-https://github.com/clique-x/casecraft-store.git}"
APP_DIR="${APP_DIR:-/opt/casecraft}"

if [[ $EUID -ne 0 ]]; then echo "Run as root (sudo bash setup-vps.sh ...)." >&2; exit 1; fi
if [[ -z "$API_DOMAIN" ]]; then
  ip=$(curl -fsS https://api.ipify.org || hostname -I | awk '{print $1}')
  echo "Usage: bash setup-vps.sh <api-domain> [storefront-url]" >&2
  echo "No domain yet? Use api.${ip//./-}.sslip.io" >&2
  exit 1
fi

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
  set_var API_DOMAIN "$API_DOMAIN"
  set_var STOREFRONT_URL "$STOREFRONT_URL"
  set_var STORE_CORS "$STOREFRONT_URL"
  set_var ADMIN_CORS "https://$API_DOMAIN"
  set_var AUTH_CORS "https://$API_DOMAIN,$STOREFRONT_URL"
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
cat <<NEXT

Done. Next:
  1. Point $API_DOMAIN (DNS A record) at $ip, unless it is an sslip.io name.
  2. Start the backend:   $APP_DIR/infra/prod/deploy.sh
  3. Load the store:      $APP_DIR/infra/prod/first-run.sh you@example.com
  4. Put the values first-run.sh prints into the storefront's Vercel settings.
NEXT
