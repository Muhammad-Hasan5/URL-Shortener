import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("users", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));

    table.string("first_name", 100);
    table.string("last_name", 100);
    table.string("email", 255).notNullable().unique();

    table.string("password_hash", 255);

    table.string("provider", 50).defaultTo("local");
    table.string("provider_id", 255);

    table
      .enu("status", ["active", "inactive", "suspended", "deleted"], {
        useNative: true,
        enumName: "user_status",
      })
      .defaultTo("active");

    table.boolean("email_verified").defaultTo(false);
    table.timestamp("email_verified_at");

    table.string("password_reset_token");
    table.timestamp("password_reset_expires_at");

    table.string("email_verification_token");

    table.timestamp("email_verification_expires_at");

    table.text("refresh_token");

    table.text("avatar_url");

    table.timestamp("last_login_at");
    table.string("last_login_ip", 45);
    table.integer("failed_login_attempts").defaultTo(0);
    table.timestamp("locked_until");

    table.timestamp("deleted_at");

    table.timestamps(true, true);

    // Indexes
    table.index(["email"]);
    table.index(["provider", "provider_id"]);
    table.index(["status"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("users");
}
