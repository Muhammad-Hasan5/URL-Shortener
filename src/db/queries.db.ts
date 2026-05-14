import { PgPool } from "./index.db.js";
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

// table creation
const createTable = async () => {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS urls (
        id BIGINT PRIMARY KEY,
        short_code VARCHAR(10) UNIQUE NOT NULL,
        long_url TEXT NOT NULL,
        click_count INT DEFAULT 0,
        expires_at TIMESTAMP NULL,
        deleted_at TIMESTAMP NULL,
        last_accessed_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await PgPool.query(query);
    logger.info("Table created successfully");
  } catch (error: any) {
    logger.error("error creating table", error.stack);
  }
};

const createIndex = async () => {
  try {
    // create index on short_code
    const idx_long_url = `CREATE INDEX IF NOT EXISTS idx_long_url 
                        ON urls (long_url)`;

    const idx_active_shortCodes = `CREATE INDEX IF NOT EXISTS idx_active_short_codes ON urls (short_code) WHERE deleted_at IS NULL`;

    const response = await Promise.all([
      PgPool.query(idx_long_url),
      PgPool.query(idx_active_shortCodes),
    ]);

    logger.info(
      { IndexQueryResponse: response },
      "Indexes created successfully",
    );
  } catch (error: any) {
    logger.error("error creating index", error.stack);
  }
};

await createTable();
await createIndex();
