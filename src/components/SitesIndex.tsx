"use client";

import { ArrowRight, Wrench } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useState } from "react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { FilterPopover } from "@/components/FilterPopover";
import { LinkPreview } from "@/components/LinkPreview";

export interface SiteEntry {
  id: number;
  url: string;
  tags: string | null;
  title: string | null;
  description: string | null;
  logo: string | null;
  image: string | null;
  /** Epoch ms — bucketed into GROUP_LABELS against the reader's clock. */
  createdAt: number;
}

export const GROUP_LABELS = ["Today", "This Week", "This Month", "Older"];

/** Keep in sync with PRELOAD_COUNT in src/app/sites/page.tsx. */
export const EAGER_COUNT = 12;

function siteGroup(createdAt: number, now: number): number {
  const days = (now - createdAt) / 86_400_000;
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

function siteTags(site: SiteEntry): string[] {
  return (site.tags ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function SiteItem({ site, eager }: { site: SiteEntry; eager: boolean }) {
  const domain = getDomain(site.url);
  const fallbackFavicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  const hasMeta = Boolean(site.title || site.description || site.image || site.logo);

  return (
    <LinkPreview
      url={site.url}
      className="w-full"
      preload={
        hasMeta
          ? {
              title: site.title,
              description: site.description,
              image: site.image,
              logo: site.logo,
            }
          : undefined
      }
    >
      <a
        href={site.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-2.5 w-full py-2.5 border-b border-hairline/50 cursor-pointer"
      >
        <span className="w-5 h-5 shrink-0 flex items-center justify-center">
          <img
            src={site.logo || fallbackFavicon}
            alt=""
            width={20}
            height={20}
            loading={eager ? "eager" : "lazy"}
            fetchPriority={eager ? "high" : undefined}
            className="w-full h-full object-contain rounded"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </span>
        <h3 className="text-sm font-semibold truncate">{site.title || domain}</h3>

        <ArrowRight
          weight="thin"
          className="ml-auto hidden sm:block w-3.5 h-3.5 text-muted shrink-0 opacity-0 -translate-x-1 transition group-hover:opacity-100 group-hover:translate-x-0"
        />
      </a>
    </LinkPreview>
  );
}

export function SitesIndex({ sites, renderedAt }: { sites: SiteEntry[]; renderedAt: number }) {
  const [activeTags, setActiveTags] = useState<string[]>([]);
  // The page is cached until an admin write, so "Today" baked into the HTML
  // would keep meaning the day of that write. Start from the server's clock so
  // hydration matches, then re-bucket against the reader's on mount.
  const [now, setNow] = useState(renderedAt);
  useEffect(() => setNow(Date.now()), []);

  const allTags = Array.from(new Set(sites.flatMap(siteTags))).sort();
  // Mirrors the set the server preloads, so those rows skip lazy-loading and
  // paint from the same request the document arrived on.
  const eagerIds = new Set(sites.slice(0, EAGER_COUNT).map((s) => s.id));

  const filtered =
    activeTags.length > 0
      ? sites.filter((s) => activeTags.some((t) => siteTags(s).includes(t)))
      : sites;

  const grouped = GROUP_LABELS.map((label, g) => ({
    label,
    items: filtered.filter((s) => siteGroup(s.createdAt, now) === g),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-8 md:mb-12">
        <Breadcrumb
          crumbs={[
            { icon: <Wrench weight="regular" className="w-4 h-4" />, href: "/stacks" },
            { label: "Sites I Find Useful" },
          ]}
        />
        <FilterPopover tags={allTags} active={activeTags} onChange={setActiveTags} />
      </div>

      {sites.length === 0 && <p className="text-sm text-muted">Nothing here yet.</p>}

      <div className="space-y-8">
        {grouped.map((group) => (
          <section key={group.label} className="space-y-1">
            <h2 className="text-[11px] font-heading text-muted uppercase tracking-wider mb-2">
              {group.label}
            </h2>
            <div>
              {group.items.map((site) => (
                <SiteItem key={site.id} site={site} eager={eagerIds.has(site.id)} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
