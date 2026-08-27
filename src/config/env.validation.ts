import { z } from "zod";

const LOCAL_ACCESS_SECRET = "local-access-secret-change-before-production";
const LOCAL_REFRESH_SECRET = "local-refresh-secret-change-before-production";

export const envSchema = z
  .object({
    APP_ENV: z
      .enum(["local", "test", "staging", "production"])
      .default("local"),
    APP_PORT: z.coerce.number().int().positive().default(3000),
    API_PREFIX: z.string().default("/api"),
    API_VERSION: z.string().default("v1"),
    CORS_ORIGIN: z.string().default("http://localhost:3000"),

    DATABASE_URL: z
      .string()
      .default(
        "postgresql://postgres:postgres@localhost:5432/ninho?schema=public",
      ),
    REDIS_URL: z.string().default("redis://localhost:6379"),

    JWT_ACCESS_SECRET: z.string().min(32).default(LOCAL_ACCESS_SECRET),
    JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
    JWT_REFRESH_SECRET: z.string().min(32).default(LOCAL_REFRESH_SECRET),
    JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

    OBJECT_STORAGE_ENDPOINT: z.string().url().default("http://localhost:9000"),
    OBJECT_STORAGE_REGION: z.string().default("us-east-1"),
    OBJECT_STORAGE_ACCESS_KEY: z.string().default("minioadmin"),
    OBJECT_STORAGE_SECRET_KEY: z.string().default("minioadmin"),
    OBJECT_STORAGE_BUCKET: z.string().default("ninho"),
    OBJECT_STORAGE_PUBLIC_URL: z
      .string()
      .url()
      .default("http://localhost:9000/ninho"),

    MAIL_PROVIDER: z.enum(["smtp", "sendgrid", "ses"]).default("smtp"),
    MAIL_HOST: z.string().optional(),
    MAIL_PORT: z.coerce.number().optional(),
    MAIL_USER: z.string().optional(),
    MAIL_PASS: z.string().optional(),
    MAIL_FROM: z.string().min(1).default("Ninho <noreply@ninho.app>"),

    PUSH_PROVIDER: z
      .enum(["firebase", "expo", "onesignal"])
      .default("firebase"),
    FIREBASE_PROJECT_ID: z.string().optional(),
    FIREBASE_CLIENT_EMAIL: z.string().optional(),
    FIREBASE_PRIVATE_KEY: z.string().optional(),

    OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
    LOG_LEVEL: z
      .enum(["trace", "debug", "info", "warn", "error", "fatal"])
      .default("info"),

    FF_NEW_FEED_RANKING: z.coerce.boolean().default(false),
    FF_ADVANCED_MODERATION: z.coerce.boolean().default(false),
  })
  .superRefine((config, context) => {
    if (config.APP_ENV !== "production") {
      return;
    }

    if (config.JWT_ACCESS_SECRET === LOCAL_ACCESS_SECRET) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["JWT_ACCESS_SECRET"],
        message: "must be changed in production",
      });
    }

    if (config.JWT_REFRESH_SECRET === LOCAL_REFRESH_SECRET) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["JWT_REFRESH_SECRET"],
        message: "must be changed in production",
      });
    }
  });

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const errors = JSON.stringify(result.error.flatten().fieldErrors);
    throw new Error(`Invalid environment variables: ${errors}`);
  }
  return result.data;
}
