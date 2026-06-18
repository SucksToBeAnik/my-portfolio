"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/db"
import { books, microblogs } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function getBook(id: number) {
  const items = await db.select().from(books).where(eq(books.id, id)).limit(1)
  return items[0] || null
}

export async function getMicroblog(id: number) {
  const items = await db.select().from(microblogs).where(eq(microblogs.id, id)).limit(1)
  return items[0] || null
}
