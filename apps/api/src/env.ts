import { z } from 'zod'

/**
 * Hard-fail startup validation for API env. Mirrors apps/web/src/env.ts.
 * Defaults are only safe for local development — production must supply real
 * values for everything in the "required in production" group below.
 *
 * Why this exists: a missing DATABASE_URL or an empty JWT_SECRET should crash
 * the process at boot with a clear message, not silently fail the first
 * request in a way that's hard to debug from production logs.
 */

const PLACEHOLDER_JWT_SECRET = 'change-me-in-production-please-use-a-long-random-string'

const envSchema = z.object({
  // Runtime mode
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // Required everywhere
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET must be at least 32 characters'),

  // Required in production, optional in dev (sensible defaults)
  REDIS_URL: z.string().default('redis://localhost:6379'),
  PUBLIC_WEB_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),

  // Storage (S3-compatible)
  S3_ENDPOINT: z.string().default('http://localhost:9000'),
  S3_REGION: z.string().default('us-east-1'),
  S3_BUCKET: z.string().default('dewmix-images'),
  S3_ACCESS_KEY: z.string().default('dewmix'),
  S3_SECRET_KEY: z.string().default('dewmix-secret'),
  S3_PUBLIC_URL: z.string().optional(),

  // Optional integrations — leave blank to disable
  AT_API_KEY: z.string().optional(),
  AT_USERNAME: z.string().default('sandbox'),
  AT_SENDER_ID: z.string().optional(),

  // Notifications
  ADMIN_NOTIFICATION_PHONE: z.string().optional(),

  // Server
  API_PORT: z.coerce.number().int().default(4000),
  LOG_LEVEL: z.string().default('info'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('\n❌ Invalid API environment:', parsed.error.flatten().fieldErrors)
  throw new Error('Invalid API environment — see errors above')
}

// Extra production checks that can't be expressed as a single zod refine.
if (parsed.data.NODE_ENV === 'production') {
  if (parsed.data.JWT_SECRET === PLACEHOLDER_JWT_SECRET) {
    throw new Error(
      'JWT_SECRET is still the .env.example placeholder value. Generate a real secret (e.g. `openssl rand -base64 48`) and set it in your environment.',
    )
  }
  if (!parsed.data.ADMIN_NOTIFICATION_PHONE) {
    // eslint-disable-next-line no-console
    console.warn(
      '⚠  ADMIN_NOTIFICATION_PHONE is unset — new-inquiry SMS will only go to admin users with phones on file.',
    )
  }
}

export const env = parsed.data
