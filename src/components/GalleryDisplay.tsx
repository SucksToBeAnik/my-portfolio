"use client";

import { useEffect, useRef, useState } from "react";
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

function Overlays({ item }: { item: GalleryItem }) {
  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
        <p className="text-[11px] font-heading uppercase tracking-wider text-white">
          {item.title}
          {year(item.takenAt) ? `, ${year(item.takenAt)}` : ""}
        </p>
      </div>
    </>
  );
}

function GalleryCard({ item, onClick }: { item: GalleryItem; onClick: () => void }) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  const ratio = item.width && item.height ? `${item.width} / ${item.height}` : "4 / 3";

  useEffect(() => {
    if (imgRef.current?.complete) {
      setLoaded(true);
    }
  }, []);

  return (
    <div
      className="break-inside-avoid group relative w-full cursor-pointer overflow-hidden mb-2"
      style={{ aspectRatio: ratio }}
      onClick={onClick}
    >
      {!loaded && <div className="absolute inset-0 bg-hover-bg animate-pulse" />}
      <img
        ref={imgRef}
        src={item.imageUrl}
        alt={item.title}
        loading="lazy"
        className={`absolute inset-0 w-full h-full object-cover ${loaded ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
      />
      <Overlays item={item} />
    </div>
  );
}

export function GalleryDisplay({ items }: { items: GalleryItem[] }) {
  const [viewer, setViewer] = useState<GalleryItem | null>(null);

  if (items.length === 0) {
    return <p className="text-xs text-muted">Nothing here yet.</p>;
  }

  return (
    <>
      <div className="columns-2 gap-2">
        {items.map((item) => (
          <GalleryCard
            key={item.id}
            item={item}
            onClick={() => setViewer(item)}
          />
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
