import "server-only";
import { mirrorToCloudinary } from "@/lib/cloudinary";

export interface SiteMeta {
  title: string | null;
  description: string | null;
  image: string | null;
  logo: string | null;
}

/**
 * Server-side Microlink lookup. Metadata is persisted on the sites table so
 * this runs once per site (on create, or as a one-time backfill) — never from
 * visitors' browsers, where it would burn Microlink's free-tier rate limit.
 */
export async function fetchSiteMeta(url: string): Promise<SiteMeta | null> {
  try {
    const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`, {
      signal: AbortSignal.timeout(8000),
    });
    const json = await res.json();
    if (json.status !== "success") return null;
    return {
      title: json.data.title || null,
      description: json.data.description || null,
      image: json.data.image?.url || null,
      logo: json.data.logo?.url || null,
    };
  } catch {
    return null;
  }
}

/** Google's favicon service — the last resort when a site exposes no logo. */
export function faviconUrl(url: string): string {
  let domain = url;
  try {
    domain = new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
  } catch {
    // keep the raw string; the favicon service will just miss
  }
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

/**
 * `fetchSiteMeta` + both images copied onto our Cloudinary, so a rendered page
 * touches exactly one image origin. Falls back to the favicon service when the
 * site has no logo, and to the original URL when a mirror upload fails.
 *
 * Never returns null: some sites fail the lookup every single time, and they
 * should still get a mirrored favicon rather than being retried forever with
 * nothing to show. A null `title` in the result is the "look this up again
 * later" marker. Pass `existingLogo` to avoid re-mirroring a favicon the row
 * already has.
 */
export async function fetchSiteMetaMirrored(
  url: string,
  existingLogo?: string | null,
): Promise<SiteMeta> {
  const meta = await fetchSiteMeta(url);

  if (!meta) {
    const fallback = faviconUrl(url);
    return {
      title: null,
      description: null,
      image: null,
      logo: existingLogo ?? (await mirrorToCloudinary(fallback)) ?? fallback,
    };
  }

  const logoSource = meta.logo ?? faviconUrl(url);
  const [logo, image] = await Promise.all([
    mirrorToCloudinary(logoSource),
    mirrorToCloudinary(meta.image),
  ]);

  return { ...meta, logo: logo ?? logoSource, image: image ?? meta.image };
}

/**
 * Just the og-image, mirrored — what /stacks needs for its hover preview.
 * `""` means the lookup succeeded and the site has no og image, so callers can
 * tell "nothing to find" apart from "not looked up yet" (null) and stop
 * refetching it forever.
 */
export async function fetchPreviewImageMirrored(url: string): Promise<string | null> {
  const meta = await fetchSiteMeta(url);
  if (!meta) return null;
  if (!meta.image) return "";
  return (await mirrorToCloudinary(meta.image)) ?? meta.image;
}
