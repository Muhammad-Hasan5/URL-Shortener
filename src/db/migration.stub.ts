import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // schema changes go here
}

export async function down(knex: Knex): Promise<void> {
  // how to reverse the above
}
