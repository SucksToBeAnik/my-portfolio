"use server";

import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { sites } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { fetchSiteMetaMirrored } from "@/lib/microlink";

const siteSchema = z.object({
  url: z.string().url(),
  tags: z.string().optional().nullable(),
});

export async function getSites() {
  return db.select().from(sites).orderBy(desc(sites.createdAt));
}

export async function createSite(data: z.infer<typeof siteSchema>) {
  await requireAdmin();
  const parsed = siteSchema.parse(data);
  // Best-effort: a failed lookup still saves the site, leaving title null —
  // `refreshMetadata()` picks it up from the admin dashboard.
  const meta = await fetchSiteMetaMirrored(parsed.url);
  await db.insert(sites).values({ ...parsed, ...meta });
  revalidatePath("/admin/sites");
  revalidatePath("/sites");
}

export async function createSiteFromUrl(url: string) {
  await createSite({ url });
}

export async function updateSite(id: number, data: z.infer<typeof siteSchema>) {
  await requireAdmin();
  const parsed = siteSchema.parse(data);

  // Editing the URL invalidates the stored metadata — it still describes the
  // old site. Re-look it up rather than leaving a row that points one way and
  // reads another.
  const [existing] = await db.select({ url: sites.url }).from(sites).where(eq(sites.id, id));
  // A failed lookup leaves a null title — which reads as the domain in the UI
  // and re-queues the row for `refreshMetadata()` — rather than keeping the
  // previous site's title.
  const urlChanged = Boolean(existing) && existing.url !== parsed.url;
  const meta = urlChanged ? await fetchSiteMetaMirrored(parsed.url) : {};

  await db
    .update(sites)
    .set({ ...parsed, ...meta })
    .where(eq(sites.id, id));
  revalidatePath("/admin/sites");
  revalidatePath("/sites");
}

export async function deleteSite(id: number) {
  await requireAdmin();
  await db.delete(sites).where(eq(sites.id, id));
  revalidatePath("/admin/sites");
  revalidatePath("/sites");
}
