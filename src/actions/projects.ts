"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { projects } from "@/db/schema";

const schema = z.object({
  title: z.string().min(1),
  content: z.string().optional().nullable(),
  microview: z.string().max(180).optional().nullable(),
  tags: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  url: z.string().optional().nullable(),
  githubUrl: z.string().optional().nullable(),
  workedOn: z.string().optional().nullable(),
  featured: z.boolean().optional(),
  published: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

export async function getProjects() {
  return db.select().from(projects).orderBy(projects.sortOrder);
}

export async function getProject(id: number) {
  return db
    .select()
    .from(projects)
    .where(eq(projects.id, id))
    .limit(1)
    .then((r) => r[0] ?? null);
}

// A project can only be featured once it's published.
function enforceFeatureRule<T extends { featured?: boolean; published?: boolean }>(parsed: T): T {
  return parsed.published ? parsed : { ...parsed, featured: false };
}

export async function createProject(data: z.infer<typeof schema>) {
  const parsed = enforceFeatureRule(schema.parse(data));
  const maxOrder = await db
    .select({ max: sql<number>`max(${projects.sortOrder})` })
    .from(projects)
    .then((r) => r[0]?.max ?? -1);

  const [row] = await db
    .insert(projects)
    .values({ ...parsed, sortOrder: parsed.sortOrder ?? maxOrder + 1 })
    .returning({ id: projects.id });
  revalidatePath("/admin/projects");
  revalidatePath("/projects");
  revalidatePath("/");
  return { id: row.id };
}

export async function updateProject(id: number, data: z.infer<typeof schema>) {
  const parsed = enforceFeatureRule(schema.parse(data));
  await db
    .update(projects)
    .set({ ...parsed, updatedAt: new Date() })
    .where(eq(projects.id, id));
  revalidatePath("/admin/projects");
  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  revalidatePath("/");
}

export async function deleteProject(id: number) {
  await db.delete(projects).where(eq(projects.id, id));
  revalidatePath("/admin/projects");
  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  revalidatePath("/");
}

export async function reorderProjects(items: { id: number; sortOrder: number }[]) {
  for (const item of items) {
    await db.update(projects).set({ sortOrder: item.sortOrder }).where(eq(projects.id, item.id));
  }
  revalidatePath("/admin/projects");
  revalidatePath("/");
}
