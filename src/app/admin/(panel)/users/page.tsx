import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ROLE_LABELS, type Role } from "@/lib/constants";
import { PageHeader, LinkButton } from "@/components/admin/ui";
import { SampleBadge } from "@/components/news/Labels";

export const metadata: Metadata = { title: "ব্যবহারকারী" };

export default async function UsersAdmin() {
  await requireUser(["ADMIN"]);
  const users = await db.user.findMany({
    orderBy: [{ active: "desc" }, { role: "asc" }, { name: "asc" }],
    include: { _count: { select: { articles: true } } },
  });
  return (
    <>
      <PageHeader title="ব্যবহারকারী ও লেখক" actions={<LinkButton href="/admin/users/new">নতুন ব্যবহারকারী</LinkButton>}>
        অ্যাডমিনিস্ট্রেটর সব কিছু; সম্পাদক প্রকাশ ও সাইট পরিচালনা; প্রতিবেদক শুধু নিজের খসড়া লিখে জমা দিতে পারেন।
      </PageHeader>
      <div className="overflow-x-auto rounded border border-line bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-line bg-surface">
            <tr>
              <th scope="col" className="px-3 py-2">
                নাম
              </th>
              <th scope="col" className="px-3 py-2">
                ইমেইল
              </th>
              <th scope="col" className="px-3 py-2">
                ভূমিকা
              </th>
              <th scope="col" className="px-3 py-2">
                লেখা
              </th>
              <th scope="col" className="px-3 py-2">
                অবস্থা
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-line last:border-0">
                <td className="px-3 py-2.5">
                  <Link href={`/admin/users/${u.id}`} className="font-semibold hover:underline">
                    {u.name}
                  </Link>{" "}
                  {u.isSample && <SampleBadge />}
                </td>
                <td className="px-3 py-2.5" lang="en">
                  {u.email}
                </td>
                <td className="px-3 py-2.5">{ROLE_LABELS[u.role as Role]}</td>
                <td className="px-3 py-2.5">{u._count.articles}</td>
                <td className="px-3 py-2.5">{!u.active ? "নিষ্ক্রিয়" : !u.canLogin ? "লগইন বন্ধ (শুধু বাইলাইন)" : "সক্রিয়"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
