import type { Knex } from "knex";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config: Knex.Config = {
  client: "pg",
  connection: process.env.PG_PRIMARY_STRING!,
  pool: { min: 1, max: 2 },
  migrations: {
    directory: path.resolve(__dirname, "./db/migrations"),
    extension: "ts",
    loadExtensions: [".ts"],
    tableName: "knex_migrations",
    stub: path.resolve(__dirname, "./db/migration.stub.ts"),
  },
};

export default config;
