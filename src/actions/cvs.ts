"use server";

import { desc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { cvs } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import type { Mode } from "@/lib/mode";
import { revalidateHome } from "@/lib/revalidate-home";

const schema = z.object({
  title: z.string().min(1),
  fileUrl: z.string().min(1),
});

export async function getCvs() {
  return db.select().from(cvs).orderBy(desc(cvs.createdAt));
}

const showcaseColumn = {
  academia: cvs.showcaseAcademia,
  industry: cvs.showcaseIndustry,
} as const;

export async function getShowcasedCv(mode: Mode) {
  const rows = await db.select().from(cvs).where(eq(showcaseColumn[mode], true)).limit(1);
  return rows[0] ?? null;
}

export async function createCv(data: z.infer<typeof schema>) {
  await requireAdmin();
  const parsed = schema.parse(data);
  const [maxOrderRow, academiaCv, industryCv] = await Promise.all([
    db.select({ max: sql<number>`max(${cvs.sortOrder})` }).from(cvs),
    getShowcasedCv("academia"),
    getShowcasedCv("industry"),
  ]);
  const maxOrder = maxOrderRow[0]?.max ?? -1;

  // An audience with no CV yet gets this one, so the home page never loses its link.
  await db.insert(cvs).values({
    ...parsed,
    sortOrder: maxOrder + 1,
    showcaseAcademia: !academiaCv,
    showcaseIndustry: !industryCv,
  });

  revalidatePath("/admin/cvs");
  revalidateHome();
}

export async function updateCv(id: number, data: z.infer<typeof schema>) {
  await requireAdmin();
  const parsed = schema.parse(data);
  await db
    .update(cvs)
    .set({ ...parsed, updatedAt: new Date() })
    .where(eq(cvs.id, id));
  revalidatePath("/admin/cvs");
  revalidateHome();
}

export async function deleteCv(id: number) {
  await requireAdmin();
  await db.delete(cvs).where(eq(cvs.id, id));
  revalidatePath("/admin/cvs");
  revalidateHome();
}

const showcaseFlag = (mode: Mode, value: boolean) =>
  mode === "academia" ? { showcaseAcademia: value } : { showcaseIndustry: value };

// One CV per audience: showcasing a CV for a mode takes it off whichever CV
// held that mode before. The same CV may hold both.
export async function setShowcasedCv(id: number, mode: Mode) {
  await requireAdmin();
  await db.update(cvs).set(showcaseFlag(mode, false)).where(eq(showcaseColumn[mode], true));
  await db.update(cvs).set(showcaseFlag(mode, true)).where(eq(cvs.id, id));
  revalidatePath("/admin/cvs");
  revalidateHome();
}

export async function unshowcaseCv(id: number, mode: Mode) {
  await requireAdmin();
  await db.update(cvs).set(showcaseFlag(mode, false)).where(eq(cvs.id, id));
  revalidatePath("/admin/cvs");
  revalidateHome();
}
