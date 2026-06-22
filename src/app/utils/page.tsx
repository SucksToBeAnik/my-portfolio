"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Suspense } from "react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { FilterPopover } from "@/components/FilterPopover";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getSites, saveSiteDescription } from "@/actions/sites";
import { getStacks } from "@/actions/stacks";
import { fetchMicrolink } from "@/lib/microlink-cache";
import { LinkPreview } from "@/components/LinkPreview";
import { Spinner } from "@/components/Spinner";

type Tab = "stacks" | "sites";

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
  return (
    <Suspense>
      <UtilsPageInner />
    </Suspense>
  );
}

function UtilsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const raw = searchParams.get("tab");
  const tab: Tab = raw === "sites" || raw === "stacks" ? raw : "stacks";

  function switchTab(t: Tab) {
    router.replace(`/utils?tab=${t}`, { scroll: false });
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-8 md:mb-16">
        <Breadcrumb crumbs={[{ label: "Stuff I Use" }]} />
        <div className="flex gap-3 shrink-0">
          <button
            onClick={() => switchTab("stacks")}
            className={`pb-1 text-xs font-heading uppercase tracking-wider transition-all cursor-pointer border-b-2 ${
              tab === "stacks" ? "border-fg text-fg" : "border-transparent text-fg/50 hover:text-fg"
            }`}
          >
            Stacks
          </button>
          <button
            onClick={() => switchTab("sites")}
            className={`pb-1 text-xs font-heading uppercase tracking-wider transition-all cursor-pointer border-b-2 ${
              tab === "sites" ? "border-fg text-fg" : "border-transparent text-fg/50 hover:text-fg"
            }`}
          >
            Sites
          </button>
        </div>
      </div>

      {tab === "stacks" && <StacksContent />}
      {tab === "sites" && <SitesContent />}
    </div>
  );
}

function StacksContent() {
  const { data: stacks = [], isLoading } = useQuery({
    queryKey: ["stacks-public"],
    queryFn: getStacks,
  });
  const [activePlatforms, setActivePlatforms] = useState<string[]>([]);

  if (isLoading) return <Spinner />;

  if (stacks.length === 0) {
    return <p className="text-xs text-fg/50 text-center py-8">No stacks yet.</p>;
  }

  const allPlatforms = Array.from(
    new Set(
      stacks.flatMap((s) =>
        (s.platform ?? "").split(",").map((p) => p.trim()).filter(Boolean)
      )
    )
  ).sort();

  const filtered =
    activePlatforms.length > 0
      ? stacks.filter((s) =>
          activePlatforms.some((p) =>
            (s.platform ?? "").split(",").map((x) => x.trim()).includes(p)
          )
        )
      : stacks;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-heading text-fg/30 uppercase tracking-wider">Stacks</p>
        <FilterPopover tags={allPlatforms} active={activePlatforms} onChange={setActivePlatforms} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {filtered.map((stack, i) => (
        <a
          key={`${activePlatforms.join(',')}-${stack.id}`}
          href={stack.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ animationDelay: `${i * 30}ms` }}
          className="flex items-start gap-3 border border-hairline rounded-xl p-4 hover:bg-hover-bg transition-colors group animate-fade-up"
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
              <div className="flex flex-wrap gap-1 mt-1">
                {stack.platform.split(",").map((p) => p.trim()).filter(Boolean).map((p) => (
                  <span key={p} className="px-1.5 py-0.5 text-[10px] bg-hover-bg rounded text-fg/50">{p}</span>
                ))}
              </div>
            )}
            {stack.description && (
              <p className="text-xs text-fg/50 mt-1 leading-relaxed">{stack.description}</p>
            )}
          </div>
        </a>
      ))}
      </div>
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

function SiteItem({ url, tags, createdAt, savedDescription }: { url: string; tags: string | null; createdAt: Date; savedDescription?: string | null }) {
  const domain = getDomain(url);
  const [meta, setMeta] = useState<SiteMeta | null>(null);

  useEffect(() => {
    fetchMicrolink(url).then((data) => {
      if (data) {
        setMeta({ title: data.title, logo: data.logo });
        if (data.description && !savedDescription) {
          saveSiteDescription(url, data.description).catch(() => {});
        }
      }
    });
  }, [url, savedDescription]);

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
  const [activeTags, setActiveTags] = useState<string[]>([]);

  if (isLoading) return <Spinner />;

  if (sites.length === 0) {
    return <p className="text-xs text-fg/50 text-center py-8">No sites yet.</p>;
  }

  const allTags = Array.from(
    new Set(
      sites.flatMap((s) =>
        (s.tags ?? "").split(",").map((t) => t.trim()).filter(Boolean)
      )
    )
  ).sort();

  const filtered =
    activeTags.length > 0
      ? sites.filter((s) =>
          activeTags.some((t) =>
            (s.tags ?? "").split(",").map((x) => x.trim()).includes(t)
          )
        )
      : sites;

  const grouped: { label: string; items: typeof sites }[] = [];
  for (const site of filtered) {
    const g = siteGroup(new Date(site.createdAt));
    if (!grouped[g]) grouped[g] = { label: groupLabels[g].label, items: [] };
    grouped[g].items.push(site);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-heading text-fg/30 uppercase tracking-wider">Sites</p>
        <FilterPopover tags={allTags} active={activeTags} onChange={setActiveTags} />
      </div>
      <div className="space-y-6">
        {grouped.map((group) => (
          <div key={group.label} className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-heading uppercase tracking-widest text-fg/30 shrink-0">
                {group.label}
              </span>
            </div>
            <div className="space-y-1">
              {group.items.map((site, i) => (
                <div
                  key={`${activeTags.join(',')}-${site.id}`}
                  style={{ animationDelay: `${i * 30}ms` }}
                  className="animate-fade-up"
                >
                  <SiteItem url={site.url} tags={site.tags} createdAt={site.createdAt} savedDescription={site.description} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

