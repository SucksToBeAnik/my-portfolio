"use server";

import { desc, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { sites } from "@/db/schema";

const siteSchema = z.object({
  url: z.string().url(),
  tags: z.string().optional(),
});

export async function getSites() {
  return db.select().from(sites).orderBy(desc(sites.createdAt));
}

export async function createSite(data: z.infer<typeof siteSchema>) {
  const parsed = siteSchema.parse(data);
  await db.insert(sites).values(parsed);
  revalidatePath("/admin/sites");
  revalidatePath("/sites");
}

export async function createSiteFromUrl(url: string) {
  const parsed = siteSchema.parse({ url });
  await db.insert(sites).values(parsed);
  revalidatePath("/admin/sites");
  revalidatePath("/sites");
}

export async function updateSite(id: number, data: z.infer<typeof siteSchema>) {
  const parsed = siteSchema.parse(data);
  await db.update(sites).set(parsed).where(eq(sites.id, id));
  revalidatePath("/admin/sites");
  revalidatePath("/sites");
}

export async function deleteSite(id: number) {
  await db.delete(sites).where(eq(sites.id, id));
  revalidatePath("/admin/sites");
  revalidatePath("/sites");
}

// Called client-side after microlink fetch — only saves if description is still null
export async function saveSiteDescription(url: string, description: string) {
  await db
    .update(sites)
    .set({ description })
    .where(eq(sites.url, url));
}
