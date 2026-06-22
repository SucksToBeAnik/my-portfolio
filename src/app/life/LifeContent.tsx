"use client";

import { useEffect, useRef, useState } from "react";
import { Briefcase, GraduationCap, MapPin, PushPin, Star } from "@phosphor-icons/react/dist/ssr";
import { useSearchParams } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { GalleryDisplay } from "@/components/GalleryDisplay";
import { LifeImage } from "@/components/LifeImage";
import { LinkPreview } from "@/components/LinkPreview";

function formatDate(date: string) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function dateRange(start: string, end: string | null, current: boolean | null) {
  const s = formatDate(start);
  if (end) return `${s} - ${formatDate(end)}`;
  if (current) return `${s} - Present`;
  return s;
}

const typeIcons: Record<string, React.ReactNode> = {
  education: <GraduationCap weight="fill" className="w-4 h-4" />,
  work: <Briefcase weight="fill" className="w-4 h-4" />,
  travel: <MapPin weight="fill" className="w-4 h-4" />,
  milestone: <Star weight="fill" className="w-4 h-4" />,
};

interface LifeItem {
  id: number;
  title: string;
  startDate: string;
  endDate: string | null;
  description: string | null;
  imageUrl: string | null;
  url: string | null;
  type: string;
  current: boolean | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface GalleryItem {
  id: number;
  title: string;
  imageUrl: string;
  takenAt: string | null;
}

export function LifeContent({
  items,
  galleryItems,
}: {
  items: LifeItem[];
  galleryItems: GalleryItem[];
}) {
  const [tab, setTab] = useState<"timeline" | "gallery">("timeline");
  // Re-sync whenever Next.js performs a real router navigation to this page
  // (e.g. clicking Life in the nav from another page). Tab switches bypass
  // the router via replaceState so they won't trigger this effect.
  const searchParams = useSearchParams();
  const skipNextSync = useRef(false);
  useEffect(() => {
    if (skipNextSync.current) { skipNextSync.current = false; return; }
    setTab(new URLSearchParams(window.location.search).get("tab") === "gallery" ? "gallery" : "timeline");
  }, [searchParams]);

  // Keep browser back/forward in sync too
  useEffect(() => {
    function onPopState() {
      setTab(new URLSearchParams(window.location.search).get("tab") === "gallery" ? "gallery" : "timeline");
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  function switchTab(t: "timeline" | "gallery") {
    skipNextSync.current = true;
    setTab(t);
    window.history.replaceState(null, "", t === "gallery" ? "/life?tab=gallery" : "/life");
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-8 md:mb-16">
        <Breadcrumb crumbs={[{ label: "My Life" }]} />
        <div className="flex gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setTab("timeline")}
            className={`pb-1 text-xs font-heading uppercase tracking-wider transition-all cursor-pointer border-b-2 ${
              tab === "timeline"
                ? "border-fg text-fg"
                : "border-transparent text-fg/50 hover:text-fg"
            }`}
          >
            Timeline
          </button>
          <button
            type="button"
            onClick={() => setTab("gallery")}
            className={`pb-1 text-xs font-heading uppercase tracking-wider transition-all cursor-pointer border-b-2 ${
              tab === "gallery"
                ? "border-fg text-fg"
                : "border-transparent text-fg/50 hover:text-fg"
            }`}
          >
            Gallery
          </button>
        </div>
      </div>

      <div style={{ display: tab !== "timeline" ? "none" : "" }}>
            {items.length === 0 && <p className="text-sm text-muted">Nothing here yet.</p>}

            <div className="relative pl-8 space-y-10 before:absolute before:left-[15.5px] before:top-0 before:bottom-2 before:w-px before:bg-hairline">
              {items.map((event) => (
                <article key={event.id} className="relative">
                  <span className="absolute left-[-24px] top-0 text-fg/70">
                    {typeIcons[event.type] || (
                      <span className="block w-2.5 h-2.5 rounded-full bg-fg" />
                    )}
                  </span>
                  <div className="grid grid-cols-[auto_1fr] gap-3 items-start">
                    {event.imageUrl ? (
                      <LifeImage src={event.imageUrl} alt={event.title} />
                    ) : (
                      <div className="w-16 h-16 shrink-0" />
                    )}
                    <div>
                      <p className="text-xs text-muted mb-0.5">
                        {dateRange(event.startDate, event.endDate, event.current)}
                      </p>
                      {event.location && (
                        <a
                          href={`https://www.google.com/maps?q=${encodeURIComponent(event.location)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-muted hover:text-fg transition-colors"
                        >
                          <PushPin weight="fill" className="w-3 h-3" />
                          {event.location}
                        </a>
                      )}
                      <h2 className="text-base font-heading leading-snug mb-2">
                        {event.url ? (
                          <LinkPreview url={event.url}>
                            <a
                              href={event.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline"
                            >
                              {event.title}
                            </a>
                          </LinkPreview>
                        ) : (
                          event.title
                        )}
                      </h2>
                      {event.description && (
                        <div
                          className="text-xs text-fg/80 prose-content"
                          dangerouslySetInnerHTML={{ __html: event.description }}
                        />
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

      <div style={{ display: tab !== "gallery" ? "none" : "" }}>
        <GalleryDisplay items={galleryItems} />
      </div>
    </div>
  );
}
