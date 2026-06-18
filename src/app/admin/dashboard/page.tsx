import Link from "next/link";
import { db } from "@/db";
import { projects, lifeEvents, books, microblogs, tools } from "@/db/schema";
import { count } from "drizzle-orm";

export default async function DashboardPage() {
  const [projectCount] = await db.select({ c: count() }).from(projects);
  const [lifeCount] = await db.select({ c: count() }).from(lifeEvents);
  const [bookCount] = await db.select({ c: count() }).from(books);
  const [microblogCount] = await db.select({ c: count() }).from(microblogs);
  const [toolCount] = await db.select({ c: count() }).from(tools);

  const sections = [
    { label: "Projects", count: projectCount.c, href: "/admin/projects" },
    { label: "Life Events", count: lifeCount.c, href: "/admin/life-events" },
    { label: "Books", count: bookCount.c, href: "/admin/books" },
    { label: "Microblogs", count: microblogCount.c, href: "/admin/microblogs" },
    { label: "Tools", count: toolCount.c, href: "/admin/tools" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-heading">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="border border-hairline rounded-xl p-4 hover:bg-hover-bg transition-colors space-y-2"
          >
            <p className="text-2xl font-heading">{s.count}</p>
            <p className="text-xs text-fg/50">{s.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
