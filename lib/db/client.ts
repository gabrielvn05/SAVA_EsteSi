import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/lib/db/schema";

let pool: Pool | null = null;

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL no configurada. Requerida para ORM y migraciones.");
  }
  if (!pool) {
    pool = new Pool({ connectionString: url, max: 5 });
  }
  return drizzle(pool, { schema });
}

export async function closeDb() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
