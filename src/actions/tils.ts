"use server";

import { asc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { tils } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

const schema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
});

export async function getTils() {
  return db.select().from(tils).orderBy(asc(tils.sortOrder));
}

export async function getTilsPublic() {
  return db
    .select({
      id: tils.id,
      title: tils.title,
      content: tils.content,
      createdAt: tils.createdAt,
    })
    .from(tils)
    .orderBy(asc(tils.sortOrder));
}

export async function createTil(data: z.infer<typeof schema>) {
  await requireAdmin();
  const parsed = schema.parse(data);
  const maxOrder = await db
    .select({ max: sql<number>`max(${tils.sortOrder})` })
    .from(tils)
    .then((r) => r[0]?.max ?? -1);

  await db.insert(tils).values({ ...parsed, sortOrder: maxOrder + 1 });
  revalidatePath("/admin/tils");
  revalidatePath("/til");
}

export async function updateTil(id: number, data: z.infer<typeof schema>) {
  await requireAdmin();
  const parsed = schema.parse(data);
  await db
    .update(tils)
    .set({ ...parsed, updatedAt: new Date() })
    .where(eq(tils.id, id));
  revalidatePath("/admin/tils");
  revalidatePath("/til");
}

export async function deleteTil(id: number) {
  await requireAdmin();
  await db.delete(tils).where(eq(tils.id, id));
  revalidatePath("/admin/tils");
  revalidatePath("/til");
}

export async function reorderTils(items: { id: number; sortOrder: number }[]) {
  await requireAdmin();
  await Promise.all(
    items.map(({ id, sortOrder }) => db.update(tils).set({ sortOrder }).where(eq(tils.id, id))),
  );
  revalidatePath("/admin/tils");
  revalidatePath("/til");
}
