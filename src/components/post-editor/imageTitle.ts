export type ImageWidth = "normal" | "wide" | "full";

/**
 * Image layout hints are packed into the markdown image title slot as
 * space-separated tokens, e.g. `![alt](src "wide h320")`:
 *   - `wide` | `full`  → width
 *   - `h<px>`          → cropped height
 */
export function parseImageTitle(title: string | null | undefined): {
  width: ImageWidth;
  height: number | null;
} {
  let width: ImageWidth = "normal";
  let height: number | null = null;
  for (const token of (title ?? "").split(/\s+/).filter(Boolean)) {
    if (token === "wide" || token === "full") width = token;
    else if (/^h\d+$/.test(token)) height = Number(token.slice(1));
  }
  return { width, height };
}

export function buildImageTitle(width: string, height: number | null): string {
  const tokens: string[] = [];
  if (width && width !== "normal") tokens.push(width);
  if (height) tokens.push(`h${Math.round(height)}`);
  return tokens.join(" ");
}
