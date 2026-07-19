export type TocHeading = { id: string; text: string; level: number };

/** GitHub-ish slug: lowercase, strip punctuation, spaces to hyphens. */
export function slugifyBase(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Assigns unique slugs in document order, appending `-1`, `-2`… on collisions.
 * The reader ({@link PostPreview}) and the TOC extractor both walk headings in
 * the same order with a fresh Slugger, so the ids they produce line up.
 */
export class Slugger {
  private seen = new Map<string, number>();

  slug(text: string): string {
    const base = slugifyBase(text) || "section";
    const count = this.seen.get(base) ?? 0;
    this.seen.set(base, count + 1);
    return count === 0 ? base : `${base}-${count}`;
  }
}

/** Strip the inline markdown that would clutter a TOC label. */
function cleanLabel(text: string): string {
  return text
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .trim();
}

/**
 * Pull ATX headings (`## Title`) out of raw markdown, skipping anything inside
 * fenced code blocks. Order and slugging match {@link PostPreview}'s rendered
 * heading ids so TOC links resolve.
 */
export function extractHeadings(markdown: string, maxLevel = 3): TocHeading[] {
  const slugger = new Slugger();
  const headings: TocHeading[] = [];
  let inFence = false;
  let fenceChar = "";

  for (const line of markdown.split("\n")) {
    const fence = line.match(/^\s*(```+|~~~+)/);
    if (fence) {
      const char = fence[1][0];
      if (!inFence) {
        inFence = true;
        fenceChar = char;
      } else if (char === fenceChar) {
        inFence = false;
      }
      continue;
    }
    if (inFence) continue;

    const m = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (!m) continue;
    const level = m[1].length;
    if (level > maxLevel) continue;
    // Slug from the cleaned label so ids match the reader, which slugs the
    // heading's parsed text content (no markdown syntax, links reduced to text).
    const label = cleanLabel(m[2].trim());
    headings.push({ id: slugger.slug(label), text: label, level });
  }

  return headings;
}
