import { eq } from "drizzle-orm";
import type { MetadataRoute } from "next";
import { db } from "@/db";
import { books, media, microblogs, tils } from "@/db/schema";

const BASE_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [bookRows, microblogRows, tilRows, mediaRows] = await Promise.all([
    db.select({ id: books.id, updatedAt: books.updatedAt }).from(books),
    db
      .select({ id: microblogs.id, updatedAt: microblogs.updatedAt })
      .from(microblogs)
      .where(eq(microblogs.published, true)),
    db.select({ id: tils.id, updatedAt: tils.updatedAt }).from(tils),
    db.select({ id: media.id, updatedAt: media.updatedAt }).from(media),
  ]);

  const staticPages = [
    {
      url: `${BASE_URL}/`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 1,
    },
    {
      url: `${BASE_URL}/life`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/books`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/til`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/media`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/utils`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
  ];

  const bookPages = bookRows.map((b) => ({
    url: `${BASE_URL}/books/${b.id}`,
    lastModified: b.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const postPages = microblogRows.map((p) => ({
    url: `${BASE_URL}/posts/${p.id}`,
    lastModified: p.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const tilPages = tilRows.map((t) => ({
    url: `${BASE_URL}/til/${t.id}`,
    lastModified: t.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const mediaPages = mediaRows.map((m) => ({
    url: `${BASE_URL}/utils/media/${m.id}`,
    lastModified: m.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  return [...staticPages, ...bookPages, ...postPages, ...tilPages, ...mediaPages];
}
