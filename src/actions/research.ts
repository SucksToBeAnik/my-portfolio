"use server";

import { asc, desc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { microblogs, projects, publications, researchInterests } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import {
  MAX_FEATURED_INTERESTS,
  type RelatedItem,
  type RelatedKind,
  type ResearchInterestInput,
  researchInterestInputSchema as schema,
} from "@/lib/research";
import { revalidateHome } from "@/lib/revalidate-home";

function revalidateResearch() {
  revalidatePath("/admin/research");
  revalidateHome();
}

export async function getResearchInterests() {
  return db.select().from(researchInterests).orderBy(asc(researchInterests.sortOrder));
}

/** Everything a research interest can point at, for the admin picker. */
export async function getRelatableContent() {
  await requireAdmin();
  const [pubs, posts, projs] = await Promise.all([
    db
      .select({ id: publications.id, title: publications.title })
      .from(publications)
      .orderBy(asc(publications.sortOrder)),
    db
      .select({ id: microblogs.id, title: microblogs.title })
      .from(microblogs)
      .where(eq(microblogs.published, true))
      .orderBy(desc(microblogs.publishedAt)),
    db
      .select({ id: projects.id, title: projects.title })
      .from(projects)
      .orderBy(asc(projects.sortOrder)),
  ]);
  return { publication: pubs, post: posts, project: projs } satisfies Record<
    RelatedKind,
    { id: number; title: string }[]
  >;
}

/**
 * Research interests with their related content resolved to titles and links.
 * References to deleted or unpublished content are dropped.
 */
export async function getResearchForHome() {
  const [interests, pubs, posts, projs] = await Promise.all([
    getResearchInterests(),
    db
      .select({ id: publications.id, title: publications.title, url: publications.url })
      .from(publications),
    db
      .select({ id: microblogs.id, title: microblogs.title })
      .from(microblogs)
      .where(eq(microblogs.published, true)),
    db
      .select({
        id: projects.id,
        title: projects.title,
        url: projects.url,
        published: projects.published,
      })
      .from(projects),
  ]);

  const resolve: Record<RelatedKind, (id: number) => RelatedItem | null> = {
    publication: (id) => {
      const p = pubs.find((x) => x.id === id);
      return p ? { kind: "publication", title: p.title, href: p.url, external: true } : null;
    },
    post: (id) => {
      const p = posts.find((x) => x.id === id);
      return p ? { kind: "post", title: p.title, href: `/posts/${p.id}`, external: false } : null;
    },
    project: (id) => {
      const p = projs.find((x) => x.id === id);
      if (!p) return null;
      // Same rule as SelectedProjects: deep-dive page if published, else the live site.
      return p.published
        ? { kind: "project", title: p.title, href: `/projects/${p.id}`, external: false }
        : { kind: "project", title: p.title, href: p.url, external: true };
    },
  };

  return interests.map((r) => ({
    id: r.id,
    title: r.title,
    question: r.question,
    keywords: r.keywords ?? [],
    summary: r.summary,
    featured: r.featured ?? false,
    related: (r.related ?? [])
      .map((ref) => resolve[ref.kind](ref.id))
      .filter((x): x is RelatedItem => x !== null),
  }));
}

export async function createResearchInterest(data: ResearchInterestInput) {
  await requireAdmin();
  const parsed = schema.parse(data);
  const maxOrder = await db
    .select({ max: sql<number>`max(${researchInterests.sortOrder})` })
    .from(researchInterests)
    .then((r) => r[0]?.max ?? -1);
  await db.insert(researchInterests).values({ ...parsed, sortOrder: maxOrder + 1 });
  revalidateResearch();
}

export async function updateResearchInterest(id: number, data: ResearchInterestInput) {
  await requireAdmin();
  const parsed = schema.parse(data);
  await db
    .update(researchInterests)
    .set({ ...parsed, updatedAt: new Date() })
    .where(eq(researchInterests.id, id));
  revalidateResearch();
}

export async function toggleResearchFeatured(id: number, featured: boolean) {
  await requireAdmin();

  // The homepage leads with a few interests, so featuring is capped.
  if (featured) {
    const count = await db
      .select({ n: sql<number>`count(*)` })
      .from(researchInterests)
      .where(eq(researchInterests.featured, true))
      .then((r) => r[0]?.n ?? 0);
    if (count >= MAX_FEATURED_INTERESTS) {
      throw new Error(`Only ${MAX_FEATURED_INTERESTS} interests can be featured at once.`);
    }
  }

  await db.update(researchInterests).set({ featured }).where(eq(researchInterests.id, id));
  revalidateResearch();
}

export async function deleteResearchInterest(id: number) {
  await requireAdmin();
  await db.delete(researchInterests).where(eq(researchInterests.id, id));
  revalidateResearch();
}

export async function reorderResearchInterests(items: { id: number; sortOrder: number }[]) {
  await requireAdmin();
  await Promise.all(
    items.map(({ id, sortOrder }) =>
      db.update(researchInterests).set({ sortOrder }).where(eq(researchInterests.id, id)),
    ),
  );
  revalidateResearch();
}
