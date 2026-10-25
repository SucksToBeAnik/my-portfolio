"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { microblogs } from "@/db/schema";
import { auth, requireAdmin } from "@/lib/auth";
import { buttondownConfigured, sendBroadcast } from "@/lib/buttondown";
import { mirrorToCloudinary } from "@/lib/cloudinary";
import { type MicroblogDraft, microblogDraftSchema } from "@/lib/drafts";
import { faviconUrl, fetchSiteMeta } from "@/lib/microlink";
import { revalidateHome } from "@/lib/revalidate-home";
import { siteUrl, stripMarkdown, truncate } from "@/lib/seo";
import { sourceHost, sourcesSchema } from "@/lib/sources";

const schema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  microview: z.string().max(180).optional().nullable(),
  tags: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  sources: sourcesSchema.optional().nullable(),
  published: z.boolean().optional(),
  til: z.boolean().optional(),
  publishedAt: z.date().optional().nullable(),
});

export async function getMicroblogs() {
  return db.select().from(microblogs).orderBy(microblogs.sortOrder);
}

export async function getMicroblog(id: number) {
  return db
    .select()
    .from(microblogs)
    .where(eq(microblogs.id, id))
    .limit(1)
    .then((r) => r[0] ?? null);
}

export async function createMicroblog(data: z.infer<typeof schema>) {
  await requireAdmin();
  const parsed = schema.parse(data);
  const maxOrder = await db
    .select({ max: sql<number>`max(${microblogs.sortOrder})` })
    .from(microblogs)
    .then((r) => r[0]?.max ?? -1);

  const [row] = await db
    .insert(microblogs)
    .values({
      ...parsed,
      sortOrder: maxOrder + 1,
      publishedAt: parsed.published && !parsed.publishedAt ? new Date() : parsed.publishedAt,
    })
    .returning({ id: microblogs.id });
  revalidatePath("/admin/microblogs");
  revalidatePath("/posts");
  revalidateHome();
  return { id: row.id };
}

export async function updateMicroblog(id: number, data: z.infer<typeof schema>) {
  await requireAdmin();
  const parsed = schema.parse(data);
  // Preserve the original publish date across edits — only stamp it the first
  // time the post goes live, and clear it when unpublished.
  const existing = await db
    .select({ publishedAt: microblogs.publishedAt })
    .from(microblogs)
    .where(eq(microblogs.id, id))
    .then((r) => r[0]);
  await db
    .update(microblogs)
    .set({
      ...parsed,
      updatedAt: new Date(),
      publishedAt: parsed.published
        ? (parsed.publishedAt ?? existing?.publishedAt ?? new Date())
        : null,
      // A live write applies (and therefore clears) any buffered draft.
      draft: null,
    })
    .where(eq(microblogs.id, id));
  revalidatePath("/admin/microblogs");
  revalidatePath("/posts");
  revalidatePath(`/posts/${id}`);
  revalidateHome();
}

/**
 * Buffer unpublished edits to a published post. Writes only the `draft` column
 * — the live columns the public reads stay frozen — so this deliberately does
 * NOT revalidate the public paths.
 */
export async function saveMicroblogDraft(id: number, data: MicroblogDraft) {
  await requireAdmin();
  const parsed = microblogDraftSchema.parse(data);
  await db
    .update(microblogs)
    .set({ draft: JSON.stringify(parsed), updatedAt: new Date() })
    .where(eq(microblogs.id, id));
  revalidatePath("/admin/microblogs");
}

/** Drop a buffered draft, reverting the post to its last-published state. */
export async function discardMicroblogDraft(id: number) {
  await requireAdmin();
  await db.update(microblogs).set({ draft: null }).where(eq(microblogs.id, id));
  revalidatePath("/admin/microblogs");
}

// Pages without a published date often report the time they were scraped, so a
// "date" from the last couple of days says nothing about the work itself.
function publishedYear(date: string | null | undefined): string | null {
  if (!date) return null;
  const t = Date.parse(date);
  if (Number.isNaN(t) || Date.now() - t < 2 * 24 * 60 * 60 * 1000) return null;
  return String(new Date(t).getUTCFullYear());
}

/**
 * Prefill a source from its URL: page title, site name, author, year and a
 * mirrored favicon. Every field is a best guess the author can overwrite.
 */
export async function lookupSource(url: string): Promise<{
  title: string | null;
  publisher: string;
  author: string | null;
  year: string | null;
  icon: string | null;
}> {
  await requireAdmin();
  const href = z.string().url().parse(url.trim());
  const [meta, icon] = await Promise.all([
    fetchSiteMeta(href),
    mirrorToCloudinary(faviconUrl(href)),
  ]);
  return {
    title: meta?.title ?? null,
    publisher: meta?.publisher ?? sourceHost(href),
    author: meta?.author ?? null,
    year: publishedYear(meta?.date),
    icon,
  };
}

export async function deleteMicroblog(id: number) {
  await requireAdmin();
  await db.delete(microblogs).where(eq(microblogs.id, id));
  revalidatePath("/admin/microblogs");
  revalidatePath("/posts");
  revalidatePath(`/posts/${id}`);
  revalidateHome();
}

/**
 * Send a Buttondown broadcast announcing a published post. Admin-only and
 * deliberately manual (not fired on publish) since emailing subscribers is an
 * irreversible, outward-facing action. Returns a status the UI can surface.
 */
export async function notifySubscribers(id: number): Promise<{
  ok: boolean;
  reason?: "unauthorized" | "not-published" | "not-configured" | "failed";
}> {
  const session = await auth();
  if (!session?.user) return { ok: false, reason: "unauthorized" };
  if (!buttondownConfigured()) return { ok: false, reason: "not-configured" };

  const post = await getMicroblog(id);
  if (!post?.published) return { ok: false, reason: "not-published" };

  const url = siteUrl(`/posts/${id}`);
  const teaser = post.microview?.trim() || truncate(stripMarkdown(post.content), 280);
  const body = `${teaser}\n\n[Read the full post →](${url})`;

  const sent = await sendBroadcast(post.title, body);
  return sent ? { ok: true } : { ok: false, reason: "failed" };
}

export async function reorderMicroblogs(items: { id: number; sortOrder: number }[]) {
  await requireAdmin();
  for (const item of items) {
    await db
      .update(microblogs)
      .set({ sortOrder: item.sortOrder })
      .where(eq(microblogs.id, item.id));
  }
  revalidatePath("/admin/microblogs");
  revalidatePath("/posts");
  revalidatePath("/posts/[id]", "page");
  revalidateHome();
}
