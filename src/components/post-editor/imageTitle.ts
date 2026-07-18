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

/**
 * Media nodes reuse the image node/markdown pipeline; a video is just an image
 * whose src points at a video file. Both the editor node view and the public
 * renderer branch on this to emit a `<video>` instead of an `<img>`.
 */
export function isVideoSrc(src: string | null | undefined): boolean {
  if (!src) return false;
  return /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i.test(src) || /\/video\/upload\//.test(src);
}

export function buildImageTitle(width: string, height: number | null): string {
  const tokens: string[] = [];
  if (width && width !== "normal") tokens.push(width);
  if (height) tokens.push(`h${Math.round(height)}`);
  return tokens.join(" ");
}
