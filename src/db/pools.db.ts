import { Pool } from "pg";

import logger from "../config/pino-logging/index.pino.js";
import env from "../config/env.js";

export const primaryPool = new Pool({
  connectionString: String(env.PG_PRIMARY_STRING),
  max: 12,
  connectionTimeoutMillis: 3000,
  idleTimeoutMillis: 30000,
  allowExitOnIdle: true,
});

export const replicaPool = new Pool({
  connectionString: String(env.PG_REPLICA_STRING),
  max: 12,
  connectionTimeoutMillis: 3000,
  idleTimeoutMillis: 30000,
  allowExitOnIdle: true,
});

logger.info("primary & replica pool created successfully");

export const checkPoolReady = async (): Promise<boolean> => {
  try {
    await primaryPool.query("SELECT 1");
    logger.info("DB-pg pool ready");
    return true;
  } catch (error: any) {
    logger.error("DB-pg pool not ready", error);
    return false;
  }
};

export const getPool = (intent: "write" | "read"): Pool => {
  return intent === "write" ? primaryPool : replicaPool;
};
