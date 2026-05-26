import type { QueryResult } from "pg";
import { query } from "../db/queries.db.js";
import logger from "../config/pino-logging/index.pino.js";
import { type NewRecordType } from "../@types/db-record/index.types.js";

// save in db
export const saveToDB = async (
  newRecord: Partial<NewRecordType>,
): Promise<QueryResult<any> | null> => {
  try {
    let queryText = `INSERT INTO urls (id, short_code, long_url) 
                    values ($1, $2, $3)
                    `;

    // querying DB
    return await query(queryText, [
      newRecord.id,
      newRecord.shortCode,
      newRecord.longURL,
    ]);
  } catch (error: any) {
    logger.error("error saving to DB", error.stack);
    return null
  }
};

// get from db
export const getFromDB = async (
  shortCode: string,
): Promise<QueryResult<any> | null> => {
  try {
    let queryText = "SELECT long_url from urls where short_code = $1";
    let result = await query(queryText, [shortCode]);
    return result;
  } catch (error: any) {
    logger.error("error fetching url from DB", error.stack);
    return null
  }
};
