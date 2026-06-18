"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/db"
import { books } from "@/db/schema"
import { z } from "zod"
import { eq } from "drizzle-orm"

const schema = z.object({
  title: z.string().min(1),
  author: z.string().min(1),
  coverUrl: z.string().optional(),
  rating: z.number().min(1).max(5).optional().nullable(),
  review: z.string().optional(),
  quote: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(["reading", "read", "want_to_read"]),
  sortOrder: z.number().optional(),
})

export async function getBooks() {
  return db.select().from(books).orderBy(books.sortOrder)
}

export async function createBook(data: z.infer<typeof schema>) {
  const parsed = schema.parse(data)
  await db.insert(books).values(parsed)
  revalidatePath("/admin/books")
}

export async function updateBook(id: number, data: z.infer<typeof schema>) {
  const parsed = schema.parse(data)
  await db
    .update(books)
    .set({ ...parsed, updatedAt: new Date() })
    .where(eq(books.id, id))
  revalidatePath("/admin/books")
}

export async function deleteBook(id: number) {
  await db.delete(books).where(eq(books.id, id))
  revalidatePath("/admin/books")
}

export async function reorderBooks(
  items: { id: number; sortOrder: number }[]
) {
  for (const item of items) {
    await db
      .update(books)
      .set({ sortOrder: item.sortOrder })
      .where(eq(books.id, item.id))
  }
  revalidatePath("/admin/books")
}
