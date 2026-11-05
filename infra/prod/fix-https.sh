#!/usr/bin/env bash
# Finds and fixes HTTPS certificate errors for the store, www and api addresses, then tests each one the
# way a visitor's browser would. Safe to run any time.
#   /opt/casecraft/infra/prod/fix-https.sh [email for certificate notices]
# The email is only needed the first time this server asks Let's Encrypt for a certificate.
#
# 1. DNS: each name must point at this server, by IPv4 (A) and, if it has one, IPv6 (AAAA). A leftover
#    parking record sends some visitors to another machine, which shows them a certificate error.
# 2. Certificates: one certificate for every name that points here, through the server's nginx
#    (certbot), or Caddy when PROXY is not nginx. Names that do not point here yet are left out and
#    listed, so they cannot block the rest.
# 3. Automatic renewal, then a live HTTPS check of every name.
set -euo pipefail
cd "$(dirname "$0")/../.."
ENV_FILE=infra/prod/.env
email="${1:-}"
if [[ $EUID -ne 0 ]]; then echo "Run as root." >&2; exit 1; fi
[[ -f "$ENV_FILE" ]] || { echo "$ENV_FILE is missing: run setup-vps.sh first." >&2; exit 1; }

envget() { { grep "^$1=" "$ENV_FILE" || true; } | tail -1 | cut -d= -f2-; }
site=$(envget SITE_DOMAIN); api=$(envget API_DOMAIN); proxy=$(envget PROXY)
[[ -n "$site" && -n "$api" ]] || { echo "Set SITE_DOMAIN and API_DOMAIN in $ENV_FILE." >&2; exit 1; }
names=("$site" "www.$site" "$api")
export DEBIAN_FRONTEND=noninteractive
command -v dig >/dev/null || { apt-get update -qq && apt-get install -y -qq dnsutils >/dev/null; }

# Public DNS, not this server's cache. Only addresses are kept: CNAME hops and ";;" error lines are not.
lookup() { dig +short +time=3 +tries=2 "$1" "$2" @1.1.1.1 | grep -E '^[0-9a-fA-F:.]*[0-9a-fA-F]$' || true; }
ip4=$(curl -4 -fsS --max-time 5 https://api.ipify.org 2>/dev/null || hostname -I | awk '{print $1}' || true)
my4=$( { echo "$ip4"; hostname -I 2>/dev/null | tr ' ' '\n'; } | grep -E '^[0-9]+(\.[0-9]+){3}$' | sort -u || true)
my6=$(ip -6 -o addr show scope global 2>/dev/null | awk '{print $4}' | cut -d/ -f1 | sort -u || true)

echo "==> DNS (this server: ${ip4:-unknown}${my6:+, $(paste -sd' ' <<<"$my6")})"
ready=(); dns_fixes=()
for n in "${names[@]}"; do
  a=$(lookup "$n" A); aaaa=$(lookup "$n" AAAA); bad=()
  [[ -n "$a" ]] || bad+=("no A record")
  for x in $a; do grep -qxF "$x" <<<"$my4" || bad+=("A $x is another machine"); done
  for x in $aaaa; do grep -qxF "$x" <<<"$my6" || bad+=("AAAA $x is another machine (IPv6 visitors land there)"); done
  if (( ${#bad[@]} == 0 )); then
    ready+=("$n"); printf '  ok   %-28s %s\n' "$n" "$(echo $a $aaaa)"
  else
    dns_fixes+=("$n"); msg=$(printf '%s; ' "${bad[@]}"); printf '  FIX  %-28s %s\n' "$n" "${msg%; }"
  fi
done
if (( ${#dns_fixes[@]} )); then
  cat <<FIX
     In hPanel → Domains → $site → DNS records: give @, www and api one A record each pointing to
     ${ip4:-the VPS IP}, and delete every other A, AAAA or CNAME record for those three names.
     Then wait a few minutes and run this script again.
FIX
fi
caa=$(dig +short "$site" CAA @1.1.1.1 2>/dev/null || true)
if [[ -n "$caa" ]] && ! grep -qi 'letsencrypt\.org' <<<"$caa"; then
  echo "  FIX  CAA records allow only: $(paste -sd' ' <<<"$caa"). Add: CAA @ 0 issue \"letsencrypt.org\""
fi

if (( ${#ready[@]} == 0 )); then
  echo "No name points at this server yet, so no certificate can be issued. Fix DNS first." >&2
  exit 1
fi

if [[ "$proxy" == nginx ]]; then
  echo "==> Certificate for: ${ready[*]}"
  [[ -f /etc/nginx/sites-enabled/casecraft.conf ]] \
    || { echo "nginx has no CaseCraft site. Run infra/prod/use-host-nginx.sh <email> instead." >&2; exit 1; }
  command -v certbot >/dev/null || { apt-get update -qq && apt-get install -y -qq certbot python3-certbot-nginx >/dev/null; }
  args=(--nginx --non-interactive --agree-tos --redirect --expand)
  for n in "${ready[@]}"; do args+=(-d "$n"); done
  if [[ -n "$email" ]]; then args+=(-m "$email")
  elif ! compgen -G '/etc/letsencrypt/accounts/*/directory/*' >/dev/null; then
    echo "First certificate on this server: run again with an email, e.g. fix-https.sh you@example.com" >&2; exit 1
  fi
  # An existing certificate for these names is kept and re-attached to them; a missing name is added to it.
  certbot "${args[@]}" || echo "  certbot could not get the certificate: the reason is in the lines above."
  nginx -t && systemctl reload nginx

  echo "==> Automatic renewal"
  systemctl enable --now certbot.timer >/dev/null 2>&1 || true
  cert=$(certbot certificates -d "$site" 2>/dev/null | awk '/Certificate Name:/ {print $3; exit}')
  if [[ -n "$cert" ]] && certbot renew --dry-run --quiet --cert-name "$cert"; then
    echo "  ok   certificate $cert renews by itself"
  else
    echo "  FIX  renewal test failed (lines above). Port 80 must stay open to the internet for renewals."
  fi
else
  echo "==> Caddy gets the certificates; restarting it so it tries again now"
  compose() { COMPOSE_PROFILES=caddy docker compose -f infra/prod/docker-compose.yml --env-file "$ENV_FILE" "$@"; }
  compose up -d caddy && compose restart caddy
  for _ in $(seq 1 18); do
    all=1; for n in "${ready[@]}"; do curl -sS -o /dev/null --max-time 5 "https://$n/" 2>/dev/null || all=0; done
    (( all )) && break; sleep 5
  done
  compose logs --since 3m caddy 2>&1 | grep -iE 'error|challenge|obtain' | tail -15 || true
fi

echo "==> HTTPS as visitors see it"
failed=0; err=$(mktemp); trap 'rm -f "$err"' EXIT
for n in "${names[@]}"; do
  if code=$(curl -sS -o /dev/null --max-time 15 -w '%{http_code}' "https://$n/" 2>"$err"); then
    until=$(openssl s_client -connect "$n:443" -servername "$n" </dev/null 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
    printf '  ok   https://%-28s HTTP %s, certificate valid until %s\n' "$n" "$code" "${until:-?}"
  else
    failed=1; printf '  FAIL https://%-28s %s\n' "$n" "$(tail -1 "$err")"
  fi
done
(( failed == 0 )) && echo "All addresses have a valid certificate." || exit 1
