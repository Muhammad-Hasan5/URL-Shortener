import type { QueryResult } from "pg";
import logger from "../config/pino-logging/index.pino.js";
import { type DatabaseRecord } from "../@types/db-record/index.types.js";
import { getPool } from "../db/pools.db.js";

// save in db
export const createUrl = async (
  newRecord: Partial<DatabaseRecord>,
): Promise<QueryResult<any> | null> => {
  try {
    const db = getPool("write")
    let queryText = `INSERT INTO urls (id, short_code, long_url) 
                    values ($1, $2, $3)
                    `;

    // querying DB
    return await db.query(queryText, [
      newRecord.id,
      newRecord.shortCode,
      newRecord.longURL,
    ]);
  } catch (error: any) {
    logger.error("error saving to DB", error.stack);
    return null;
  }
};

// get from db
export const findByShortCode = async (
  shortCode: string,
): Promise<QueryResult<any> | null> => {
  try {
    const db = getPool("read")
    let queryText = "SELECT long_url from urls where short_code = $1";
    let result = await db.query(queryText, [shortCode]);
    return result;
  } catch (error: any) {
    logger.error("error fetching url from DB", error.stack);
    return null
  }
};

export const checkIfAlreadyExists = async (
  longURL: string,
): Promise<QueryResult<any> | null> => {
  try {
    const db = getPool("read");
    let queryText = "SELECT * from urls where longURL = $1";
    let result = await db.query(queryText, [longURL]);
    return result;
  } catch (error: any) {
    logger.error("error fetching url from DB", error.stack);
    return null;
  }
};

//TODO: fetch short URL ID
export const getUrlIdFromDb = async (
  shortCode: string,
): Promise<QueryResult<any> | null> => {
  try {
    const db = getPool("read");
    let queryText = "SELECT id FROM urls where short_code = $1";
    let res = await db.query(queryText, [shortCode]);
    return res;
  } catch (error: any) {
    logger.error("error fetching url from DB", error.stack);
    return null;
  }
};