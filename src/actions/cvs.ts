"use server";

import { desc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { cvs } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

const schema = z.object({
  title: z.string().min(1),
  fileUrl: z.string().min(1),
});

export async function getCvs() {
  return db.select().from(cvs).orderBy(desc(cvs.createdAt));
}

export async function getShowcasedCv() {
  const rows = await db.select().from(cvs).where(eq(cvs.showcased, true)).limit(1);
  return rows[0] ?? null;
}

export async function createCv(data: z.infer<typeof schema>) {
  await requireAdmin();
  const parsed = schema.parse(data);
  const [maxOrderRow, existingShowcase] = await Promise.all([
    db.select({ max: sql<number>`max(${cvs.sortOrder})` }).from(cvs),
    db.select({ id: cvs.id }).from(cvs).where(eq(cvs.showcased, true)).limit(1),
  ]);
  const maxOrder = maxOrderRow[0]?.max ?? -1;

  await db.insert(cvs).values({
    ...parsed,
    sortOrder: maxOrder + 1,
    showcased: !existingShowcase[0],
  });

  revalidatePath("/admin/cvs");
  revalidatePath("/");
}

export async function updateCv(id: number, data: z.infer<typeof schema>) {
  await requireAdmin();
  const parsed = schema.parse(data);
  await db
    .update(cvs)
    .set({ ...parsed, updatedAt: new Date() })
    .where(eq(cvs.id, id));
  revalidatePath("/admin/cvs");
  revalidatePath("/");
}

export async function deleteCv(id: number) {
  await requireAdmin();
  await db.delete(cvs).where(eq(cvs.id, id));
  revalidatePath("/admin/cvs");
  revalidatePath("/");
}

export async function setShowcasedCv(id: number) {
  await requireAdmin();
  await db.update(cvs).set({ showcased: false }).where(eq(cvs.showcased, true));
  await db.update(cvs).set({ showcased: true }).where(eq(cvs.id, id));
  revalidatePath("/admin/cvs");
  revalidatePath("/");
}

export async function unshowcaseCv(id: number) {
  await requireAdmin();
  await db.update(cvs).set({ showcased: false }).where(eq(cvs.id, id));
  revalidatePath("/admin/cvs");
  revalidatePath("/");
}
