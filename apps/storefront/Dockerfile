# Production image for the storefront on the VPS. Build from the repository root (a pnpm workspace) with
# the backend running, because the build reads the catalogue from Medusa:
#   docker build --network host -f apps/storefront/Dockerfile \
#     --build-arg MEDUSA_BACKEND_URL=http://127.0.0.1:9000 --build-arg MEDUSA_PUBLISHABLE_KEY=pk_... \
#     --build-arg MEDUSA_REGION_ID=reg_... -t casecraft-storefront .
# infra/prod/docker-compose.yml does this; see infra/prod/README.md.

FROM node:22-bookworm-slim AS build
RUN corepack enable
WORKDIR /repo

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json apps/backend/
COPY apps/storefront/package.json apps/storefront/
RUN pnpm install --frozen-lockfile --filter storefront

COPY apps/storefront apps/storefront
# Medusa at build time: pages are prerendered with the live catalogue. The publishable key is not a secret.
ARG MEDUSA_BACKEND_URL
ARG MEDUSA_PUBLISHABLE_KEY
ARG MEDUSA_REGION_ID
ENV NEXT_OUTPUT=standalone \
    NEXT_TELEMETRY_DISABLED=1 \
    MEDUSA_BACKEND_URL=$MEDUSA_BACKEND_URL \
    MEDUSA_PUBLISHABLE_KEY=$MEDUSA_PUBLISHABLE_KEY \
    MEDUSA_REGION_ID=$MEDUSA_REGION_ID
RUN pnpm --filter storefront build

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=build /repo/apps/storefront/.next/standalone ./
COPY --from=build /repo/apps/storefront/.next/static ./apps/storefront/.next/static
COPY --from=build /repo/apps/storefront/public ./apps/storefront/public
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "apps/storefront/server.js"]
