import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp, hashKey } from "@/lib/request";
import { liveWhere } from "@/lib/queries";

/**
 * Anonymous view counter. Adds one to a per-article daily total. The client IP is used
 * only in memory (hashed) to ignore rapid repeats; nothing identifying is stored.
 */
export async function POST(req: Request) {
  let id: unknown;
  try {
    ({ id } = await req.json());
  } catch {
    return new Response(null, { status: 400 });
  }
  if (typeof id !== "string" || !/^[a-z0-9]{20,40}$/.test(id)) return new Response(null, { status: 400 });
  const ip = hashKey(await clientIp());
  if (!rateLimit(`view:${ip}:${id}`, 1, 30 * 60 * 1000).ok) return new Response(null, { status: 204 });
  if (!rateLimit(`views:${ip}`, 120, 60 * 60 * 1000).ok) return new Response(null, { status: 204 });
  const exists = await db.article.count({ where: { id, ...liveWhere() } });
  if (!exists) return new Response(null, { status: 204 });
  const day = new Date().toISOString().slice(0, 10);
  await db.articleViewDaily.upsert({
    where: { articleId_day: { articleId: id, day } },
    create: { articleId: id, day, count: 1 },
    update: { count: { increment: 1 } },
  });
  return new Response(null, { status: 204 });
}
