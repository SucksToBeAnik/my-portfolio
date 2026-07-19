import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { type SiteEntry, SitesIndex } from "@/components/SitesIndex";
import { db } from "@/db";
import { sites } from "@/db/schema";
import { fetchSiteMeta } from "@/lib/microlink";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Sites I Find Useful",
  description: "A running list of websites and tools worth bookmarking.",
};

function siteGroup(createdAt: Date): number {
  const days = (Date.now() - createdAt.getTime()) / 86_400_000;
  if (days < 1) return 0;
  if (days < 7) return 1;
  if (days < 30) return 2;
  return 3;
}

export default async function SitesPage() {
  const rows = await db.select().from(sites).orderBy(desc(sites.createdAt));

  // One-time backfill for rows created before metadata was persisted (new
  // sites get theirs in createSite). Failed lookups retry on the next
  // revalidation; the UI falls back to domain + favicon meanwhile.
  await Promise.all(
    rows
      .filter((row) => row.title === null)
      .map(async (row) => {
        const meta = await fetchSiteMeta(row.url);
        if (!meta) return;
        await db.update(sites).set(meta).where(eq(sites.id, row.id));
        Object.assign(row, meta);
      }),
  );

  const entries: SiteEntry[] = rows.map((row) => ({
    id: row.id,
    url: row.url,
    tags: row.tags,
    title: row.title,
    description: row.description,
    logo: row.logo,
    image: row.image,
    group: siteGroup(row.createdAt),
  }));

  return <SitesIndex sites={entries} />;
}
