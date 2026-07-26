"use server";

import { asc, count, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { books, lifeEvents, media } from "@/db/schema";
import { EXPLORE_STACK_SIZE, type ExploreSection, type ExploreSectionKey } from "@/lib/explore";

/**
 * Counts + a few cover images for the homepage explore tiles (Life, Books,
 * Watch) — the sections that used to live in the nav. Only images the stack can
 * actually draw are fetched, so a null cover never takes one of its slots.
 */
export async function getExploreSections(): Promise<Record<ExploreSectionKey, ExploreSection>> {
  const [lifeTotal, lifeImages, booksTotal, bookCovers, mediaTotal, mediaPosters] =
    await Promise.all([
      db.select({ n: count() }).from(lifeEvents),
      db
        .select({ url: lifeEvents.imageUrl })
        .from(lifeEvents)
        .where(isNotNull(lifeEvents.imageUrl))
        .orderBy(asc(lifeEvents.sortOrder))
        .limit(EXPLORE_STACK_SIZE),
      db.select({ n: count() }).from(books),
      db
        .select({ url: books.coverUrl })
        .from(books)
        .where(isNotNull(books.coverUrl))
        .orderBy(asc(books.sortOrder))
        .limit(EXPLORE_STACK_SIZE),
      db.select({ n: count() }).from(media),
      db
        .select({ url: media.posterUrl })
        .from(media)
        .where(isNotNull(media.posterUrl))
        .orderBy(asc(media.sortOrder))
        .limit(EXPLORE_STACK_SIZE),
    ]);

  // `isNotNull` already guarantees these, but the column types stay nullable —
  // narrow rather than assert.
  const urls = (rows: { url: string | null }[]) =>
    rows.map((r) => r.url).filter((u): u is string => !!u);

  return {
    life: { total: lifeTotal[0]?.n ?? 0, images: urls(lifeImages) },
    books: { total: booksTotal[0]?.n ?? 0, images: urls(bookCovers) },
    media: { total: mediaTotal[0]?.n ?? 0, images: urls(mediaPosters) },
  };
}
