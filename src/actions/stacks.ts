"use server";

import { asc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { stacks } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { mirrorToCloudinary } from "@/lib/cloudinary";
import { fetchPreviewImageMirrored } from "@/lib/microlink";

const stackSchema = z.object({
  name: z.string().min(1),
  url: z.string().min(1),
  description: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  platform: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
});

export async function getStacks() {
  return db.select().from(stacks).orderBy(asc(stacks.sortOrder));
}

export async function createStack(data: z.infer<typeof stackSchema>) {
  await requireAdmin();
  const parsed = stackSchema.parse(data);
  const [maxOrder, previewImage, imageUrl] = await Promise.all([
    db
      .select({ max: sql<number>`max(${stacks.sortOrder})` })
      .from(stacks)
      .then((r) => r[0]?.max ?? -1),
    fetchPreviewImageMirrored(parsed.url),
    mirrorToCloudinary(parsed.imageUrl),
  ]);

  await db.insert(stacks).values({
    ...parsed,
    imageUrl: imageUrl ?? parsed.imageUrl,
    previewImage,
    sortOrder: maxOrder + 1,
  });
  revalidatePath("/admin/stacks");
  revalidatePath("/stacks");
}

export async function updateStack(id: number, data: z.infer<typeof stackSchema>) {
  await requireAdmin();
  const parsed = stackSchema.parse(data);

  const [existing] = await db
    .select({ url: stacks.url, imageUrl: stacks.imageUrl })
    .from(stacks)
    .where(eq(stacks.id, id));

  // The preview is derived from the URL, so it only needs refetching when the
  // URL moves. A pasted icon URL gets mirrored whenever it changes.
  const [previewImage, imageUrl] = await Promise.all([
    existing && existing.url !== parsed.url ? fetchPreviewImageMirrored(parsed.url) : undefined,
    existing && existing.imageUrl !== parsed.imageUrl
      ? mirrorToCloudinary(parsed.imageUrl)
      : undefined,
  ]);

  await db
    .update(stacks)
    .set({
      ...parsed,
      ...(previewImage !== undefined ? { previewImage } : {}),
      ...(imageUrl ? { imageUrl } : {}),
    })
    .where(eq(stacks.id, id));
  revalidatePath("/admin/stacks");
  revalidatePath("/stacks");
}

export async function deleteStack(id: number) {
  await requireAdmin();
  await db.delete(stacks).where(eq(stacks.id, id));
  revalidatePath("/admin/stacks");
  revalidatePath("/stacks");
}

export async function reorderStacks(ids: number[]) {
  await requireAdmin();
  await Promise.all(
    ids.map((id, index) => db.update(stacks).set({ sortOrder: index }).where(eq(stacks.id, id))),
  );
  revalidatePath("/admin/stacks");
  revalidatePath("/stacks");
}
