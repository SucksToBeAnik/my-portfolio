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
