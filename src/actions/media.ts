"use server";

import { asc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { media } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { env } from "@/lib/env";

const mediaSchema = z.object({
  imdbId: z.string().optional().nullable(),
  title: z.string().min(1),
  year: z.string().optional().nullable(),
  type: z.enum(["movie", "series"]),
  posterUrl: z.string().optional().nullable(),
  imdbUrl: z.string().optional().nullable(),
  plot: z.string().optional().nullable(),
  review: z.string().max(500).optional().nullable(),
  rating: z.number().int().min(1).max(5).optional().nullable(),
  status: z.enum(["watching", "watched", "planned", "dropped"]),
  seasons: z.number().int().positive().optional().nullable(),
});

export async function getMedia() {
  return db.select().from(media).orderBy(asc(media.sortOrder));
}

export async function getMediaItem(id: number) {
  const rows = await db.select().from(media).where(eq(media.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getMediaPublic() {
  return db
    .select({
      id: media.id,
      imdbId: media.imdbId,
      title: media.title,
      year: media.year,
      type: media.type,
      posterUrl: media.posterUrl,
      imdbUrl: media.imdbUrl,
      plot: media.plot,
      review: media.review,
      rating: media.rating,
      status: media.status,
      seasons: media.seasons,
      sortOrder: media.sortOrder,
      createdAt: media.createdAt,
    })
    .from(media)
    .orderBy(asc(media.sortOrder));
}

export async function createMedia(data: z.infer<typeof mediaSchema>) {
  await requireAdmin();
  const parsed = mediaSchema.parse(data);
  const maxOrder = await db
    .select({ max: sql<number>`max(${media.sortOrder})` })
    .from(media)
    .then((r) => r[0]?.max ?? -1);

  await db.insert(media).values({ ...parsed, sortOrder: maxOrder + 1 });
  revalidatePath("/admin/media");
  revalidatePath("/media");
}

export async function updateMedia(id: number, data: z.infer<typeof mediaSchema>) {
  await requireAdmin();
  const parsed = mediaSchema.parse(data);
  await db.update(media).set(parsed).where(eq(media.id, id));
  revalidatePath("/admin/media");
  revalidatePath("/media");
}

export async function deleteMedia(id: number) {
  await requireAdmin();
  await db.delete(media).where(eq(media.id, id));
  revalidatePath("/admin/media");
  revalidatePath("/media");
}

export async function reorderMedia(items: { id: number; sortOrder: number }[]) {
  await requireAdmin();
  await Promise.all(
    items.map(({ id, sortOrder }) => db.update(media).set({ sortOrder }).where(eq(media.id, id))),
  );
  revalidatePath("/admin/media");
  revalidatePath("/media");
}

export async function lookupIMDb(imdbId: string) {
  await requireAdmin();
  if (!env.OMDB_API_KEY) return null;
  try {
    const res = await fetch(`https://www.omdbapi.com/?apikey=${env.OMDB_API_KEY}&i=${imdbId}`);
    const data = await res.json();
    if (data.Response === "False") return null;
    return {
      title: data.Title,
      year: data.Year?.split("–")[0]?.trim(),
      type: data.Type === "series" ? ("series" as const) : ("movie" as const),
      posterUrl: data.Poster && data.Poster !== "N/A" ? data.Poster : null,
      plot: data.Plot && data.Plot !== "N/A" ? data.Plot : null,
      seasons:
        data.Type === "series" && data.totalSeasons && data.totalSeasons !== "N/A"
          ? Number.parseInt(data.totalSeasons, 10)
          : null,
      imdbId,
      imdbUrl: `https://www.imdb.com/title/${imdbId}/`,
    };
  } catch {
    return null;
  }
}

export async function searchIMDb(query: string) {
  await requireAdmin();
  if (!env.OMDB_API_KEY || !query.trim()) return [];
  try {
    const res = await fetch(
      `https://www.omdbapi.com/?apikey=${env.OMDB_API_KEY}&s=${encodeURIComponent(query)}`,
    );
    const data = await res.json();
    if (data.Response === "False" || !data.Search) return [];
    return (data.Search as any[]).map((item) => ({
      imdbId: item.imdbID as string,
      title: item.Title as string,
      year: item.Year as string,
      type: item.Type === "series" ? ("series" as const) : ("movie" as const),
      posterUrl: item.Poster && item.Poster !== "N/A" ? (item.Poster as string) : null,
    }));
  } catch {
    return [];
  }
}

export async function extractImdbId(input: string): Promise<string | null> {
  const trimmed = input.trim();
  const urlMatch = trimmed.match(/imdb\.com\/title\/(tt\d+)/i);
  if (urlMatch) return urlMatch[1];
  const idMatch = trimmed.match(/^tt\d+$/);
  if (idMatch) return idMatch[0];
  return null;
}
