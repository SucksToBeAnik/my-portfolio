interface MicrolinkData {
  title: string | null;
  description: string | null;
  image: string | null;
  logo: string | null;
}

// Module-level — survives component remounts for the session lifetime
const cache = new Map<string, Promise<MicrolinkData | null>>();

export function fetchMicrolink(url: string): Promise<MicrolinkData | null> {
  if (cache.has(url)) return cache.get(url)!;

  const promise = fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`)
    .then((r) => r.json())
    .then((json) => {
      if (json.status !== "success") return null;
      return {
        title: json.data.title || null,
        description: json.data.description || null,
        image: json.data.image?.url || null,
        logo: json.data.logo?.url || null,
      };
    })
    .catch(() => null);

  cache.set(url, promise);
  return promise;
}
