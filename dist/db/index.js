import { Pool } from "pg";
process.loadEnvFile();
export const PgPool = new Pool({
    connectionString: String(process.env.connectionString),
});
//ready check method
export const checkPoolReady = async () => {
    try {
        await PgPool.query("SELECT 1");
        console.log("DB-pg pool ready");
        return true;
    }
    catch (error) {
        console.error("DB-pg pool not ready", error);
        return false;
    }
};
// DB queries:
//general query function
export const query = async (queryText, values) => {
    try {
        return await PgPool.query(queryText, values);
    }
    catch (error) {
        console.log("error fetching data", error.stack);
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
        await PgPool.query(query);
        // create index on short_code
        const indexQuery = `CREATE INDEX IF NOT EXISTS idx_long_url 
                        ON urls (long_url)`;
        await PgPool.query(indexQuery);
        console.log("Table created successfully with indexes");
    }
    catch (error) {
        console.log("error creating table", error.stack);
    }
};
await createTable();
//# sourceMappingURL=index.js.map