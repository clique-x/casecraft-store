import { defineConfig, loadEnv } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

const REDIS_URL = process.env.REDIS_URL

/**
 * With REDIS_URL set (production, and local dev via infra/docker-compose.dev.yml) events, workflows,
 * locks and the cache go through Redis so the server and the worker share state. Without it Medusa
 * falls back to its in-memory modules, which is fine for a single local process.
 */
const redisModules = REDIS_URL
  ? [
      { resolve: '@medusajs/medusa/event-bus-redis', options: { redisUrl: REDIS_URL } },
      { resolve: '@medusajs/medusa/workflow-engine-redis', options: { redis: { redisUrl: REDIS_URL } } },
      {
        resolve: '@medusajs/medusa/locking',
        options: {
          providers: [
            { resolve: '@medusajs/medusa/locking-redis', id: 'locking-redis', is_default: true, options: { redisUrl: REDIS_URL } },
          ],
        },
      },
      {
        resolve: '@medusajs/medusa/caching',
        options: {
          providers: [
            { resolve: '@medusajs/caching-redis', id: 'caching-redis', is_default: true, options: { redisUrl: REDIS_URL } },
          ],
        },
      },
    ]
  : []

/**
 * Razorpay (UPI, cards, netbanking, wallets) when its keys are set; Cash on Delivery always uses
 * Medusa's built-in manual provider (`pp_system_default`). Use rzp_test_ keys until launch.
 */
const razorpay =
  process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
    ? [
        {
          resolve: '@medusajs/medusa/payment',
          options: {
            providers: [
              {
                resolve: './src/modules/razorpay',
                id: 'razorpay',
                options: {
                  key_id: process.env.RAZORPAY_KEY_ID,
                  key_secret: process.env.RAZORPAY_KEY_SECRET,
                  webhook_secret: process.env.RAZORPAY_WEBHOOK_SECRET,
                },
              },
            ],
          },
        },
      ]
    : []

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: REDIS_URL,
    // `server` serves the API and admin, `worker` runs subscribers and jobs; `shared` does both (local dev).
    workerMode: (process.env.MEDUSA_WORKER_MODE as 'shared' | 'worker' | 'server' | undefined) ?? 'shared',
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || 'supersecret',
      cookieSecret: process.env.COOKIE_SECRET || 'supersecret',
    },
  },
  admin: {
    disable: process.env.DISABLE_MEDUSA_ADMIN === 'true',
    backendUrl: process.env.MEDUSA_BACKEND_URL,
  },
  modules: [{ resolve: './src/modules/phone-model' }, ...razorpay, ...redisModules],
})
