"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/db"
import { projects } from "@/db/schema"
import { z } from "zod"
import { eq } from "drizzle-orm"

const schema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  techStack: z.string().optional(),
  imageUrl: z.string().optional(),
  videoUrl: z.string().optional(),
  url: z.string().optional(),
  githubUrl: z.string().optional(),
  featured: z.boolean().optional(),
  sortOrder: z.number().optional(),
})

export async function getProjects() {
  return db.select().from(projects).orderBy(projects.sortOrder)
}

export async function createProject(data: z.infer<typeof schema>) {
  const parsed = schema.parse(data)
  await db.insert(projects).values(parsed)
  revalidatePath("/admin/projects")
}

export async function updateProject(id: number, data: z.infer<typeof schema>) {
  const parsed = schema.parse(data)
  await db
    .update(projects)
    .set({ ...parsed, updatedAt: new Date() })
    .where(eq(projects.id, id))
  revalidatePath("/admin/projects")
}

export async function deleteProject(id: number) {
  await db.delete(projects).where(eq(projects.id, id))
  revalidatePath("/admin/projects")
}

export async function reorderProjects(
  items: { id: number; sortOrder: number }[]
) {
  for (const item of items) {
    await db
      .update(projects)
      .set({ sortOrder: item.sortOrder })
      .where(eq(projects.id, item.id))
  }
  revalidatePath("/admin/projects")
}
