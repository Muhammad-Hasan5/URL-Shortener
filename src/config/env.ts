process.loadEnvFile();

import z, { type ZodSafeParseResult } from "zod";

const envSchema = z.object({
  PG_CONNECTION_STRING: z.url(),
  REDIS_URL: z.url(),
  BASE_URL: z.url(),
  LOG_LEVEL: z.string(),
  PORT: z.coerce.number().default(3000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number(),
  RATE_LIMIT_WINDOWSMS: z.coerce.number(),
  ENV: z
    .union([
      z.literal("DEVELOPMENT"),
      z.literal("TESTING"),
      z.literal("PRODUCTION"),
    ])
    .default("DEVELOPMENT"),
});

type envType = ZodSafeParseResult<z.infer<typeof envSchema>>;

const env: envType = envSchema.safeParse(process.env);

export default env;
