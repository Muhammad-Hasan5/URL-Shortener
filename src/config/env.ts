import z, { type ZodSafeParseResult } from "zod";
import fs from "fs"
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const envPath = path.resolve(__dirname, "../../.env")

if(fs.existsSync(envPath)){
  process.loadEnvFile(envPath)
}

const envSchema = z.object({
  PG_CONNECTION_STRING: z.string(),
  REDIS_URL: z.string(),
  BASE_URL: z.url(),
  LOG_LEVEL: z.string(),
  PORT: z.coerce.number().default(3000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number(),
  RATE_LIMIT_WINDOWSMS: z.coerce.number(),
  NODE_ENV: z
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
