# The platform on a Hostinger VPS: gadgetshub.io

One KVM 2 runs everything in Docker:

```
https://gadgetshub.io      ─► Caddy :443 ─► storefront :3000 (Next.js)
https://www.gadgetshub.io  ─► redirect to gadgetshub.io            │ private network
https://api.gadgetshub.io  ─► Caddy :443 ─► medusa-server :9000 ◄─┘ (API + admin at /app)
                                            medusa-worker (events, store refresh)
                                            postgres, redis (private network only)
```

Browsers only talk to Caddy. The storefront calls Medusa over the private Docker network; the public API
address is for the admin and payment webhooks. Caddy gets and renews the HTTPS certificates itself.

All of it was tested end to end in Docker: migrations, seed, admin login, the API over HTTPS, the worker,
the storefront built from and serving the live Medusa catalogue, the www redirect, deploy and backup.

## 1. The server

In Hostinger hPanel → VPS, install **Ubuntu 24.04** (plain OS, no panel) on the KVM 2 and note its IP and
root password. The stack uses about 3-4 GB of the 8 GB.

## 2. DNS for gadgetshub.io

The domain is in the same Hostinger account: hPanel → Domains → gadgetshub.io → DNS / Nameservers →
DNS records. Delete the parking `A @` record and the `CNAME www` record, then add:

| Type | Name | Points to | TTL |
|---|---|---|---|
| A | `@` | the VPS IP | 300 |
| A | `www` | the VPS IP | 300 |
| A | `api` | the VPS IP | 300 |

Changes usually apply within minutes. Do this before step 3 so the certificates can be issued.

## 3. Set up and go live (about 15 minutes)

SSH in as root (`ssh root@<vps-ip>`) and run these one at a time:

```bash
curl -fsSL https://raw.githubusercontent.com/clique-x/casecraft-store/main/infra/prod/setup-vps.sh -o setup-vps.sh
```

```bash
bash setup-vps.sh gadgetshub.io
```

```bash
/opt/casecraft/infra/prod/deploy.sh
```

```bash
/opt/casecraft/infra/prod/first-run.sh you@example.com
```

- `setup-vps.sh` installs Docker, the firewall (22, 80, 443 only), fail2ban, security updates and swap,
  clones the repo to `/opt/casecraft`, writes `infra/prod/.env` with random secrets and schedules a nightly
  backup.
- `deploy.sh` builds and starts the backend; the first build takes a few minutes.
- `first-run.sh` loads the India store and the catalogue, creates your admin login (it prints the
  password), saves the store keys in `.env`, then builds and starts the storefront.

Check: https://gadgetshub.io shows the store, https://api.gadgetshub.io/health says OK and
https://api.gadgetshub.io/app shows the admin login.

## If the server already runs nginx (other sites)

When nginx already holds ports 80 and 443, Caddy cannot start and the domain shows the other site. Serve
CaseCraft through that nginx instead. It adds one site for the store, www and api names, gets their
certificates with certbot, and leaves the other nginx sites alone:

```bash
/opt/casecraft/infra/prod/use-host-nginx.sh you@example.com
```

Then run `deploy.sh` (and `first-run.sh` the first time). It sets `PROXY=nginx` in `.env`, so deploys skip
Caddy; the store and API listen on 127.0.0.1:3100 and 127.0.0.1:9100 for nginx
(`STOREFRONT_HOST_PORT`, `MEDUSA_HOST_PORT`).

## Deploy on every push (optional)

`.github/workflows/deploy-vps.yml` runs `deploy.sh` over SSH when storefront, backend or infra code lands on
main. On the VPS, create a key just for this:

```bash
ssh-keygen -t ed25519 -N '' -C github-deploy -f ~/.ssh/github-deploy
```

```bash
cat ~/.ssh/github-deploy.pub >> ~/.ssh/authorized_keys
```

In GitHub → casecraft-store → Settings → Secrets and variables → Actions, add `VPS_HOST` (the IP),
`VPS_USER` (`root`) and `VPS_SSH_KEY` (the output of `cat ~/.ssh/github-deploy`). Optionally add
`VPS_KNOWN_HOSTS` (output of `ssh-keyscan <ip>` from your own computer) so the workflow does not trust the
host key on first use. Without the secrets the workflow skips itself.

## Day to day

| Task | Command (on the VPS) |
|---|---|
| Deploy the latest main by hand | `/opt/casecraft/infra/prod/deploy.sh` |
| Load new catalogue entries after `pnpm catalog:export` | `/opt/casecraft/infra/prod/first-run.sh` (the seed only adds what is missing) |
| Logs | `cd /opt/casecraft && docker compose -f infra/prod/docker-compose.yml logs -f --tail 100 storefront medusa-server` |
| Backup now | `/opt/casecraft/infra/prod/backup.sh` (nightly at 02:30, kept 14 days in `/var/backups/casecraft`) |
| Turn on Razorpay or Twilio | Fill their lines in `/opt/casecraft/infra/prod/.env`, run `deploy.sh`, then `first-run.sh` once |

Price and stock edits in the admin show on the store within seconds. New products, photos or code reach
the store with a deploy, since pages are built from the code and the catalogue.

Copy the backups off the server as well (for example to Cloudflare R2 with rclone): a backup on the same
disk does not survive losing the VPS. Take a Hostinger snapshot before Medusa upgrades.

The Vercel project (casecraft-store.vercel.app) keeps building main with the sample catalogue; it is
useful as a preview but is not the store.
