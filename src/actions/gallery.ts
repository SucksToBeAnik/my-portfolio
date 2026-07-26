"use server";

import { asc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { gallery } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { MAX_FEATURED_PHOTOS } from "@/lib/photos";

const schema = z.object({
  title: z.string().min(1),
  imageUrl: z.string().url().min(1),
  width: z.number().int().positive().nullable().optional(),
  height: z.number().int().positive().nullable().optional(),
  takenAt: z.string().nullable().optional(),
  featured: z.boolean().optional(),
});

// Photos surface in three places: the admin list, the /photos page, and the
// featured pile on the homepage.
function revalidateGallery() {
  revalidatePath("/admin/photos");
  revalidatePath("/photos");
  revalidatePath("/");
}

export async function getGallery() {
  return db.select().from(gallery).orderBy(asc(gallery.sortOrder));
}

export async function getFeaturedGallery(limit = MAX_FEATURED_PHOTOS) {
  return db
    .select({
      id: gallery.id,
      title: gallery.title,
      imageUrl: gallery.imageUrl,
      width: gallery.width,
      height: gallery.height,
      takenAt: gallery.takenAt,
    })
    .from(gallery)
    .where(eq(gallery.featured, true))
    .orderBy(asc(gallery.sortOrder))
    .limit(limit);
}

export async function createGalleryItem(data: z.infer<typeof schema>) {
  await requireAdmin();
  const parsed = schema.parse(data);
  const maxOrder = await db
    .select({ max: sql<number>`max(${gallery.sortOrder})` })
    .from(gallery)
    .then((r) => r[0]?.max ?? -1);

  await db.insert(gallery).values({
    title: parsed.title,
    imageUrl: parsed.imageUrl,
    width: parsed.width ?? null,
    height: parsed.height ?? null,
    takenAt: parsed.takenAt ?? null,
    featured: parsed.featured ?? false,
    sortOrder: maxOrder + 1,
  });
  revalidateGallery();
}

export async function updateGalleryItem(id: number, data: z.infer<typeof schema>) {
  await requireAdmin();
  const parsed = schema.parse(data);
  await db
    .update(gallery)
    .set({
      title: parsed.title,
      imageUrl: parsed.imageUrl,
      width: parsed.width ?? null,
      height: parsed.height ?? null,
      takenAt: parsed.takenAt ?? null,
      featured: parsed.featured ?? false,
    })
    .where(eq(gallery.id, id));
  revalidateGallery();
}

export async function toggleGalleryFeatured(id: number, featured: boolean) {
  await requireAdmin();

  // The homepage pile has a fixed number of slots, so featuring is capped.
  if (featured) {
    const count = await db
      .select({ n: sql<number>`count(*)` })
      .from(gallery)
      .where(eq(gallery.featured, true))
      .then((r) => r[0]?.n ?? 0);
    if (count >= MAX_FEATURED_PHOTOS) {
      throw new Error(`Only ${MAX_FEATURED_PHOTOS} photos can be featured at once.`);
    }
  }

  await db.update(gallery).set({ featured }).where(eq(gallery.id, id));
  revalidateGallery();
}

export async function deleteGalleryItem(id: number) {
  await requireAdmin();
  await db.delete(gallery).where(eq(gallery.id, id));
  revalidateGallery();
}

export async function reorderGallery(items: { id: number; sortOrder: number }[]) {
  await requireAdmin();
  await Promise.all(
    items.map(({ id, sortOrder }) =>
      db.update(gallery).set({ sortOrder }).where(eq(gallery.id, id)),
    ),
  );
  revalidateGallery();
}
