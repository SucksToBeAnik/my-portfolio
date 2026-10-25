import { z } from "zod";

/**
 * A source an article draws on, listed at the end of the post. Kept out of the
 * markdown body because `[^n]` footnotes already render as side-notes.
 */
export const sourceSchema = z.object({
  url: z.string().trim().url(),
  title: z.string().trim().min(1),
  publisher: z.string().trim().optional().nullable(),
  author: z.string().trim().optional().nullable(),
  year: z.string().trim().optional().nullable(),
  /** A short aside on why it's cited — rendered handwritten. */
  note: z.string().trim().max(160).optional().nullable(),
  /** Mirrored favicon, filled in when the URL is looked up. */
  icon: z.string().optional().nullable(),
});
export type Source = z.infer<typeof sourceSchema>;

export const sourcesSchema = z.array(sourceSchema).max(50);

/** "www.arxiv.org/abs/…" → "arxiv.org", for when a source has no publisher. */
export function sourceHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
