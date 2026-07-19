import { count, eq } from "drizzle-orm";
import Link from "next/link";
import { updateWorkingOn } from "@/actions/site-config";
import { LogoutButton } from "@/components/LogoutButton";
import UserEmail from "@/components/UserEmail";
import { db } from "@/db";
import {
  books,
  cvs,
  lifeEvents,
  media,
  microblogs,
  projects,
  publications,
  siteConfig,
  sites,
  stacks,
  tils,
} from "@/db/schema";
import { auth } from "@/lib/auth";

export const metadata = {
  title: "Dashboard | Admin",
};

export default async function DashboardPage() {
  const session = await auth();
  const [projectCount] = await db.select({ c: count() }).from(projects);
  const [publicationCount] = await db.select({ c: count() }).from(publications);
  const [lifeCount] = await db.select({ c: count() }).from(lifeEvents);
  const [bookCount] = await db.select({ c: count() }).from(books);
  const [microblogCount] = await db.select({ c: count() }).from(microblogs);
  const [stackCount] = await db.select({ c: count() }).from(stacks);
  const [siteCount] = await db.select({ c: count() }).from(sites);
  const [mediaCount] = await db.select({ c: count() }).from(media);
  const [tilCount] = await db.select({ c: count() }).from(tils);
  const [cvCount] = await db.select({ c: count() }).from(cvs);

  const workingOn = await db
    .select()
    .from(siteConfig)
    .where(eq(siteConfig.key, "working_on"))
    .limit(1)
    .then((r) => r[0]?.value ?? "");

  const workingOnUrl = await db
    .select()
    .from(siteConfig)
    .where(eq(siteConfig.key, "working_on_url"))
    .limit(1)
    .then((r) => r[0]?.value ?? "");

  const sections = [
    { label: "Projects", count: projectCount.c, href: "/admin/projects" },
    { label: "Publications", count: publicationCount.c, href: "/admin/publications" },
    { label: "Life Events", count: lifeCount.c, href: "/admin/life-events" },
    { label: "Books", count: bookCount.c, href: "/admin/books" },
    { label: "Microblogs", count: microblogCount.c, href: "/admin/microblogs" },
    { label: "Stacks", count: stackCount.c, href: "/admin/stacks" },
    { label: "Sites", count: siteCount.c, href: "/admin/sites" },
    { label: "Media", count: mediaCount.c, href: "/admin/media" },
    { label: "TIL", count: tilCount.c, href: "/admin/tils" },
    { label: "CVs", count: cvCount.c, href: "/admin/cvs" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-heading">Dashboard</h1>
        <span className="flex items-center gap-1.5 text-[10px] text-muted">
          Quick add
          <kbd className="px-1.5 py-0.5 bg-hover-bg border border-hairline rounded text-[9px] leading-none">
            ⌘I
          </kbd>
        </span>
      </div>

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

      <form action={updateWorkingOn} className="border border-hairline rounded-xl p-4 space-y-3">
        <label className="text-xs text-fg/50 block">Currently working on</label>
        <input
          name="working_on"
          defaultValue={workingOn}
          placeholder="e.g. Building X with Y..."
          className="w-full px-3 py-1.5 text-xs bg-hover-bg border border-hairline rounded-lg text-fg placeholder-fg/30 focus:outline-none focus:border-fg/30 transition-colors"
        />
        <label className="text-xs text-fg/50 block">Link (GitHub, project, etc.)</label>
        <input
          name="working_on_url"
          defaultValue={workingOnUrl}
          placeholder="https://github.com/..."
          className="w-full px-3 py-1.5 text-xs bg-hover-bg border border-hairline rounded-lg text-fg placeholder-fg/30 focus:outline-none focus:border-fg/30 transition-colors"
        />
        <button
          type="submit"
          className="px-3 py-1.5 text-xs font-medium bg-fg text-bg rounded-lg hover:opacity-90 transition-all cursor-pointer"
        >
          Save
        </button>
      </form>

      <footer className="flex items-center justify-between gap-3x pt-4">
        <UserEmail email={session?.user?.email} />
        <LogoutButton />
      </footer>
    </div>
  );
}
