import { z } from "zod";

// A research interest links back to existing content rather than copying it,
// so a renamed post or paper shows its current title here too.

export const RELATED_KINDS = ["publication", "post", "project"] as const;
export type RelatedKind = (typeof RELATED_KINDS)[number];

export const relatedRefSchema = z.object({
  kind: z.enum(RELATED_KINDS),
  id: z.number().int(),
});
export type RelatedRef = z.infer<typeof relatedRefSchema>;

export const researchInterestInputSchema = z.object({
  title: z.string().trim().min(1),
  summary: z.string().trim().default(""),
  related: z.array(relatedRefSchema).default([]),
});
export type ResearchInterestInput = z.input<typeof researchInterestInputSchema>;

export interface RelatedItem {
  kind: RelatedKind;
  title: string;
  href: string | null;
  external: boolean;
}

export const RELATED_KIND_LABELS: Record<RelatedKind, string> = {
  publication: "paper",
  post: "post",
  project: "project",
};
