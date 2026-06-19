"use client";

import { House, PlayCircle, Star } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getMediaPublic } from "@/actions/media";
import { getSites } from "@/actions/sites";
import { getStacks } from "@/actions/stacks";
import { LinkPreview } from "@/components/LinkPreview";
import { Spinner } from "@/components/Spinner";

type Tab = "stacks" | "sites" | "media";

const groupLabels = [
  { label: "Today", days: 0 },
  { label: "This Week", days: 7 },
  { label: "This Month", days: 30 },
  { label: "Older", days: Infinity },
];

function siteGroup(createdAt: Date): number {
  const now = Date.now();
  const diff = now - new Date(createdAt).getTime();
  const days = diff / 86_400_000;
  if (days < 1) return 0;
  if (days < 7) return 1;
  if (days < 30) return 2;
  return 3;
}

export default function UtilsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("stacks");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("tab");
    if (t === "sites" || t === "stacks") setTab(t);
  }, []);

  function switchTab(t: Tab) {
    setTab(t);
    const params = new URLSearchParams(window.location.search);
    params.set("tab", t);
    router.replace(`/utils?${params.toString()}`, { scroll: false });
  }

  return (
    <>
      <div className="flex items-center justify-between mb-8 md:mb-16">
        <div className="flex items-center gap-1.5 text-xs font-heading text-muted">
          <House weight="thin" className="w-3.5 h-3.5" />
          <span className="text-fg/20">/</span>
          <span className="text-fg/60">utils</span>
        </div>
        <div className="flex gap-3 shrink-0">
          <button
            onClick={() => switchTab("stacks")}
            className={`pb-1 text-xs transition-all cursor-pointer border-b-2 ${
              tab === "stacks" ? "border-fg text-fg" : "border-transparent text-fg/50 hover:text-fg"
            }`}
          >
            Stacks
          </button>
          <button
            onClick={() => switchTab("sites")}
            className={`pb-1 text-xs transition-all cursor-pointer border-b-2 ${
              tab === "sites" ? "border-fg text-fg" : "border-transparent text-fg/50 hover:text-fg"
            }`}
          >
            Sites
          </button>
          <button
            onClick={() => switchTab("media")}
            className={`pb-1 text-xs transition-all cursor-pointer border-b-2 ${
              tab === "media" ? "border-fg text-fg" : "border-transparent text-fg/50 hover:text-fg"
            }`}
          >
            Media
          </button>
        </div>
      </div>

      {tab === "stacks" && <StacksContent />}
      {tab === "sites" && <SitesContent />}
      {tab === "media" && <MediaContent />}
    </>
  );
}

