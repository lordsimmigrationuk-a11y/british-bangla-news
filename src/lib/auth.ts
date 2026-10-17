import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { db } from "./db";
import type { Role } from "./constants";

const COOKIE = "bbn_session";
const SESSION_DAYS = 14;

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  slug: string;
};

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function passwordProblem(password: string): string | null {
  if (password.length < 12) return "পাসওয়ার্ড কমপক্ষে ১২ অক্ষরের হতে হবে।";
  if (password.length > 200) return "পাসওয়ার্ড অনেক দীর্ঘ।";
  return null;
}

function secureCookies() {
  if (process.env.COOKIE_SECURE === "false") return false;
  return process.env.NODE_ENV === "production";
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 3600 * 1000);
  await db.session.create({ data: { id: hashToken(token), userId, expiresAt } });
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: secureCookies(),
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { id: hashToken(token) } });
  jar.delete(COOKIE);
}

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { id: hashToken(token) },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date() || !session.user.active || !session.user.canLogin) return null;
  const u = session.user;
  return { id: u.id, name: u.name, email: u.email, role: u.role as Role, slug: u.slug };
});

/** Use in admin pages and every server action. Redirects to the login page when signed out. */
export async function requireUser(roles?: Role[]): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (roles && !roles.includes(user.role)) redirect("/admin?denied=1");
  return user;
}
