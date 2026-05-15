import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("urls", (table) => {
    table.bigInteger("id").primary(); 
    table.string("short_code", 10).notNullable().unique();
    table.text("long_url").notNullable();
    table.string("user_id").nullable();
    table.integer("click_count").defaultTo(0).notNullable();
    table.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp("last_accessed_at", {useTz: true}).nullable()
    table.timestamp("expires_at", { useTz: true }).nullable();
    table.timestamp("deleted_at", { useTz: true }).nullable();

    //indexes
    table.index(["short_code"]); 
    table.index(["created_at"]); 
    table.index(["long_url"])
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("urls")
}
