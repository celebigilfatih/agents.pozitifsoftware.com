import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { env } from "@/env";
import * as schema from "@/db/schema";

const globalForDb = globalThis as unknown as { dbPool?: Pool };

export const pool =
  globalForDb.dbPool ??
  new Pool({
    connectionString: env.DATABASE_URL,
    max: env.NODE_ENV === "production" ? 15 : 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });

if (env.NODE_ENV !== "production") {
  globalForDb.dbPool = pool;
}

export const db = drizzle(pool, { schema });
