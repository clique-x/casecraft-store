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

/**
 * Email (sign-in codes, order confirmations, shipping updates) through any SMTP mailbox: Hostinger, Zoho,
 * Google Workspace, Resend's SMTP… With EMAIL_FROM and SMTP_HOST unset the shop sends no email and the
 * storefront hides email sign-in. EMAIL_PREVIEW_DIR (development) writes the emails to a folder instead.
 */
const email =
  process.env.EMAIL_FROM && (process.env.SMTP_HOST || process.env.EMAIL_PREVIEW_DIR)
    ? [
        {
          resolve: '@medusajs/medusa/notification',
          options: {
            providers: [
              {
                resolve: './src/modules/smtp-email',
                id: 'smtp',
                options: {
                  channels: ['email'],
                  host: process.env.SMTP_HOST,
                  port: Number(process.env.SMTP_PORT) || 465,
                  user: process.env.SMTP_USER,
                  pass: process.env.SMTP_PASSWORD,
                  from: process.env.EMAIL_FROM,
                  reply_to: process.env.EMAIL_REPLY_TO,
                  preview_dir: process.env.SMTP_HOST ? undefined : process.env.EMAIL_PREVIEW_DIR,
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
  modules: [{ resolve: './src/modules/phone-model' }, ...razorpay, ...email, ...redisModules],
})
