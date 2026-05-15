import { PgPool } from "./pool.db.js";
import logger from "../config/pino-logging/index.pino.js";

// DB queries:
//general query function
export const query = async (queryText: string, values?: any[]) => {
  try {
    return await PgPool.query(queryText, values);
  } catch (error: any) {
    logger.error("error fetching data", error.stack);
  }
};
