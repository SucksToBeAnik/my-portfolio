"use server";

import { asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { gallery } from "@/db/schema";

const schema = z.object({
  title: z.string().min(1),
  imageUrl: z.string().url().min(1),
  takenAt: z.string().nullable().optional(),
});

export async function getGallery() {
  return db.select().from(gallery).orderBy(asc(gallery.sortOrder));
}

export async function createGalleryItem(data: z.infer<typeof schema>) {
  const parsed = schema.parse(data);
  const maxOrder = await db
    .select({ max: gallery.sortOrder })
    .from(gallery)
    .limit(1)
    .then((r) => r[0]?.max ?? -1);

  await db
    .insert(gallery)
    .values({ ...parsed, takenAt: parsed.takenAt ?? null, sortOrder: maxOrder + 1 });
  revalidatePath("/admin/gallery");
  revalidatePath("/life");
}

export async function updateGalleryItem(id: number, data: z.infer<typeof schema>) {
  const parsed = schema.parse(data);
  await db
    .update(gallery)
    .set({ title: parsed.title, imageUrl: parsed.imageUrl, takenAt: parsed.takenAt ?? null })
    .where(eq(gallery.id, id));
  revalidatePath("/admin/gallery");
  revalidatePath("/life");
}

export async function deleteGalleryItem(id: number) {
  await db.delete(gallery).where(eq(gallery.id, id));
  revalidatePath("/admin/gallery");
  revalidatePath("/life");
}

export async function reorderGallery(items: { id: number; sortOrder: number }[]) {
  await Promise.all(
    items.map(({ id, sortOrder }) =>
      db.update(gallery).set({ sortOrder }).where(eq(gallery.id, id)),
    ),
  );
  revalidatePath("/admin/gallery");
  revalidatePath("/life");
}
