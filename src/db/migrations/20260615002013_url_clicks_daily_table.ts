import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("url_clicks_daily", (table) => {
    table.bigInteger("url_id").notNullable();
    table.bigInteger("user_id").references("id").inTable("users").notNullable().onDelete("CASCADE");
    table.date("date").notNullable();
    table.string("country_code", 2);
    table.string("device_type", 20);
    table.string("referrer_type", 20);
    table.string("browser_name", 40);
    table.integer("total_clicks").notNullable().defaultTo(0);
    table.integer("unique_clicks").notNullable().defaultTo(0);
    table.integer("bot_clicks").notNullable().defaultTo(0);

    table.primary([
      "url_id",
      "user_id",
      "date",
      "country_code",
      "device_type",
      "referrer_type",
      "browser_name",
    ]);

    table
      .foreign("url_id")
      .references("id")
      .inTable("urls")
      .onDelete("CASCADE");
  });

  // Helpful analytics indexes
  await knex.schema.alterTable("url_clicks_daily", (table) => {
    table.index(["date"], "idx_url_clicks_daily_date");
    table.index(["user_id"], "idx_url_clicks_daily_userId");
    table.index(["url_id", "date"], "idx_url_clicks_daily_url_date");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("url_clicks_daily");
}
