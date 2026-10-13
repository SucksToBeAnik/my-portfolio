import { z } from "zod";

// One paper can live at several venues at once (a main-track paper that also ran
// at a workshop, a conference paper later extended into a journal, a preprint
// that's under review somewhere). Each appearance is its own entry with its own
// year, status and link.

export const VENUE_TYPES = ["journal", "conference", "workshop", "preprint"] as const;
export type VenueType = (typeof VENUE_TYPES)[number];

export const VENUE_STATUSES = ["published", "accepted", "under_review"] as const;
export type VenueStatus = (typeof VENUE_STATUSES)[number];

export const VENUE_TYPE_LABELS: Record<VenueType, string> = {
  journal: "Journal",
  conference: "Conference",
  workshop: "Workshop",
  preprint: "Preprint",
};

export const VENUE_STATUS_LABELS: Record<VenueStatus, string> = {
  published: "Published",
  accepted: "Accepted (to appear)",
  under_review: "Under review",
};

export const venueSchema = z.object({
  type: z.enum(VENUE_TYPES),
  status: z.enum(VENUE_STATUSES),
  // Short name as people cite it: "NeurIPS", "Nature Health", "arXiv".
  // Optional only so a double-blind submission can stay anonymous.
  name: z.string().trim().default(""),
  year: z.string().trim().default(""),
  track: z.string().trim().default(""),
  // Free-form distinction: "Spotlight", "Oral", "Best Paper".
  note: z.string().trim().default(""),
  url: z.string().trim().default(""),
});
export type Venue = z.infer<typeof venueSchema>;

export const LINK_KINDS = [
  "pdf",
  "arxiv",
  "openreview",
  "code",
  "data",
  "project",
  "poster",
  "slides",
  "video",
  "blog",
] as const;
export type LinkKind = (typeof LINK_KINDS)[number];

export const linkSchema = z.object({
  kind: z.enum(LINK_KINDS),
  url: z.string().trim().min(1),
});
export type PublicationLink = z.infer<typeof linkSchema>;

export const publicationInputSchema = z.object({
  title: z.string().trim().min(1),
  authors: z.string().trim().optional().nullable(),
  venues: z.array(venueSchema).default([]),
  links: z.array(linkSchema).default([]),
  url: z.string().trim().optional().nullable(),
  bibtex: z.string().trim().optional().nullable(),
  description: z.string().trim().optional().nullable(),
  publishedOn: z.string().optional().nullable(),
});
export type PublicationInput = z.input<typeof publicationInputSchema>;

// Venues shown strongest-first: published work, then accepted, then pending.
const STATUS_RANK: Record<VenueStatus, number> = { published: 0, accepted: 1, under_review: 2 };

export function sortVenues(venues: Venue[]): Venue[] {
  return [...venues].sort((a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status]);
}

/** "NeurIPS 2025", or "Under review" when the venue is anonymous. */
export function venueTitle(v: Venue): string {
  return [v.name, v.year].filter(Boolean).join(" ");
}

// ---- Authors ----------------------------------------------------------------

// Every spelling of my name that appears on a byline; matched loosely
// (case, dots and spacing ignored) so it gets highlighted automatically.
export const SELF_AUTHOR_NAMES = [
  "Al Jami Islam Anik",
  "Al Jami Anik",
  "A. J. I. Anik",
  "AJI Anik",
];

export interface Author {
  name: string;
  self: boolean;
  /** Footnote marks typed after the name: `*` equal contribution, `†` corresponding. */
  marks: string;
  /** A literal "..." in the list — the byline was deliberately shortened. */
  ellipsis: boolean;
}

const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/[.\-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
const selfNames = new Set(SELF_AUTHOR_NAMES.map(normalize));

/** Parses a comma-separated byline: `Jane Doe*, Al Jami Islam Anik*, ..., John Roe†`. */
export function parseAuthors(raw: string | null | undefined): Author[] {
  if (!raw) return [];
  return raw
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((part) => {
      if (/^(\.{3}|…)$/.test(part)) return { name: "…", self: false, marks: "", ellipsis: true };
      const match = part.match(/^(.*?)([*†‡]*)$/);
      const name = (match?.[1] ?? part).trim();
      return {
        name,
        self: selfNames.has(normalize(name)),
        marks: match?.[2] ?? "",
        ellipsis: false,
      };
    });
}

export function publicationYear(pub: { publishedOn: string | null; venues: Venue[] }): string {
  const fromDate = pub.publishedOn?.slice(0, 4);
  if (fromDate && /^\d{4}$/.test(fromDate)) return fromDate;
  return pub.venues.find((v) => v.year)?.year ?? "";
}
