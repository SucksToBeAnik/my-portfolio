import { desc, eq } from "drizzle-orm";
import { getShowcasedCv } from "@/actions/cvs";
import { db } from "@/db";
import {
  books,
  gallery,
  lifeEvents,
  media,
  microblogs,
  projects,
  publications,
  sites,
  stacks,
  tils,
} from "@/db/schema";

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
  ] = await Promise.all([
    db
      .select({
        title: projects.title,
        description: projects.microview,
        url: projects.url,
        workedOn: projects.workedOn,
      })
      .from(projects)
      .orderBy(projects.sortOrder),
    db
      .select({
        title: publications.title,
        description: publications.description,
        venue: publications.venue,
        url: publications.url,
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
      .select({ title: microblogs.title, publishedAt: microblogs.publishedAt })
      .from(microblogs)
      .where(eq(microblogs.published, true))
      .orderBy(desc(microblogs.publishedAt))
      .limit(5),
    db
      .select({
        title: lifeEvents.title,
        description: lifeEvents.description,
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
    getShowcasedCv(),
  ]);

  return {
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
  };
}

export type SiteContext = Awaited<ReturnType<typeof loadContext>>;
