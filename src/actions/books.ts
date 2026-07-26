"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { books } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { mirrorToCloudinary } from "@/lib/cloudinary";

const schema = z.object({
  title: z.string().min(1),
  author: z.string().min(1),
  coverUrl: z.string().optional().nullable(),
  rating: z.number().min(1).max(5).optional().nullable(),
  review: z.string().optional().nullable(),
  quote: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  status: z.enum(["reading", "read", "want_to_read"]),
  sortOrder: z.number().optional(),
});

// Books surface in four places: the admin list, /books, /books/[id], and the
// homepage explore tile (which shows the count and the first few covers).
// Every one of those is cached until a write, so all of them have to be named.
function revalidateBooks(id?: number) {
  revalidatePath("/admin/books");
  revalidatePath("/books");
  revalidatePath("/");
  if (id !== undefined) revalidatePath(`/books/${id}`);
}

/**
 * OpenLibrary's search returns `-M` covers (~180px). That's fine on the shelf
 * but soft in the 200×300 slot on /books/[id], and it's the size we'd freeze
 * on our own CDN — so take `-L` before mirroring.
 */
function upgradeCoverSource(url: string | null | undefined): string | null | undefined {
  if (!url?.includes("covers.openlibrary.org")) return url;
  return url.replace(/-[SM]\.jpg$/, "-L.jpg");
}

export async function getBooks() {
  return db.select().from(books).orderBy(books.sortOrder);
}

export async function createBook(data: z.infer<typeof schema>) {
  await requireAdmin();
  const parsed = schema.parse(data);
  const source = upgradeCoverSource(parsed.coverUrl);
  const coverUrl = (await mirrorToCloudinary(source)) ?? source;
  await db.insert(books).values({ ...parsed, coverUrl });
  revalidateBooks();
}

export async function updateBook(id: number, data: z.infer<typeof schema>) {
  await requireAdmin();
  const parsed = schema.parse(data);
  const source = upgradeCoverSource(parsed.coverUrl);
  const coverUrl = (await mirrorToCloudinary(source)) ?? source;
  await db
    .update(books)
    .set({ ...parsed, coverUrl, updatedAt: new Date() })
    .where(eq(books.id, id));
  revalidateBooks(id);
}

export async function deleteBook(id: number) {
  await requireAdmin();
  await db.delete(books).where(eq(books.id, id));
  revalidateBooks(id);
}

export async function reorderBooks(
  items: { id: number; sortOrder: number; status?: "reading" | "read" | "want_to_read" }[],
) {
  await requireAdmin();
  for (const item of items) {
    await db
      .update(books)
      .set({
        sortOrder: item.sortOrder,
        ...(item.status ? { status: item.status } : {}),
      })
      .where(eq(books.id, item.id));
  }
  revalidateBooks();
}

export async function searchBooks(query: string) {
  await requireAdmin();
  if (!query.trim()) return [];
  try {
    const res = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=8&fields=key,title,author_name,cover_i,first_publish_year`,
    );
    const data = await res.json();
    if (!data.docs) return [];
    return (data.docs as any[])
      .map((item) => ({
        id: item.key as string,
        title: item.title as string,
        authors: (item.author_name as string[] | undefined) ?? [],
        coverUrl: item.cover_i ? `https://covers.openlibrary.org/b/id/${item.cover_i}-M.jpg` : null,
        publishedDate: item.first_publish_year ? String(item.first_publish_year) : null,
      }))
      .filter((item) => item.title);
  } catch {
    return [];
  }
}
