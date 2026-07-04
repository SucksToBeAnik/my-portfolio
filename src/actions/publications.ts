"use server";

import { asc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { publications } from "@/db/schema";

const schema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  venue: z.string().optional().nullable(),
  url: z.string().optional().nullable(),
  publishedOn: z.string().optional().nullable(),
});

export async function getPublications() {
  return db.select().from(publications).orderBy(asc(publications.sortOrder));
}

export async function createPublication(data: z.infer<typeof schema>) {
  const parsed = schema.parse(data);
  const maxOrder = await db
    .select({ max: sql<number>`max(${publications.sortOrder})` })
    .from(publications)
    .then((r) => r[0]?.max ?? -1);

  await db.insert(publications).values({ ...parsed, sortOrder: maxOrder + 1 });
  revalidatePath("/admin/publications");
  revalidatePath("/");
}

export async function updatePublication(id: number, data: z.infer<typeof schema>) {
  const parsed = schema.parse(data);
  await db
    .update(publications)
    .set({ ...parsed, updatedAt: new Date() })
    .where(eq(publications.id, id));
  revalidatePath("/admin/publications");
  revalidatePath("/");
}

export async function deletePublication(id: number) {
  await db.delete(publications).where(eq(publications.id, id));
  revalidatePath("/admin/publications");
  revalidatePath("/");
}

export async function reorderPublications(items: { id: number; sortOrder: number }[]) {
  await Promise.all(
    items.map(({ id, sortOrder }) =>
      db.update(publications).set({ sortOrder }).where(eq(publications.id, id)),
    ),
  );
  revalidatePath("/admin/publications");
  revalidatePath("/");
}
