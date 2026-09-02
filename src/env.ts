import { z } from "zod";

const booleanFromString = z
  .enum(["true", "false"])
  .default("false")
  .transform((value) => value === "true");

const optionalString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(1).optional(),
);
const optionalUrl = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.url().optional(),
);
const optionalSecret = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(32).optional(),
);

const rawEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  APP_URL: z.url().default("http://localhost:3000"),
  DATABASE_URL: z
    .string()
    .min(1)
    .default("postgresql://postgres:postgres@127.0.0.1:5432/navori_publisher"),
  AUTH_SECRET: optionalSecret,
  OPENAI_API_KEY: optionalString,
  OPENAI_MODEL: z.string().min(1).default("gpt-5.4"),
  OPENAI_API_ENABLED: booleanFromString,
  NAVORI_BASE_URL: optionalUrl,
  NAVORI_USERNAME: optionalString,
  NAVORI_PASSWORD: optionalString,
  NAVORI_API_ENABLED: booleanFromString,
  NAVORI_ALLOWED_HOSTS: z.string().default(""),
  TEMP_UPLOAD_PATH: z.string().min(1).default("./data/uploads"),
  MAX_UPLOAD_SIZE_MB: z.coerce.number().int().positive().max(2048).default(512),
  UPLOAD_RETENTION_HOURS: z.coerce
    .number()
    .int()
    .positive()
    .max(720)
    .default(24),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

const parsed = rawEnvSchema.parse(process.env);
const isNextProductionBuild =
  process.env.NEXT_PHASE === "phase-production-build";

if (
  parsed.NODE_ENV === "production" &&
  !parsed.AUTH_SECRET &&
  !isNextProductionBuild
) {
  throw new Error("AUTH_SECRET production ortamında zorunludur.");
}

if (parsed.OPENAI_API_ENABLED && !parsed.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_ENABLED=true iken OPENAI_API_KEY zorunludur.");
}

if (
  parsed.NAVORI_API_ENABLED &&
  (!parsed.NAVORI_BASE_URL ||
    !parsed.NAVORI_USERNAME ||
    !parsed.NAVORI_PASSWORD)
) {
  throw new Error(
    "Gerçek Navori modu için URL, kullanıcı adı ve parola zorunludur.",
  );
}

export const env = {
  ...parsed,
  AUTH_SECRET:
    parsed.AUTH_SECRET ??
    (isNextProductionBuild
      ? "build-time-only-auth-placeholder-never-use-at-runtime"
      : "development-only-auth-secret-change-before-production"),
};

export type AppEnv = typeof env;
