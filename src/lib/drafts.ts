import { z } from "zod";

/**
 * Draft payloads buffer the editable content of an already-published item while
 * the public page keeps rendering the last-published (live) columns. They are
 * stored as JSON in the `draft` column and applied to the live columns only
 * when the author explicitly publishes the changes.
 */

export const microblogDraftSchema = z.object({
  title: z.string(),
  content: z.string(),
  microview: z.string().nullable().optional(),
  tags: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
});
export type MicroblogDraft = z.infer<typeof microblogDraftSchema>;

export const projectDraftSchema = z.object({
  title: z.string(),
  content: z.string().nullable().optional(),
  microview: z.string().nullable().optional(),
  tags: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  githubUrl: z.string().nullable().optional(),
  workedOn: z.string().nullable().optional(),
  featured: z.boolean().optional(),
});
export type ProjectDraft = z.infer<typeof projectDraftSchema>;

/** Safely parse a stored draft column; returns null on absent or malformed JSON. */
export function parseDraft<T>(schema: z.ZodType<T>, raw: string | null | undefined): T | null {
  if (!raw) return null;
  try {
    return schema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}
