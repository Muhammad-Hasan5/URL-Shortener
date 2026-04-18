import { Pool } from "pg";

process.loadEnvFile()

console.log(process.env.connectionString!);

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
    //TODO: create index on short_code
    console.log("Table created successfully");
  } catch (error: any) {
    console.log("error creating table", error.stack);
  }
};

await createTable();

export const query = async (queryText: string, values?: any[]) => {
  try {
    return await pool.query(queryText, values);
  } catch (error: any) {
    console.log("error fetching data", error.stack);
  } 
};
