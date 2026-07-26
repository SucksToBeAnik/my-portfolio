import { desc } from "drizzle-orm";
import type { Metadata } from "next";
import ReactDOM from "react-dom";
import { EAGER_COUNT, type SiteEntry, SitesIndex } from "@/components/SitesIndex";
import { db } from "@/db";
import { sites } from "@/db/schema";
import { cdnImage } from "@/lib/cloudinary";

// Cached until an admin write — createSite/updateSite/deleteSite all
// revalidate this path, and nothing here reads the clock (the Today / This
// Week buckets are derived in the browser, see SitesIndex).
export const revalidate = false;

export const metadata: Metadata = {
  title: "Sites I Find Useful",
  description: "A running list of websites and tools worth bookmarking.",
};

export default async function SitesPage() {
  const rows = await db
    .select({
      id: sites.id,
      url: sites.url,
      tags: sites.tags,
      title: sites.title,
      description: sites.description,
      logo: sites.logo,
      image: sites.image,
      createdAt: sites.createdAt,
    })
    .from(sites)
    .orderBy(desc(sites.createdAt));

  const entries: SiteEntry[] = rows.map((row) => ({
    ...row,
    logo: row.logo ? cdnImage(row.logo, 40) : null,
    createdAt: row.createdAt.getTime(),
  }));

  // Above-the-fold logos download with the document rather than waiting for
  // layout, which is what made the rows visibly pop in one by one.
  for (const entry of entries.slice(0, EAGER_COUNT)) {
    if (entry.logo) ReactDOM.preload(entry.logo, { as: "image" });
  }

  // The clock at render time, which for a cached page is the clock at the last
  // admin write. Good enough for the first paint; SitesIndex re-derives the
  // buckets against the visitor's clock on mount.
  return <SitesIndex sites={entries} renderedAt={Date.now()} />;
}
