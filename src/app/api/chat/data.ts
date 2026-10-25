import { desc, eq, inArray } from "drizzle-orm";
import { getShowcasedCv } from "@/actions/cvs";
import { getResearchForHome } from "@/actions/research";
import { getHomeSettings } from "@/actions/site-config";
import { db } from "@/db";
import {
  books,
  gallery,
  lifeEvents,
  media,
  microblogs,
  projects,
  publications,
  siteConfig,
  sites,
  stacks,
  tils,
} from "@/db/schema";
import { stripHtml } from "@/lib/seo";

export async function loadContext() {
  const [
    allProjects,
    allPublications,
    allBooks,
    recentTils,
    recentMedia,
    recentPosts,
    allLifeEvents,
    allStacks,
    allSites,
    allGallery,
    showcasedCv,
    researchInterests,
    homeSettings,
    workingOnRows,
  ] = await Promise.all([
    db
      .select({
        title: projects.title,
        description: projects.microview,
        tags: projects.tags,
        url: projects.url,
        githubUrl: projects.githubUrl,
        published: projects.published,
        id: projects.id,
        workedOn: projects.workedOn,
      })
      .from(projects)
      .orderBy(projects.sortOrder),
    db
      .select({
        title: publications.title,
        description: publications.description,
        authors: publications.authors,
        venues: publications.venues,
        url: publications.url,
        links: publications.links,
        publishedOn: publications.publishedOn,
      })
      .from(publications)
      .orderBy(publications.sortOrder),
    db
      .select({
        title: books.title,
        author: books.author,
        status: books.status,
        rating: books.rating,
        category: books.category,
      })
      .from(books)
      .orderBy(books.sortOrder),
    db
      .select({ title: tils.title, content: tils.content, createdAt: tils.createdAt })
      .from(tils)
      .orderBy(desc(tils.createdAt))
      .limit(15),
    db
      .select({
        title: media.title,
        type: media.type,
        year: media.year,
        status: media.status,
        rating: media.rating,
        seasons: media.seasons,
      })
      .from(media)
      .orderBy(desc(media.updatedAt))
      .limit(20),
    db
      .select({
        id: microblogs.id,
        title: microblogs.title,
        summary: microblogs.microview,
        tags: microblogs.tags,
        publishedAt: microblogs.publishedAt,
      })
      .from(microblogs)
      .where(eq(microblogs.published, true))
      .orderBy(desc(microblogs.publishedAt))
      .limit(10),
    db
      .select({
        title: lifeEvents.title,
        description: lifeEvents.description,
        // Job title for work, degree for education.
        role: lifeEvents.role,
        location: lifeEvents.location,
        url: lifeEvents.url,
        startDate: lifeEvents.startDate,
        endDate: lifeEvents.endDate,
        type: lifeEvents.type,
        current: lifeEvents.current,
      })
      .from(lifeEvents)
      .orderBy(lifeEvents.sortOrder),
    db
      .select({
        name: stacks.name,
        description: stacks.description,
        platform: stacks.platform,
        category: stacks.category,
      })
      .from(stacks)
      .orderBy(stacks.sortOrder),
    db
      .select({ url: sites.url, tags: sites.tags, description: sites.description })
      .from(sites)
      .orderBy(desc(sites.createdAt)),
    db
      .select({ title: gallery.title, takenAt: gallery.takenAt })
      .from(gallery)
      .orderBy(gallery.sortOrder),
    // The chat isn't mode-aware; it shares the CV of the default audience.
    getHomeSettings().then((s) => getShowcasedCv(s.defaultMode)),
    getResearchForHome().then((rows) =>
      rows.map((r) => ({
        title: r.title,
        question: r.question,
        keywords: r.keywords,
        summary: r.summary,
        related: r.related.map((x) => `${x.kind}: ${x.title}`),
      })),
    ),
    getHomeSettings(),
    db
      .select()
      .from(siteConfig)
      .where(inArray(siteConfig.key, ["working_on", "working_on_url"])),
  ]);

  const config = (key: string) => workingOnRows.find((r) => r.key === key)?.value.trim() || null;

  return {
    // Visitors know projects and posts by their pages on this site.
    allProjects: allProjects.map(({ id, published, ...p }) => ({
      ...p,
      page: published ? `/projects/${id}` : null,
    })),
    allPublications,
    allBooks,
    recentTils,
    recentMedia,
    recentPosts: recentPosts.map(({ id, ...p }) => ({ ...p, page: `/posts/${id}` })),
    // Descriptions are rich-text HTML; tags only cost tokens.
    allLifeEvents: allLifeEvents.map((e) => ({ ...e, description: stripHtml(e.description) })),
    allStacks,
    allSites,
    allGallery,
    showcasedCv,
    researchInterests,
    intros: homeSettings.intros,
    academicProfiles: homeSettings.profiles.map((p) => ({ name: p.label, url: p.url })),
    workingOn: config("working_on")
      ? { what: config("working_on"), url: config("working_on_url") }
      : null,
  };
}

export type SiteContext = Awaited<ReturnType<typeof loadContext>>;
