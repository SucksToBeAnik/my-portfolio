"use server"

import { db } from "@/db"
import { stacks } from "@/db/schema"
import { eq, asc } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const stackSchema = z.object({
  name: z.string().min(1),
  url: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  platform: z.string().optional(),
})

export async function getStacks() {
  return db.select().from(stacks).orderBy(asc(stacks.sortOrder))
}

export async function createStack(data: z.infer<typeof stackSchema>) {
  const parsed = stackSchema.parse(data)
  const maxOrder = await db
    .select({ max: stacks.sortOrder })
    .from(stacks)
    .limit(1)
    .then((r) => r[0]?.max ?? -1)

  await db.insert(stacks).values({ ...parsed, sortOrder: maxOrder + 1 })
  revalidatePath("/admin/stacks")
}

export async function updateStack(id: number, data: z.infer<typeof stackSchema>) {
  const parsed = stackSchema.parse(data)
  await db.update(stacks).set(parsed).where(eq(stacks.id, id))
  revalidatePath("/admin/stacks")
}

export async function deleteStack(id: number) {
  await db.delete(stacks).where(eq(stacks.id, id))
  revalidatePath("/admin/stacks")
}

export async function reorderStacks(ids: number[]) {
  await Promise.all(
    ids.map((id, index) => db.update(stacks).set({ sortOrder: index }).where(eq(stacks.id, id))),
  )
  revalidatePath("/admin/stacks")
}
