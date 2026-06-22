"use client";

interface GalleryItem {
  id: number;
  title: string;
  imageUrl: string;
  takenAt: string | null;
}

function year(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? "" : String(d.getFullYear());
}

export function GalleryDisplay({ items }: { items: GalleryItem[] }) {
  if (items.length === 0) {
    return <p className="text-xs text-muted">Nothing here yet.</p>;
  }

  return (
    <div className="columns-2 gap-2 space-y-2">
      {items.map((item) => (
        <div key={item.id} className="break-inside-avoid group relative">
          <img
            src={item.imageUrl}
            alt={item.title}
            loading="lazy"
            className="w-full h-auto object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <p className="text-[11px] font-heading uppercase tracking-wider text-white">
              {item.title}
              {year(item.takenAt) ? `, ${year(item.takenAt)}` : ""}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
