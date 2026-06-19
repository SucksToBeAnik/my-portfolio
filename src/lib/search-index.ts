import { getSearchIndex, type SearchIndexItem } from "@/actions/search";

let cache: SearchIndexItem[] | null = null;
let lastFetched = 0;
const TTL = 60_000;

export function invalidateSearchCache() {
  cache = null;
  lastFetched = 0;
}

export async function getSearchItems(): Promise<SearchIndexItem[]> {
  const now = Date.now();
  if (cache && now - lastFetched < TTL) return cache;
  cache = await getSearchIndex();
  lastFetched = now;
  return cache;
}
