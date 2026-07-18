"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { microblogs } from "@/db/schema";

const schema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  microview: z.string().max(180).optional().nullable(),
  tags: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  published: z.boolean().optional(),
  til: z.boolean().optional(),
  publishedAt: z.date().optional().nullable(),
});

export async function getMicroblogs() {
  return db.select().from(microblogs).orderBy(microblogs.sortOrder);
}

export async function getMicroblog(id: number) {
  return db
    .select()
    .from(microblogs)
    .where(eq(microblogs.id, id))
    .limit(1)
    .then((r) => r[0] ?? null);
}

export async function createMicroblog(data: z.infer<typeof schema>) {
  const parsed = schema.parse(data);
  const maxOrder = await db
    .select({ max: sql<number>`max(${microblogs.sortOrder})` })
    .from(microblogs)
    .then((r) => r[0]?.max ?? -1);

  const [row] = await db
    .insert(microblogs)
    .values({
      ...parsed,
      sortOrder: maxOrder + 1,
      publishedAt: parsed.published && !parsed.publishedAt ? new Date() : parsed.publishedAt,
    })
    .returning({ id: microblogs.id });
  revalidatePath("/admin/microblogs");
  revalidatePath("/posts");
  return { id: row.id };
}

export async function updateMicroblog(id: number, data: z.infer<typeof schema>) {
  const parsed = schema.parse(data);
  await db
    .update(microblogs)
    .set({
      ...parsed,
      updatedAt: new Date(),
      publishedAt: parsed.published ? parsed.publishedAt || new Date() : null,
    })
    .where(eq(microblogs.id, id));
  revalidatePath("/admin/microblogs");
  revalidatePath("/posts");
  revalidatePath(`/posts/${id}`);
}

export async function deleteMicroblog(id: number) {
  await db.delete(microblogs).where(eq(microblogs.id, id));
  revalidatePath("/admin/microblogs");
  revalidatePath("/posts");
  revalidatePath(`/posts/${id}`);
}

export async function reorderMicroblogs(items: { id: number; sortOrder: number }[]) {
  for (const item of items) {
    await db
      .update(microblogs)
      .set({ sortOrder: item.sortOrder })
      .where(eq(microblogs.id, item.id));
  }
  revalidatePath("/admin/microblogs");
  revalidatePath("/posts");
}
