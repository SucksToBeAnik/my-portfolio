export type ImageWidth = "normal" | "wide" | "full";
export type ImageFit = "cover" | "contain" | "fill";

/**
 * Image layout hints are packed into the markdown image title slot as
 * space-separated tokens, e.g. `![alt](src "wide h320")`:
 *   - `wide` | `full`      → width
 *   - `h<px>`              → cropped height
 *   - `contain` | `fill`   → object-fit inside a spread (default is cover)
 */
export function parseImageTitle(title: string | null | undefined): {
  width: ImageWidth;
  height: number | null;
  fit: ImageFit;
} {
  let width: ImageWidth = "normal";
  let height: number | null = null;
  let fit: ImageFit = "cover";
  for (const token of (title ?? "").split(/\s+/).filter(Boolean)) {
    if (token === "wide" || token === "full") width = token;
    else if (token === "contain" || token === "fill") fit = token;
    else if (/^h\d+$/.test(token)) height = Number(token.slice(1));
  }
  return { width, height, fit };
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

/**
 * Inline media can also be an external embed. YouTube URLs (watch, short, or
 * embed form) are rendered as a lite player instead of an `<img>`/`<video>`.
 */
export function getYouTubeId(src: string | null | undefined): string | null {
  if (!src) return null;
  const m = src.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  return m?.[1] ?? null;
}

export function buildImageTitle(width: string, height: number | null, fit?: ImageFit): string {
  const tokens: string[] = [];
  if (width && width !== "normal") tokens.push(width);
  if (height) tokens.push(`h${Math.round(height)}`);
  if (fit && fit !== "cover") tokens.push(fit);
  return tokens.join(" ");
}
