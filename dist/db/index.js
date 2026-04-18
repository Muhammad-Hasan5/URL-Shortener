import { Pool } from "pg";
process.loadEnvFile();
console.log(process.env.connectionString);
const pool = new Pool({
    connectionString: String(process.env.connectionString),
});
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
        await pool.query(query);
        // create index on short_code
        const indexQuery = `CREATE INDEX IF NOT EXISTS idx_long_url 
                        ON urls (long_url)`;
        await pool.query(indexQuery);
        console.log("Table created successfully with indexes");
    }
    catch (error) {
        console.log("error creating table", error.stack);
    }
};
await createTable();
export const query = async (queryText, values) => {
    try {
        return await pool.query(queryText, values);
    }
    catch (error) {
        console.log("error fetching data", error.stack);
    }
};
//# sourceMappingURL=index.js.map