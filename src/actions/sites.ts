"use server";

import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { sites } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { fetchSiteMeta } from "@/lib/microlink";

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
  // Best-effort: a failed lookup still saves the site; the /sites page
  // backfills missing metadata on its next revalidation.
  const meta = await fetchSiteMeta(parsed.url);
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
  await db.update(sites).set(parsed).where(eq(sites.id, id));
  revalidatePath("/admin/sites");
  revalidatePath("/sites");
}

export async function deleteSite(id: number) {
  await requireAdmin();
  await db.delete(sites).where(eq(sites.id, id));
  revalidatePath("/admin/sites");
  revalidatePath("/sites");
}
