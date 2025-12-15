// config/db.ts
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const sql = neon(process.env.DATABASE_URL);

// Export a singleton Drizzle client (typed with your schema)
export const db = drizzle(sql, { schema });
// (No getDb function needed)
// export type DB = typeof db;
