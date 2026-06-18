"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/db"
import { microblogs } from "@/db/schema"
import { z } from "zod"
import { eq } from "drizzle-orm"

const schema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  imageUrl: z.string().optional(),
  published: z.boolean().optional(),
  publishedAt: z.date().optional().nullable(),
})

export async function getMicroblogs() {
  return db.select().from(microblogs).orderBy(microblogs.sortOrder)
}

export async function createMicroblog(data: z.infer<typeof schema>) {
  const parsed = schema.parse(data)
  await db.insert(microblogs).values({
    ...parsed,
    publishedAt: parsed.published && !parsed.publishedAt ? new Date() : parsed.publishedAt,
  })
  revalidatePath("/admin/microblogs")
}

export async function updateMicroblog(id: number, data: z.infer<typeof schema>) {
  const parsed = schema.parse(data)
  await db
    .update(microblogs)
    .set({
      ...parsed,
      updatedAt: new Date(),
      publishedAt: parsed.published
        ? (parsed.publishedAt || new Date())
        : null,
    })
    .where(eq(microblogs.id, id))
  revalidatePath("/admin/microblogs")
}

export async function deleteMicroblog(id: number) {
  await db.delete(microblogs).where(eq(microblogs.id, id))
  revalidatePath("/admin/microblogs")
}

export async function reorderMicroblogs(
  items: { id: number; sortOrder: number }[]
) {
  for (const item of items) {
    await db
      .update(microblogs)
      .set({ sortOrder: item.sortOrder })
      .where(eq(microblogs.id, item.id))
  }
  revalidatePath("/admin/microblogs")
}
