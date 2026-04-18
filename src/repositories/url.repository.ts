import { query } from "../db/index.js";

// save in db
export const saveToDB = async (result: {
  id: string;
  shortCode: string;
  longURL: string;
}) => {
  try {
    let queryText = `INSERT INTO urls (id, short_code, long_url) 
                    values ($1, $2, $3)
                    `;
    return await query(queryText, [
      result.id,
      result.shortCode,
      result.longURL,
    ]);
  } catch (error: any) {
    console.log("error saving to DB", error.stack);
  }
};

// get from db
export const getFromDB = async (shortCode: string) => {
  try {
    let queryText = "SELECT long_url from urls where short_code = $1";
    let result = await query(queryText, [shortCode]);
    return result;
  } catch (error: any) {
    console.log("error fetching url from DB", error.stack);
  }
};
