import z from "zod";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../../.env");

if (fs.existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

const envSchema = z.object({
  PG_PRIMARY_STRING: z.string(),
  PG_REPLICA_STRING: z.string(),
  REDIS_URL: z.string(),
  PORT: z.coerce.number().default(3000),
  LOG_LEVEL: z.string().default("info"),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  RATE_LIMIT_WINDOWSMS: z.coerce.number().default(60000),
  GEO_CITY_DB_PATH: z.string(),
  IP_HASH_SALT: z.string(),
  NODE_ENV: z
    .enum(["development", "testing", "production"])
    .default("development"),
});

type Env = z.infer<typeof envSchema>

const env: Env = envSchema.parse(process.env);

export default env;
