import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import {
  customType,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export { count, desc, eq, sql } from "drizzle-orm";

const readEnv = (...keys: string[]): string | undefined => {
  for (const key of keys) {
    if (typeof process !== "undefined" && process.env?.[key])
      return process.env[key];
    const fromImport = (import.meta.env as Record<string, string | undefined>)[
      key
    ];
    if (fromImport) return fromImport;
  }
  return undefined;
};

const rawUrl = readEnv("TURSO_DATABASE_URL", "ASTRO_DB_REMOTE_URL");
const url = rawUrl || "file:local.db";
const authToken = readEnv("TURSO_AUTH_TOKEN", "ASTRO_DB_APP_TOKEN");

const client = createClient({ url, authToken });

// Auto-initialize SQLite table if running on local file database
if (url.startsWith("file:")) {
  client
    .execute(`
      CREATE TABLE IF NOT EXISTS "Guestbook" (
        "id" integer PRIMARY KEY AUTOINCREMENT,
        "name" text NOT NULL,
        "message" text NOT NULL,
        "website" text,
        "parentId" integer,
        "heartCount" integer DEFAULT 0,
        "createdAt" text NOT NULL
      );
    `)
    .catch(() => {});
}

const isoDate = customType<{ data: Date; driverData: string }>({
  dataType: () => "text",
  toDriver: (value) => value.toISOString(),
  fromDriver: (value) => new Date(/Z$/.test(value) ? value : `${value}Z`),
});

export const Guestbook = sqliteTable("Guestbook", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  message: text("message").notNull(),
  website: text("website"),
  parentId: integer("parentId"),
  heartCount: integer("heartCount"),
  createdAt: isoDate("createdAt").notNull(),
});

export const db = drizzle(client);
