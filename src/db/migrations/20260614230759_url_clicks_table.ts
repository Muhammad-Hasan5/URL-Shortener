import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("url_clicks", (table) => {
    // bigint auto generated identity column in postgres
    table.bigIncrements("id").primary();

    table
      .bigInteger("url_id")
      .notNullable()
      .references("id")
      .inTable("urls")
      .onDelete("CASCADE");

    table.string("short_code", 12).notNullable();

    table
      .timestamp("clicked_at", {
        useTz: true,
      })
      .notNullable()
      .defaultTo(knex.fn.now());

    // Location
    table.string("country_code", 2);
    table.string("country_name", 60);
    table.string("city", 100);
    table.string("region", 100);

    table.decimal("latitude", 9, 6);
    table.decimal("longitude", 9, 6);

    table.string("timezone", 50);

    // Device
    table.string("device_type", 20); // desktop|mobile|tablet
    table.string("os_name", 40);
    table.string("browser_name", 40);
    table.string("browser_version", 10);

    table.boolean("is_bot").notNullable().defaultTo(false);

    // Traffic source
    table.text("referrer_url");
    table.string("referrer_domain", 100);
    table.string("referrer_type", 20); // direct|social|search|email|website
    table.string("referrer_name", 60);

    // Privacy-safe fingerprint
    table.string("ip_hash", 64);

    table.boolean("is_unique");
  });

  // Indexes
  await knex.schema.alterTable("url_clicks", (table) => {
    table.index(["url_id", "clicked_at"], "idx_clicks_url_time");
  });

  // Partial index
  await knex.raw(`
    CREATE INDEX idx_clicks_short
    ON url_clicks(short_code, clicked_at DESC)
    WHERE is_bot = FALSE
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("url_clicks");
}
