# Production image for the Medusa backend. Build from the repository root (it is a pnpm workspace):
#   docker build -f apps/backend/Dockerfile -t casecraft-backend .
# infra/prod/docker-compose.yml builds and runs it; see infra/prod/README.md.

FROM node:22-bookworm-slim AS build
RUN corepack enable
WORKDIR /repo

# Install the backend's dependencies first so this layer is cached between code changes.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json apps/backend/
COPY apps/storefront/package.json apps/storefront/
RUN pnpm install --frozen-lockfile --filter backend

# Compile the server and the admin dashboard into apps/backend/.medusa/server.
COPY apps/backend apps/backend
RUN pnpm --filter backend build

# Production-only node_modules for the backend, outside the workspace.
RUN pnpm --filter backend deploy --prod --legacy /prod

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /prod/node_modules ./node_modules
COPY --from=build /repo/apps/backend/.medusa/server ./
# The seed reads data/catalog.json from the working directory.
COPY --from=build /repo/apps/backend/data ./data
EXPOSE 9000
HEALTHCHECK --interval=15s --timeout=5s --start-period=90s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:9000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["npx", "medusa", "start"]
