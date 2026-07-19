"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { lifeEvents } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

const schema = z.object({
  title: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().optional().nullable(),
  description: z.string().min(1),
  imageUrl: z.string().optional().nullable(),
  url: z.string().optional().nullable(),
  role: z.string().optional().nullable(),
  type: z.string().min(1),
  current: z.boolean().optional(),
  location: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  sortOrder: z.number().optional(),
});

export async function getLifeEvents() {
  return db.select().from(lifeEvents).orderBy(lifeEvents.sortOrder);
}

export async function createLifeEvent(data: z.infer<typeof schema>) {
  await requireAdmin();
  const parsed = schema.parse(data);
  await db.insert(lifeEvents).values(parsed);
  revalidatePath("/admin/life-events");
  revalidatePath("/life");
  revalidatePath("/");
}

export async function updateLifeEvent(id: number, data: z.infer<typeof schema>) {
  await requireAdmin();
  const parsed = schema.parse(data);
  await db
    .update(lifeEvents)
    .set({ ...parsed, updatedAt: new Date() })
    .where(eq(lifeEvents.id, id));
  revalidatePath("/admin/life-events");
  revalidatePath("/life");
  revalidatePath("/");
}

export async function deleteLifeEvent(id: number) {
  await requireAdmin();
  await db.delete(lifeEvents).where(eq(lifeEvents.id, id));
  revalidatePath("/admin/life-events");
  revalidatePath("/life");
  revalidatePath("/");
}

export async function reorderLifeEvents(items: { id: number; sortOrder: number }[]) {
  await requireAdmin();
  for (const item of items) {
    await db
      .update(lifeEvents)
      .set({ sortOrder: item.sortOrder })
      .where(eq(lifeEvents.id, item.id));
  }
  revalidatePath("/admin/life-events");
  revalidatePath("/life");
  revalidatePath("/");
}
