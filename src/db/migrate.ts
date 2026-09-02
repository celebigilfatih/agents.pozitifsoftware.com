import { migrate } from "drizzle-orm/node-postgres/migrator";

import { db, pool } from "@/db";

async function main() {
  await migrate(db, { migrationsFolder: "drizzle" });
  await pool.end();
}

main().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : "Bilinmeyen migration hatası";
  process.stderr.write(`Migration başarısız: ${message}\n`);
  process.exitCode = 1;
});
