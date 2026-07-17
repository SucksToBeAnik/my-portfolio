const BASE_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const DEFAULT_OG_IMAGE = `${BASE_URL}/profile.jpeg`;

export function siteUrl(path = ""): string {
  return `${BASE_URL}${path}`;
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

/** Reduce markdown (or leftover HTML) to plain text for excerpts and metadata. */
export function stripMarkdown(md: string): string {
  return md
    .replace(/<[^>]*>/g, " ") // any leftover HTML tags
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "") // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links -> text
    .replace(/`{1,3}([^`]*)`{1,3}/g, "$1") // code
    .replace(/^\s{0,3}#{1,6}\s+/gm, "") // headings
    .replace(/^\s{0,3}>\s?/gm, "") // blockquotes
    .replace(/^\s*[-*+]\s+/gm, "") // bullet markers
    .replace(/^\s*\d+\.\s+/gm, "") // ordered markers
    .replace(/^\s*([-*_]\s*){3,}$/gm, "") // horizontal rules
    .replace(/[*_~]{1,3}/g, "") // emphasis marks
    .replace(/\s+/g, " ")
    .trim();
}

/** Extract the first image URL from markdown (`![alt](url)`) or HTML (`<img src>`) content. */
export function firstImage(content?: string | null): string | null {
  if (!content) return null;
  const md = content.match(/!\[[^\]]*\]\(\s*([^)\s]+)/);
  if (md?.[1]) return md[1];
  const html = content.match(/<img[^>]*\ssrc=["']([^"']+)["']/i);
  if (html?.[1]) return html[1];
  return null;
}

export function truncate(str: string, max = 200): string {
  if (str.length <= max) return str;
  return `${str.slice(0, max).replace(/\s+\S*$/, "")}\u2026`;
}

export function ogImage(url?: string | null): string {
  return url || DEFAULT_OG_IMAGE;
}

export const defaultOpenGraph = {
  siteName: "Suckstobeanik",
  images: [{ url: DEFAULT_OG_IMAGE, width: 512, height: 512 }],
};

export const defaultTwitter = {
  card: "summary_large_image" as const,
};
