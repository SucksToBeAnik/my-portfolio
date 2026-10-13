"use server";

import { asc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { publications } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { type PublicationInput, publicationInputSchema as schema } from "@/lib/publications";
import { revalidateHome } from "@/lib/revalidate-home";

export async function getPublications() {
  return db.select().from(publications).orderBy(asc(publications.sortOrder));
}

export async function createPublication(data: PublicationInput) {
  await requireAdmin();
  const parsed = schema.parse(data);
  const maxOrder = await db
    .select({ max: sql<number>`max(${publications.sortOrder})` })
    .from(publications)
    .then((r) => r[0]?.max ?? -1);

  await db.insert(publications).values({ ...parsed, sortOrder: maxOrder + 1 });
  revalidatePath("/admin/publications");
  revalidateHome();
}

export async function updatePublication(id: number, data: PublicationInput) {
  await requireAdmin();
  const parsed = schema.parse(data);
  await db
    .update(publications)
    .set({ ...parsed, updatedAt: new Date() })
    .where(eq(publications.id, id));
  revalidatePath("/admin/publications");
  revalidateHome();
}

export async function deletePublication(id: number) {
  await requireAdmin();
  await db.delete(publications).where(eq(publications.id, id));
  revalidatePath("/admin/publications");
  revalidateHome();
}

export async function reorderPublications(items: { id: number; sortOrder: number }[]) {
  await requireAdmin();
  await Promise.all(
    items.map(({ id, sortOrder }) =>
      db.update(publications).set({ sortOrder }).where(eq(publications.id, id)),
    ),
  );
  revalidatePath("/admin/publications");
  revalidateHome();
}
