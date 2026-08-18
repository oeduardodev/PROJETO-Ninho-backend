import { z } from 'zod';

export const envSchema = z.object({
  APP_ENV: z.enum(['local', 'test', 'staging', 'production']).default('local'),
  APP_PORT: z.coerce.number().default(3000),
  API_PREFIX: z.string().default('/api'),
  API_VERSION: z.string().default('v1'),

  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),

  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  OBJECT_STORAGE_ENDPOINT: z.string().url(),
  OBJECT_STORAGE_REGION: z.string(),
  OBJECT_STORAGE_ACCESS_KEY: z.string(),
  OBJECT_STORAGE_SECRET_KEY: z.string(),
  OBJECT_STORAGE_BUCKET: z.string(),
  OBJECT_STORAGE_PUBLIC_URL: z.string().url(),

  MAIL_PROVIDER: z.enum(['smtp', 'sendgrid', 'ses']).default('smtp'),
  MAIL_HOST: z.string().optional(),
  MAIL_PORT: z.coerce.number().optional(),
  MAIL_USER: z.string().optional(),
  MAIL_PASS: z.string().optional(),
  MAIL_FROM: z.string().email().optional(),

  PUSH_PROVIDER: z.enum(['firebase', 'expo', 'onesignal']).default('firebase'),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),

  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),

  FF_NEW_FEED_RANKING: z.coerce.boolean().default(false),
  FF_ADVANCED_MODERATION: z.coerce.boolean().default(false),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    console.error(result.error.flatten().fieldErrors);
    process.exit(1);
  }
  return result.data;
}