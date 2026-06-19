import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { books, lifeEvents, media, microblogs, projects, stacks, tils } from "@/db/schema";

export async function loadContext() {
  const [
    allProjects,
    allBooks,
    recentTils,
    recentMedia,
    recentPosts,
    allLifeEvents,
    allStacks,
  ] = await Promise.all([
    db.select({ title: projects.title, description: projects.description, url: projects.url, workedOn: projects.workedOn }).from(projects).orderBy(projects.sortOrder),
    db.select({ title: books.title, author: books.author, status: books.status, rating: books.rating, category: books.category }).from(books).orderBy(books.sortOrder),
    db.select({ title: tils.title, content: tils.content, createdAt: tils.createdAt }).from(tils).orderBy(desc(tils.createdAt)).limit(15),
    db.select({ title: media.title, type: media.type, year: media.year, status: media.status, rating: media.rating, seasons: media.seasons }).from(media).orderBy(desc(media.updatedAt)).limit(20),
    db.select({ title: microblogs.title, publishedAt: microblogs.publishedAt }).from(microblogs).where(eq(microblogs.published, true)).orderBy(desc(microblogs.publishedAt)).limit(5),
    db.select({ title: lifeEvents.title, description: lifeEvents.description, startDate: lifeEvents.startDate, endDate: lifeEvents.endDate, type: lifeEvents.type, current: lifeEvents.current }).from(lifeEvents).orderBy(lifeEvents.sortOrder),
    db.select({ name: stacks.name, description: stacks.description, platform: stacks.platform }).from(stacks).orderBy(stacks.sortOrder),
  ]);

  return { allProjects, allBooks, recentTils, recentMedia, recentPosts, allLifeEvents, allStacks };
}

export type SiteContext = Awaited<ReturnType<typeof loadContext>>;
