"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/db"
import { tools } from "@/db/schema"
import { z } from "zod"
import { eq } from "drizzle-orm"

const schema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  imageUrl: z.string().optional(),
  url: z.string().optional(),
  category: z.string().min(1),
  sortOrder: z.number().optional(),
})

export async function getTools() {
  return db.select().from(tools).orderBy(tools.sortOrder)
}

export async function createTool(data: z.infer<typeof schema>) {
  const parsed = schema.parse(data)
  await db.insert(tools).values(parsed)
  revalidatePath("/admin/tools")
}

export async function updateTool(id: number, data: z.infer<typeof schema>) {
  const parsed = schema.parse(data)
  await db
    .update(tools)
    .set({ ...parsed, updatedAt: new Date() })
    .where(eq(tools.id, id))
  revalidatePath("/admin/tools")
}

export async function deleteTool(id: number) {
  await db.delete(tools).where(eq(tools.id, id))
  revalidatePath("/admin/tools")
}

export async function reorderTools(
  items: { id: number; sortOrder: number }[]
) {
  for (const item of items) {
    await db
      .update(tools)
      .set({ sortOrder: item.sortOrder })
      .where(eq(tools.id, item.id))
  }
  revalidatePath("/admin/tools")
}
