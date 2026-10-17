/**
 * Creates or resets an administrator account from the command line.
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a long passphrase' ADMIN_NAME='নাম' npm run create-admin
 * The password is read from the environment so it never lands in source control or shell history files you commit.
 */
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { db } from "../src/lib/db";

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "";
  if (!email || password.length < 12) throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD (12+ characters).");
  const passwordHash = await bcrypt.hash(password, 12);
  const name = process.env.ADMIN_NAME?.trim() || "অ্যাডমিন";
  const u = await db.user.upsert({
    where: { email },
    create: { email, name, passwordHash, role: "ADMIN", slug: "admin-" + randomBytes(3).toString("hex"), showOnTeam: false },
    update: { passwordHash, role: "ADMIN", active: true, canLogin: true },
  });
  await db.session.deleteMany({ where: { userId: u.id } });
  console.log(`Administrator ready: ${email}`);
}

main().finally(() => db.$disconnect());
