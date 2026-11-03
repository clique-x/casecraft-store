#!/usr/bin/env bash
# Nightly Postgres dump, kept for 14 days. Scheduled by setup-vps.sh (/etc/cron.d/casecraft-backup).
# Copy /var/backups/casecraft off the server too (e.g. to Cloudflare R2 with rclone); a backup on the same
# disk does not survive losing the VPS. Restore: gunzip -c FILE | docker compose ... exec -T postgres psql -U casecraft casecraft
set -euo pipefail
cd "$(dirname "$0")/../.."
dir=/var/backups/casecraft
mkdir -p "$dir"
file="$dir/casecraft-$(date +%Y%m%d-%H%M).sql.gz"
docker compose -f infra/prod/docker-compose.yml --env-file infra/prod/.env exec -T postgres \
  pg_dump -U casecraft --no-owner casecraft | gzip > "$file"
find "$dir" -name 'casecraft-*.sql.gz' -mtime +14 -delete
echo "$(date -Is) backup $file ($(du -h "$file" | cut -f1))"
