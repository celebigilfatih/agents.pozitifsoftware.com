import { eq } from "drizzle-orm";

import { db, pool } from "@/db";
import { user } from "@/db/schema";
import { auth } from "@/lib/auth";

function argument(name: string) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const name = argument("name")?.trim();
  const email = argument("email")?.trim().toLowerCase();
  const password = argument("password");
  if (!name || !email || !password || password.length < 12) {
    throw new Error(
      'Kullanım: pnpm admin:create --name "Ad Soyad" --email admin@example.com --password "en-az-12-karakter"',
    );
  }
  const existing = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, email))
    .limit(1);
  if (existing.length > 0)
    throw new Error("Bu e-posta ile bir kullanıcı zaten var.");

  const result = await auth.api.createUser({
    body: { name, email, password, role: "admin" },
  });
  await db
    .update(user)
    .set({ role: "admin" })
    .where(eq(user.id, result.user.id));
  process.stdout.write(`Yönetici oluşturuldu: ${result.user.email}\n`);
}

main()
  .catch((error: unknown) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : "Yönetici oluşturulamadı."}\n`,
    );
    process.exitCode = 1;
  })
  .finally(() => pool.end());
