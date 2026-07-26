"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { books, sites, stacks } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { isCloudinary, mirrorToCloudinary } from "@/lib/cloudinary";
import { fetchPreviewImageMirrored, fetchSiteMetaMirrored } from "@/lib/microlink";

export interface RefreshReport {
  sites: number;
  stacks: number;
  books: number;
}

/**
 * Rows missing metadata used to be repaired inside the /sites and /stacks
 * renders — third-party lookups on the critical path of a cached page, retried
 * on every revalidation for any row whose lookup had failed. Those pages are
 * pure reads now; repair happens here, on demand, from the admin dashboard.
 *
 * Also mirrors any image still sitting on a third-party origin, which is what
 * the one-time migration needs and what a failed mirror on write falls back to.
 */
export async function refreshMetadata(): Promise<RefreshReport> {
  await requireAdmin();

  const report: RefreshReport = { sites: 0, stacks: 0, books: 0 };

  const siteRows = await db.select().from(sites);
  await inBatches(siteRows, async (row) => {
    // No title means the lookup never succeeded — redo the whole thing. If it
    // fails again the row keeps its mirrored favicon and stays queued.
    if (row.title === null) {
      const meta = await fetchSiteMetaMirrored(row.url, row.logo);
      if (meta.title === null && meta.logo === row.logo) return;
      await db.update(sites).set(meta).where(eq(sites.id, row.id));
      report.sites++;
      return;
    }

    const [logo, image] = await Promise.all([
      row.logo && !isCloudinary(row.logo) ? mirrorToCloudinary(row.logo) : null,
      row.image && !isCloudinary(row.image) ? mirrorToCloudinary(row.image) : null,
    ]);
    if (!logo && !image) return;

    await db
      .update(sites)
      .set({ ...(logo ? { logo } : {}), ...(image ? { image } : {}) })
      .where(eq(sites.id, row.id));
    report.sites++;
  });

  const stackRows = await db.select().from(stacks);
  await inBatches(stackRows, async (row) => {
    const patch: Partial<typeof row> = {};

    if (row.previewImage === null) {
      const preview = await fetchPreviewImageMirrored(row.url);
      if (preview !== null) patch.previewImage = preview;
    } else if (row.previewImage && !isCloudinary(row.previewImage)) {
      // og-image URLs rotate, so a stored one can 404. If the copy fails, ask
      // the page for its current og-image rather than retrying a dead URL.
      const mirrored =
        (await mirrorToCloudinary(row.previewImage)) ?? (await fetchPreviewImageMirrored(row.url));
      if (mirrored !== null) patch.previewImage = mirrored;
    }

    if (row.imageUrl && !isCloudinary(row.imageUrl)) {
      const mirrored = await mirrorToCloudinary(row.imageUrl);
      if (mirrored) patch.imageUrl = mirrored;
    }

    if (Object.keys(patch).length === 0) return;
    await db.update(stacks).set(patch).where(eq(stacks.id, row.id));
    report.stacks++;
  });

  const bookRows = await db.select({ id: books.id, coverUrl: books.coverUrl }).from(books);
  await inBatches(bookRows, async (row) => {
    if (!row.coverUrl || isCloudinary(row.coverUrl)) return;
    const mirrored = await mirrorToCloudinary(row.coverUrl);
    if (!mirrored) return;
    await db.update(books).set({ coverUrl: mirrored }).where(eq(books.id, row.id));
    report.books++;
  });

  if (report.sites) revalidatePath("/sites");
  if (report.stacks) revalidatePath("/stacks");
  if (report.books) {
    revalidatePath("/books");
    revalidatePath("/");
  }
  revalidatePath("/admin/dashboard");

  return report;
}

/** Bounded concurrency — these are third-party uploads, not our own DB. */
async function inBatches<T>(items: T[], fn: (item: T) => Promise<void>, size = 4) {
  for (let i = 0; i < items.length; i += size) {
    await Promise.all(items.slice(i, i + size).map(fn));
  }
}
