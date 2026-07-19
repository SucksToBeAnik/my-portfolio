"use server";

import { desc, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { sites } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

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
  await db.insert(sites).values(parsed);
  revalidatePath("/admin/sites");
  revalidatePath("/sites");
}

export async function createSiteFromUrl(url: string) {
  await requireAdmin();
  const parsed = siteSchema.parse({ url });
  await db.insert(sites).values(parsed);
  revalidatePath("/admin/sites");
  revalidatePath("/sites");
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

// Called client-side after microlink fetch. Admin-gated: the public /sites
// page swallows the rejection for anonymous visitors, so only your own
// browsing backfills descriptions (until the /sites server-side rework).
export async function saveSiteDescription(url: string, description: string) {
  await requireAdmin();
  await db.update(sites).set({ description }).where(eq(sites.url, url));
  revalidatePath("/sites");
}
