"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { GalleryDisplay } from "@/components/GalleryDisplay";
import { type LifeEvent, Timeline } from "@/components/Timeline";

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
  items: LifeEvent[];
  galleryItems: GalleryItem[];
}) {
  const [tab, setTab] = useState<"timeline" | "gallery">("timeline");
  const searchParams = useSearchParams();

  // Re-sync on Next.js router navigations (e.g. clicking Life nav from another page).
  // Tab switches use window.history.replaceState which bypasses the router and never
  // changes searchParams, so this effect only fires on real navigations.
  useEffect(() => {
    setTab(
      new URLSearchParams(window.location.search).get("tab") === "gallery" ? "gallery" : "timeline",
    );
  }, [searchParams]);

  useEffect(() => {
    function onPopState() {
      setTab(
        new URLSearchParams(window.location.search).get("tab") === "gallery"
          ? "gallery"
          : "timeline",
      );
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  function switchTab(t: "timeline" | "gallery") {
    setTab(t);
    window.history.replaceState(null, "", t === "gallery" ? "/life?tab=gallery" : "/life");
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-8 md:mb-12">
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
        <Timeline items={items} />
      </div>

      <div style={{ display: tab !== "gallery" ? "none" : "" }}>
        <GalleryDisplay items={galleryItems} />
      </div>
    </div>
  );
}
