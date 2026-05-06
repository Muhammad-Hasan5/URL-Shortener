import type { QueryResult } from "pg";
import { query } from "../db/index.js";

// new record type
type newRecordType = {
  id: string;
  shortCode: string;
  longURL: string;
};

// short code type
type shortCodeType = string;

// save in db
export const saveToDB = async (
  newRecord: newRecordType,
): Promise<QueryResult<any> | undefined> => {
  try {
    let queryText = `INSERT INTO urls (id, short_code, long_url) 
                    values ($1, $2, $3)
                    `;
    return await query(queryText, [
      newRecord.id,
      newRecord.shortCode,
      newRecord.longURL,
    ]);
  } catch (error: any) {
    console.log("error saving to DB", error.stack);
  }
};

// get from db
export const getFromDB = async (
  shortCode: shortCodeType,
): Promise<QueryResult<any> | undefined> => {
  try {
    let queryText = "SELECT long_url from urls where short_code = $1";
    let result = await query(queryText, [shortCode]);
    return result;
  } catch (error: any) {
    console.log("error fetching url from DB", error.stack);
  }
};
