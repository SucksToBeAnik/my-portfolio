"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Wrench } from "@phosphor-icons/react";
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
  description: string | null;
}

function SiteItem({ url, savedDescription }: { url: string; savedDescription?: string | null }) {
  const domain = getDomain(url);
  const [meta, setMeta] = useState<SiteMeta | null>(null);

  useEffect(() => {
    fetchMicrolink(url).then((data) => {
      if (data) {
        setMeta({ title: data.title, logo: data.logo, description: data.description });
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
        className="group flex items-center gap-2.5 w-full py-2.5 border-b border-hairline/50 cursor-pointer"
      >
        <span className="w-5 h-5 shrink-0 flex items-center justify-center">
          <img
            src={displayFavicon}
            alt=""
            className="w-full h-full object-contain rounded"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </span>
        <h3 className="text-sm font-heading truncate">{meta?.title || domain}</h3>

        <ArrowRight
          weight="thin"
          className="ml-auto w-3.5 h-3.5 text-muted shrink-0 transition -translate-x-1 group-hover:translate-x-0 group-hover:text-fg"
        />
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
        <Breadcrumb crumbs={[{ icon: <Wrench weight="thin" className="w-3.5 h-3.5" />, href: "/stacks" }, { label: "Sites I Find Useful" }]} />
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
                <SiteItem key={site.id} url={site.url} savedDescription={site.description} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
