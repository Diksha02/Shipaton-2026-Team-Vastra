import { z } from 'zod';

/**
 * Environment validation.
 *
 * Parsed once at boot and the process refuses to start if anything is wrong.
 * A missing key must be a startup crash with a readable message, never an
 * `undefined` that surfaces three hours later as a 500 in a request handler.
 *
 * Secrets are optional at this stage so the API boots against fakes before any
 * account exists; a service that needs a real key asserts on it at the point of
 * use and the corresponding feature flag turns off.
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  API_PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  // Loopback by default. Binding 0.0.0.0 must be a deliberate act in a deploy
  // config, never something that happens because nobody set the variable.
  API_HOST: z.string().default('127.0.0.1'),
  API_PUBLIC_URL: z.string().url().default('http://127.0.0.1:3000'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),

  // --- optional until the corresponding account exists ---
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().default('vastra-dev'),
  R2_ENDPOINT: z.string().optional(),
  R2_PUBLIC_BASE_URL: z.string().optional(),

  CLERK_SECRET_KEY: z.string().optional(),
  CLERK_WEBHOOK_SIGNING_SECRET: z.string().optional(),

  REVENUECAT_SECRET_API_KEY: z.string().optional(),
  REVENUECAT_WEBHOOK_SECRET: z.string().optional(),

  ONESIGNAL_APP_ID: z.string().optional(),
  ONESIGNAL_REST_API_KEY: z.string().optional(),

  POSTHOG_API_KEY: z.string().optional(),
  POSTHOG_HOST: z.string().default('https://eu.i.posthog.com'),
  SENTRY_DSN: z.string().optional(),

  OPENAI_API_KEY: z.string().optional(),
  SIGHTENGINE_API_USER: z.string().optional(),
  SIGHTENGINE_API_SECRET: z.string().optional(),
  XIMILAR_API_TOKEN: z.string().optional(),
  FASHN_API_KEY: z.string().optional(),

  TRYON_MODEL_VERSION: z.string().default('v1'),

  INGEST_USER_AGENT: z.string().default('WardrobeBot/1.0 (+https://example.com/bot)'),
  INGEST_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
  INGEST_HARD_CAP_MS: z.coerce.number().int().positive().default(10000),
  INGEST_MAX_BYTES: z.coerce.number().int().positive().default(2_097_152),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(source);

  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `  ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment:\n${problems}\n\nCheck .env against .env.example.`);
  }

  return result.data;
}

/**
 * Which optional integrations are actually configured.
 *
 * Lets the app degrade honestly: a feature whose credentials are absent is
 * reported as unavailable rather than failing at the moment a user taps it.
 */
export function integrationStatus(env: Env) {
  return {
    storage: Boolean(env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_ENDPOINT),
    auth: Boolean(env.CLERK_SECRET_KEY),
    purchases: Boolean(env.REVENUECAT_WEBHOOK_SECRET),
    push: Boolean(env.ONESIGNAL_APP_ID && env.ONESIGNAL_REST_API_KEY),
    moderation: Boolean(env.OPENAI_API_KEY),
    moderationStrict: Boolean(env.SIGHTENGINE_API_USER && env.SIGHTENGINE_API_SECRET),
    tagging: Boolean(env.XIMILAR_API_TOKEN),
    tryon: Boolean(env.FASHN_API_KEY),
  } as const;
}

export type IntegrationStatus = ReturnType<typeof integrationStatus>;