function StacksContent() {
  const { data: stacks = [], isLoading } = useQuery({
    queryKey: ["stacks-public"],
    queryFn: getStacks,
  });

  if (isLoading) return <Spinner />;

  if (stacks.length === 0) {
    return <p className="text-xs text-fg/50 text-center py-8">No stacks yet.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {stacks.map((stack) => (
        <a
          key={stack.id}
          href={stack.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-3 border border-hairline rounded-xl p-4 hover:bg-hover-bg transition-colors group"
        >
          {stack.imageUrl && (
            <div className="w-10 h-10 shrink-0 rounded-lg bg-hover-bg overflow-hidden flex items-center justify-center">
              <img
                src={stack.imageUrl}
                alt={stack.name}
                loading="lazy"
                className="w-8 h-8 object-contain"
              />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium">{stack.name}</h3>
            {stack.platform && (
              <span className="inline-block mt-1 px-1.5 py-0.5 text-[10px] bg-hover-bg rounded text-fg/50">
                {stack.platform}
              </span>
            )}
            {stack.description && (
              <p className="text-xs text-fg/50 mt-1 leading-relaxed">{stack.description}</p>
            )}
          </div>
        </a>
      ))}
    </div>
  );
}

function getDomain(url: string): string {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

interface SiteMeta {
  title: string | null;
  logo: string | null;
}

function SiteItem({ url, tags, createdAt }: { url: string; tags: string | null; createdAt: Date }) {
  const domain = getDomain(url);
  const [meta, setMeta] = useState<SiteMeta | null>(null);
  const fetchedUrl = useRef("");

  useEffect(() => {
    if (fetchedUrl.current === url) return;
    fetchedUrl.current = url;
    setMeta(null);
    fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.status === "success") {
          setMeta({
            title: json.data.title || null,
            logo: json.data.logo?.url || null,
          });
        }
      })
      .catch(() => {});
  }, [url]);

  const fallbackFavicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  const displayFavicon = meta?.logo || fallbackFavicon;

  return (
    <LinkPreview url={url} className="w-full">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 px-4 py-3 w-full border border-hairline rounded-xl hover:bg-hover-bg transition-colors group cursor-pointer"
      >
        <img
          src={displayFavicon}
          alt=""
          className="w-5 h-5 rounded shrink-0"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm truncate">{meta?.title || domain}</p>
          {tags && (
            <div className="flex flex-wrap gap-1 mt-1">
              {tags.split(",").map((tag) => (
                <span
                  key={tag.trim()}
                  className="px-1.5 py-0.5 text-[10px] bg-hover-bg rounded text-fg/50"
                >
                  {tag.trim()}
                </span>
              ))}
            </div>
          )}
        </div>
      </a>
    </LinkPreview>
  );
}

function SitesContent() {
  const { data: sites = [], isLoading } = useQuery({
    queryKey: ["sites-public"],
    queryFn: getSites,
  });

  if (isLoading) return <Spinner />;

  if (sites.length === 0) {
    return <p className="text-xs text-fg/50 text-center py-8">No sites yet.</p>;
  }

  const grouped: { label: string; items: typeof sites }[] = [];

  for (const site of sites) {
    const g = siteGroup(new Date(site.createdAt));
    if (!grouped[g]) grouped[g] = { label: groupLabels[g].label, items: [] };
    grouped[g].items.push(site);
  }

  return (
    <div className="space-y-6">
      {grouped.map((group) => (
        <div key={group.label}>
          <p className="text-[11px] text-fg/30 font-heading mb-2">{group.label}</p>
          <div className="space-y-1">
            {group.items.map((site) => (
              <SiteItem key={site.id} url={site.url} tags={site.tags} createdAt={site.createdAt} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const statusLabels: Record<string, string> = {
  watching: "Watching",
  watched: "Watched",
  planned: "Plan to Watch",
  dropped: "Dropped",
};

function MediaContent() {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["media-public"],
    queryFn: getMediaPublic,
  });

  if (isLoading) return <Spinner />;

  if (items.length === 0) {
    return <p className="text-xs text-fg/50 text-center py-8">No entries yet.</p>;
  }

  const grouped: { label: string; items: typeof items }[] = [];
  const statusOrder = ["watching", "watched", "planned", "dropped"];
  for (const s of statusOrder) {
    const g = items.filter((i) => i.status === s);
    if (g.length > 0) grouped.push({ label: statusLabels[s], items: g });
  }

  return (
    <div className="space-y-8">
      {grouped.map((group) => (
        <div key={group.label}>
          <p className="text-[11px] font-heading mb-3">{group.label}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {group.items.map((item) => (
              <div
                key={item.id}
                className="group relative flex flex-col border border-hairline rounded-xl overflow-hidden hover:bg-hover-bg transition-colors"
              >
                <div className="aspect-[2/3] bg-hover-bg overflow-hidden">
                  {item.posterUrl ? (
                    <img
                      src={item.posterUrl}
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <PlayCircle weight="thin" className="w-8 h-8 text-fg/20" />
                    </div>
                  )}
                </div>
                <div className="p-2.5 space-y-1">
                  <p className="text-xs font-medium leading-tight line-clamp-2">{item.title}</p>
                  <div className="flex items-center justify-between text-[10px] text-fg/50">
                    <span>
                      {item.year && <span>{item.year}</span>}
                      {item.type === "series" && item.seasons && (
                        <span> · {item.seasons} seasons</span>
                      )}
                    </span>
                    {item.rating ? (
                      <span className="inline-flex gap-0.5 shrink-0">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            weight="fill"
                            className={`w-2.5 h-2.5 ${(item.rating ?? 0) >= n ? "text-fg" : "text-fg/30"}`}
                          />
                        ))}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
