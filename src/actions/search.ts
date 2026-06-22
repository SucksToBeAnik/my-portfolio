"use server";

import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { books, gallery, lifeEvents, media, microblogs, projects, stacks, tils } from "@/db/schema";
import { auth } from "@/lib/auth";

export interface SearchIndexItem {
  id: number;
  title: string;
  subtitle: string;
  url: string;
  type: "project" | "book" | "microblog" | "til" | "lifeEvent" | "stack" | "media" | "page";
}

const staticPages: SearchIndexItem[] = [
  { id: 0, title: "Home", subtitle: "About me & quick links", url: "/", type: "page" },
  { id: 1, title: "Projects", subtitle: "Things I've built", url: "/projects", type: "page" },
  { id: 2, title: "Life", subtitle: "Personal timeline", url: "/life", type: "page" },
  { id: 3, title: "Books", subtitle: "Book catalog & reviews", url: "/books", type: "page" },
  { id: 4, title: "Writings", subtitle: "Microblog posts & TIL", url: "/writings", type: "page" },
  { id: 5, title: "Utils", subtitle: "Stacks & sites I use", url: "/utils", type: "page" },
];

const adminPages: SearchIndexItem[] = [
  {
    id: 100,
    title: "Admin / Dashboard",
    subtitle: "Content management overview",
    url: "/admin/dashboard",
    type: "page",
  },
  {
    id: 101,
    title: "Admin / Projects",
    subtitle: "Manage projects",
    url: "/admin/projects",
    type: "page",
  },
  {
    id: 102,
    title: "Admin / Life Events",
    subtitle: "Manage life events",
    url: "/admin/life-events",
    type: "page",
  },
  { id: 103, title: "Admin / Books", subtitle: "Manage books", url: "/admin/books", type: "page" },
  {
    id: 104,
    title: "Admin / Microblogs",
    subtitle: "Manage microblogs",
    url: "/admin/microblogs",
    type: "page",
  },
  {
    id: 105,
    title: "Admin / Stacks",
    subtitle: "Manage stacks",
    url: "/admin/stacks",
    type: "page",
  },
  { id: 106, title: "Admin / Sites", subtitle: "Manage sites", url: "/admin/sites", type: "page" },
  { id: 107, title: "Admin / TIL", subtitle: "Manage TILs", url: "/admin/tils", type: "page" },
  {
    id: 108,
    title: "Admin / Media",
    subtitle: "Manage movies & series",
    url: "/admin/media",
    type: "page",
  },
  {
    id: 109,
    title: "Admin / Gallery",
    subtitle: "Manage gallery images",
    url: "/admin/gallery",
    type: "page",
  },
];

export async function getSearchIndex() {
  const [
    allProjects,
    allBooks,
    allMicroblogs,
    allLifeEvents,
    allStacks,
    allTils,
    allMedia,
    allGallery,
    session,
  ] = await Promise.all([
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
    db.select({ id: tils.id, title: tils.title }).from(tils).orderBy(desc(tils.sortOrder)),
    db
      .select({ id: media.id, title: media.title, year: media.year, type: media.type })
      .from(media)
      .orderBy(desc(media.sortOrder)),
    db
      .select({ id: gallery.id, title: gallery.title, takenAt: gallery.takenAt })
      .from(gallery)
      .orderBy(desc(gallery.sortOrder)),
    auth(),
  ]);

  const items: SearchIndexItem[] = [
    ...staticPages,
    ...(session?.user ? adminPages : []),
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
    ...allTils.map((t) => ({
      id: t.id,
      title: t.title,
      subtitle: "",
      url: "/writings",
      type: "til" as const,
    })),
    ...allMedia.map((m) => ({
      id: m.id,
      title: m.title,
      subtitle: `${m.type === "series" ? "Series" : "Movie"}${m.year ? ` · ${m.year}` : ""}`,
      url: "/utils?tab=media",
      type: "media" as const,
    })),
    ...allGallery.map((g) => ({
      id: g.id,
      title: g.title,
      subtitle: g.takenAt ? new Date(g.takenAt).getFullYear().toString() : "",
      url: "/life?tab=gallery",
      type: "page" as const,
    })),
  ];

  return items;
}
