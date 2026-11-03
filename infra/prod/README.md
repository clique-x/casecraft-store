# Medusa backend on a Hostinger VPS

The storefront stays on Vercel. The VPS runs the Medusa API and admin, Postgres, Redis and Caddy (HTTPS),
all in Docker:

```
Vercel storefront ──HTTPS──► Caddy :443 ──► medusa-server :9000 (API + admin at /app)
                                             medusa-worker (events, storefront refresh)
                                             postgres, redis   (private Docker network only)
```

Files: `docker-compose.yml`, `Caddyfile`, `.env.example`, and the scripts below. The image is built from
`apps/backend/Dockerfile`. Everything here was tested end to end in Docker: migrations, seed, admin login,
the store API through Caddy, the worker, the storefront reading from it, deploy and backup.

## 1. Create the server

In Hostinger hPanel, set up the KVM 2 with **Ubuntu 24.04** (plain OS, no panel) and note its IP and root
password. KVM 2 (2 vCPU, 8 GB) runs this stack in about 2-3 GB.

## 2. Pick the API address

- With a domain: add a DNS **A record** `api` → the VPS IP (for example `api.yourstore.in`).
- Without one: use `api.<ip-with-dashes>.sslip.io`, for example `api.203-0-113-7.sslip.io`. It resolves to
  your IP with no DNS setup, and Caddy still gets a real HTTPS certificate. Switch to your domain later by
  changing `API_DOMAIN` (and the CORS lines) in `.env` and running `deploy.sh`.

## 3. Set up and start (about 10 minutes)

SSH in as root (`ssh root@<ip>`) and run:

```bash
curl -fsSL https://raw.githubusercontent.com/clique-x/casecraft-store/main/infra/prod/setup-vps.sh -o setup-vps.sh
```

```bash
bash setup-vps.sh api.yourstore.in https://casecraft-store.vercel.app
```

```bash
/opt/casecraft/infra/prod/deploy.sh
```

```bash
/opt/casecraft/infra/prod/first-run.sh you@example.com
```

`setup-vps.sh` installs Docker, the firewall (22, 80, 443 only), fail2ban, security updates and swap, clones
the repo to `/opt/casecraft`, writes `infra/prod/.env` with random secrets and schedules a nightly backup.
`deploy.sh` builds and starts everything; the first build takes a few minutes. `first-run.sh` loads the
India store and the catalogue, creates your admin login and prints the storefront settings.

Check: `https://<API_DOMAIN>/health` says OK and `https://<API_DOMAIN>/app` shows the admin login.

## 4. Connect the storefront

In Vercel → casecraft-store → Settings → Environment Variables (Production), add the four values
`first-run.sh` printed: `MEDUSA_BACKEND_URL`, `MEDUSA_PUBLISHABLE_KEY`, `MEDUSA_REGION_ID` and
`REVALIDATE_SECRET`. Then redeploy the storefront. From then on prices and stock come from the admin, and
admin edits show on the store within seconds.

The storefront build reads the catalogue from Medusa, so the backend must be up before a Vercel build.

## Deploy on every push (optional)

`.github/workflows/deploy-backend.yml` runs `deploy.sh` over SSH when backend or infra code lands on main.
On the VPS, create a key just for this:

```bash
ssh-keygen -t ed25519 -N '' -C github-deploy -f ~/.ssh/github-deploy
```

```bash
cat ~/.ssh/github-deploy.pub >> ~/.ssh/authorized_keys
```

In GitHub → casecraft-store → Settings → Secrets and variables → Actions, add `VPS_HOST` (the IP),
`VPS_USER` (`root`) and `VPS_SSH_KEY` (the output of `cat ~/.ssh/github-deploy`). Optionally add
`VPS_KNOWN_HOSTS` (output of `ssh-keyscan <ip>` run from your own computer) so the workflow does not trust
the host key on first use. Without the secrets the workflow skips itself.

## Day to day

| Task | Command (on the VPS) |
|---|---|
| Deploy the latest main by hand | `/opt/casecraft/infra/prod/deploy.sh` |
| Load new catalogue entries after `pnpm catalog:export` | `/opt/casecraft/infra/prod/first-run.sh` (the seed only adds what is missing) |
| Logs | `cd /opt/casecraft && docker compose -f infra/prod/docker-compose.yml logs -f --tail 100 medusa-server` |
| Backup now | `/opt/casecraft/infra/prod/backup.sh` (nightly at 02:30, kept 14 days in `/var/backups/casecraft`) |
| Turn on Razorpay or Twilio | Fill their lines in `/opt/casecraft/infra/prod/.env`, run `deploy.sh`, then `first-run.sh` once |

Copy the backups off the server as well (for example to Cloudflare R2 with rclone): a backup on the same
disk does not survive losing the VPS. Take a Hostinger snapshot before Medusa upgrades.
