"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { FilterPopover } from "@/components/FilterPopover";
import { getSites, saveSiteDescription } from "@/actions/sites";
import { fetchMicrolink } from "@/lib/microlink-cache";
import { LinkPreview } from "@/components/LinkPreview";
import { Spinner } from "@/components/Spinner";

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

export default function SitesPage() {
  const { data: sites = [], isLoading } = useQuery({
    queryKey: ["sites-public"],
    queryFn: getSites,
  });
  const [activeTags, setActiveTags] = useState<string[]>([]);

  if (isLoading) return <Spinner />;

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
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-8 md:mb-16">
        <Breadcrumb crumbs={[{ label: "Sites I Find Useful" }]} />
        <FilterPopover tags={allTags} active={activeTags} onChange={setActiveTags} />
      </div>

      {sites.length === 0 && <p className="text-sm text-muted">Nothing here yet.</p>}

      <div className="space-y-6">
        {grouped.map((group) => (
          <div key={group.label} className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-heading uppercase tracking-widest text-fg/30 shrink-0">
                {group.label}
              </span>
            </div>
            <div className="space-y-1">
              {group.items.map((site) => (
                <SiteItem key={site.id} url={site.url} tags={site.tags} createdAt={site.createdAt} savedDescription={site.description} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
