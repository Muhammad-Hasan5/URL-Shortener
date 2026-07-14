import type { QueryResult } from "pg";
import logger from "../config/pino-logging/index.pino.js";
import { type DatabaseRecord } from "../@types/db-record/index.types.js";
import { getPool } from "../db/pools.db.js";
import { assertUUID } from "../@types/auth/uuid.types.js";

// save in db
export const createUrl = async (
  newRecord: Partial<DatabaseRecord>,
): Promise<QueryResult<any> | null> => {
  try {
    const db = getPool("write");
    let queryText = `INSERT INTO urls (id, user_id, short_code, long_url) values ($1, $2, $3, $4)`;

    const userid = assertUUID(newRecord.user_id!);

    // querying DB
    return await db.query(queryText, [
      newRecord.id,
      userid,
      newRecord.shortCode,
      newRecord.longURL,
    ]);
  } catch (error: any) {
    logger.error("error saving to DB", error.stack);
    return null;
  }
};

// get from db
export const findByShortCodeAndUserId = async (
  shortCode: string,
  user_id: string,
): Promise<QueryResult<any> | null> => {
  try {
    const db = getPool("read");
    let queryText =
      "SELECT long_url from urls where short_code = $1 and user_id = $2";

    const userid = assertUUID(user_id);

    let result = await db.query(queryText, [shortCode, userid]);
    return result;
  } catch (error: any) {
    logger.error("error fetching url from DB", error.stack);
    return null;
  }
};

export const checkIfAlreadyExists = async (
  longURL: string,
  user_id: string,
): Promise<QueryResult<any> | null> => {
  try {
    const db = getPool("read");
    let queryText = "SELECT * from urls where longURL = $1 and user_id = $2";

    const userid = assertUUID(user_id);

    let result = await db.query(queryText, [longURL, userid]);
    return result;
  } catch (error: any) {
    logger.error("error fetching url from DB", error.stack);
    return null;
  }
};

export const getUrlIdFromDb = async (
  shortCode: string,
  user_id: string,
): Promise<QueryResult<any> | null> => {
  try {
    const db = getPool("read");
    let queryText =
      "SELECT id FROM urls where short_code = $1 and user_id = $2";

    const userid = assertUUID(user_id);

    let res = await db.query(queryText, [shortCode, userid]);
    return res;
  } catch (error: any) {
    logger.error("error fetching url from DB", error.stack);
    return null;
  }
};

export const fetchAllByUserId = async (user_id: string) => {
    const db = getPool("read");
    const userid = assertUUID(user_id);
    const res = await db.query(
      "select short_code, long_url, created_at from urls where user_id = $1 order by created_at desc",
      [userid],
    );
    return res;
};

export const deleteByShortcodeAndUserid = async (user_id: string, shortCode: string) => {
  try {
    const db = getPool("read");
    const userid = assertUUID(user_id);
    await db.query(
      "delete from urls where short_code = $1 and user_id = $2",
      [shortCode, userid],
    );
  } catch (error: any) {
    logger.error("error fetching urls from DB", error.stack);
    return null;
  }
};