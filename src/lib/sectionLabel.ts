const SECTION_LABELS: Record<string, string> = {
  projects: "Projects",
  posts: "Posts",
  til: "TIL",
  media: "What I Watch",
  books: "Books",
  life: "Life",
  tools: "Tools",
  ask: "Ask",
  search: "Search",
};

// Singular labels used when returning to a *detail* page (e.g. `/projects/123`),
// where the back button reads "Previous Project" rather than the section name.
const DETAIL_LABELS: Record<string, string> = {
  projects: "Previous Project",
  posts: "Previous Post",
};

/**
 * Friendly label for a pathname — used by the back button to name the page it
 * returns to. `/` becomes "Home"; a section detail page (`/projects/123`) maps
 * to "Previous Project"; a section index maps to its section name; anything
 * else falls back to "Back".
 */
export function labelForPath(path: string): string {
  const clean = path.split(/[?#]/)[0];
  if (!clean || clean === "/") return "Home";
  const segs = clean.split("/").filter(Boolean);
  const seg = segs[0];
  if (!seg) return "Back";
  // A detail page under a section (2+ segments) — name it as the sibling.
  if (segs.length > 1 && DETAIL_LABELS[seg]) return DETAIL_LABELS[seg];
  return SECTION_LABELS[seg] ?? "Back";
}
