"use server";

import { asc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { awards } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { revalidateHome } from "@/lib/revalidate-home";

// Blank optional fields are stored as null.
const optional = z
  .string()
  .trim()
  .nullish()
  .transform((v) => v || null);

const schema = z.object({
  title: z.string().trim().min(1),
  detail: optional,
  year: optional,
  url: optional.pipe(z.string().url().nullable()),
});
export type AwardInput = z.input<typeof schema>;

function revalidateAwards() {
  revalidatePath("/admin/awards");
  revalidateHome();
}

export async function getAwards() {
  return db.select().from(awards).orderBy(asc(awards.sortOrder));
}

export async function createAward(data: AwardInput) {
  await requireAdmin();
  const parsed = schema.parse(data);
  const [row] = await db.select({ max: sql<number | null>`max(${awards.sortOrder})` }).from(awards);
  await db.insert(awards).values({ ...parsed, sortOrder: (row?.max ?? -1) + 1 });
  revalidateAwards();
}

export async function updateAward(id: number, data: AwardInput) {
  await requireAdmin();
  const parsed = schema.parse(data);
  await db
    .update(awards)
    .set({ ...parsed, updatedAt: new Date() })
    .where(eq(awards.id, id));
  revalidateAwards();
}

export async function deleteAward(id: number) {
  await requireAdmin();
  await db.delete(awards).where(eq(awards.id, id));
  revalidateAwards();
}

export async function reorderAwards(items: { id: number; sortOrder: number }[]) {
  await requireAdmin();
  await Promise.all(
    items.map(({ id, sortOrder }) => db.update(awards).set({ sortOrder }).where(eq(awards.id, id))),
  );
  revalidateAwards();
}
