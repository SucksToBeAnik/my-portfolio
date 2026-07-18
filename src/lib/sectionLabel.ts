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

/**
 * Friendly label for a pathname — used by the back button to name the page it
 * returns to. `/` becomes "Home"; a known section (or one of its detail pages)
 * maps to its section name; anything else falls back to "Back".
 */
export function labelForPath(path: string): string {
  const clean = path.split(/[?#]/)[0];
  if (!clean || clean === "/") return "Home";
  const seg = clean.split("/").filter(Boolean)[0];
  return (seg && SECTION_LABELS[seg]) ?? "Back";
}
