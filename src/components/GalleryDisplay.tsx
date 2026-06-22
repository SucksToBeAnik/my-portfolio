"use client";

import { useState } from "react";
import { ImageViewer } from "@/components/ImageViewer";

interface GalleryItem {
  id: number;
  title: string;
  imageUrl: string;
  width: number | null;
  height: number | null;
  takenAt: string | null;
}

function year(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? "" : String(d.getFullYear());
}

function aspectRatioStyle(w: number | null, h: number | null): React.CSSProperties {
  if (w && h) return { aspectRatio: `${w} / ${h}` };
  return { aspectRatio: "3 / 4" };
}

export function GalleryDisplay({ items }: { items: GalleryItem[] }) {
  const [viewer, setViewer] = useState<GalleryItem | null>(null);

  if (items.length === 0) {
    return <p className="text-xs text-muted">Nothing here yet.</p>;
  }

  return (
    <>
      <div className="columns-2 gap-2 space-y-2">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setViewer(item)}
            className="break-inside-avoid group relative w-full overflow-hidden cursor-pointer text-left"
            style={aspectRatioStyle(item.width, item.height)}
          >
            <div className="absolute inset-0 bg-hover-bg animate-pulse" />
            <img
              src={item.imageUrl}
              alt={item.title}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-300"
              onLoad={(e) => (e.currentTarget.style.opacity = "1")}
              onError={(e) => (e.currentTarget.style.opacity = "1")}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10" />
            <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <p className="text-[11px] font-heading uppercase tracking-wider text-white">
                {item.title}
                {year(item.takenAt) ? `, ${year(item.takenAt)}` : ""}
              </p>
            </div>
          </button>
        ))}
      </div>

      {viewer && (
        <ImageViewer
          src={viewer.imageUrl}
          alt={viewer.title}
          onClose={() => setViewer(null)}
        />
      )}
    </>
  );
}
