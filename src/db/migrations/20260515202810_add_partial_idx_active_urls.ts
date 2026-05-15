import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(
    "CREATE INDEX IF NOT EXISTS idx_active_short_codes ON urls (short_code) WHERE deleted_at IS NULL",
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw("DROP INDEX IF EXISTS idx_active_short_codes");
}
