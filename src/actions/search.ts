"use server"

import { db } from "@/db"
import { projects, books, microblogs, lifeEvents, stacks } from "@/db/schema"
import { desc, eq } from "drizzle-orm"

export interface SearchIndexItem {
  id: number
  title: string
  subtitle: string
  url: string
  type: "project" | "book" | "microblog" | "lifeEvent" | "stack"
}

export async function getSearchIndex() {
  const [allProjects, allBooks, allMicroblogs, allLifeEvents, allStacks] = await Promise.all([
    db
      .select({ id: projects.id, title: projects.title, description: projects.description })
      .from(projects)
      .orderBy(desc(projects.sortOrder)),
    db
      .select({ id: books.id, title: books.title, author: books.author })
      .from(books)
      .orderBy(desc(books.sortOrder)),
    db
      .select({ id: microblogs.id, title: microblogs.title })
      .from(microblogs)
      .where(eq(microblogs.published, true))
      .orderBy(desc(microblogs.publishedAt)),
    db
      .select({ id: lifeEvents.id, title: lifeEvents.title, description: lifeEvents.description })
      .from(lifeEvents)
      .orderBy(desc(lifeEvents.sortOrder)),
    db
      .select({ id: stacks.id, name: stacks.name, description: stacks.description })
      .from(stacks)
      .orderBy(desc(stacks.sortOrder)),
  ])

  const items: SearchIndexItem[] = [
    ...allProjects.map((p) => ({
      id: p.id,
      title: p.title,
      subtitle: p.description ? p.description.replace(/<[^>]*>/g, "").slice(0, 120) : "",
      url: "/projects",
      type: "project" as const,
    })),
    ...allBooks.map((b) => ({
      id: b.id,
      title: b.title,
      subtitle: b.author,
      url: `/books/${b.id}`,
      type: "book" as const,
    })),
    ...allMicroblogs.map((m) => ({
      id: m.id,
      title: m.title,
      subtitle: "",
      url: `/microblog/${m.id}`,
      type: "microblog" as const,
    })),
    ...allLifeEvents.map((l) => ({
      id: l.id,
      title: l.title,
      subtitle: l.description ? l.description.replace(/<[^>]*>/g, "").slice(0, 120) : "",
      url: "/life",
      type: "lifeEvent" as const,
    })),
    ...allStacks.map((s) => ({
      id: s.id,
      title: s.name,
      subtitle: s.description ? s.description.replace(/<[^>]*>/g, "").slice(0, 120) : "",
      url: "/utils",
      type: "stack" as const,
    })),
  ]

  return items
}
