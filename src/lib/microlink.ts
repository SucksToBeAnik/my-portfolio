import "server-only";

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
