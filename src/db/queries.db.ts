import { PgPool } from "./pool.db.js";
import logger from "../config/pino-logging/index.pino.js";
import type { QueryResult } from "pg";

// DB queries:
//general query function
export const query = async (
  queryText: string,
  values?: any[],
): Promise<QueryResult<any> | null> => {
  try {
    return await PgPool.query(queryText, values);
  } catch (error: any) {
    logger.error("error fetching data", error.stack);
    return null;
  }
};
