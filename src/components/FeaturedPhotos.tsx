"use client";

import Link from "next/link";
import { useState } from "react";
import { ImageViewer } from "@/components/ImageViewer";
import { MAX_FEATURED_PHOTOS } from "@/lib/photos";

interface PhotoItem {
  id: number;
  title: string;
  imageUrl: string;
  takenAt: string | null;
}

/**
 * Hand-tuned pile. Positions are a fixed table rather than randomised so the
 * composition is identical on the server and the client (and stable across
 * revalidations) — and so the overlaps can actually be composed instead of
 * left to chance.
 *
 * What makes it read as one stack rather than a row of tilted photos:
 * heavy overlap (neighbours cover each other, they don't just touch corners),
 * a clear size hierarchy (`w` spans 28–36% so something is plainly on top),
 * a wide tilt range, and depth from `z` — which also drives shadow weight and
 * a slight dimming of the back layers.
 *
 * `left`/`top` are percentages of the band, `w` a percentage of its width.
 */
const SLOTS = [
  { left: 4, top: 2, w: 34, ar: "4 / 5", rot: -11, z: 1 },
  { left: 25, top: 0, w: 29, ar: "3 / 2", rot: 6, z: 2 },
  { left: 47, top: 4, w: 32, ar: "1 / 1", rot: -5, z: 3 },
  { left: 10, top: 48, w: 28, ar: "3 / 2", rot: 9, z: 4 },
  { left: 36, top: 36, w: 36, ar: "4 / 5", rot: -3, z: 6 },
  { left: 66, top: 30, w: 29, ar: "1 / 1", rot: 13, z: 5 },
];

/**
 * Which slots to use for a given photo count. Each subset is picked so its
 * members still overlap each other rather than scattering; the group is then
 * re-centred horizontally, so a short set reads as a smaller pile instead of a
 * pile shoved against the left edge.
 */
const PICKS: Record<number, number[]> = {
  1: [4],
  2: [1, 4],
  3: [1, 3, 4],
  4: [0, 1, 3, 4],
  5: [0, 1, 2, 3, 4],
  6: [0, 1, 2, 3, 4, 5],
};

/** Depth cues per layer: front photos sit brighter and cast more shadow. */
function depth(z: number) {
  if (z >= 5) return { shadow: "shadow-xl shadow-black/35", dim: 1 };
  if (z >= 3) return { shadow: "shadow-lg shadow-black/25", dim: 0.96 };
  return { shadow: "shadow-md shadow-black/15", dim: 0.9 };
}

function year(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? "" : String(d.getFullYear());
}

function caption(photo: PhotoItem): string {
  const y = year(photo.takenAt);
  return y ? `${photo.title}, ${y}` : photo.title;
}

// Shared frame styling. Positioning (`absolute` vs `relative`) is left to the
// caller so the two layouts don't fight over the same `position` utility.
const FRAME =
  "group overflow-hidden rounded-lg bg-hover-bg transition-[transform,box-shadow,filter] duration-300 ease-out cursor-zoom-in [filter:brightness(var(--dim))] hover:z-50 hover:[filter:brightness(1)] hover:shadow-2xl hover:shadow-black/45";

export function FeaturedPhotos({ photos }: { photos: PhotoItem[] }) {
  const [viewer, setViewer] = useState<PhotoItem | null>(null);

  if (photos.length === 0) return null;

  const shown = photos.slice(0, MAX_FEATURED_PHOTOS);
  const picks = PICKS[shown.length] ?? PICKS[MAX_FEATURED_PHOTOS];

  // Re-centre the picked group so short sets don't hug the left edge.
  const picked = picks.map((i) => SLOTS[i]);
  const minLeft = Math.min(...picked.map((s) => s.left));
  const maxRight = Math.max(...picked.map((s) => s.left + s.w));
  const shift = (100 - minLeft - maxRight) / 2;

  return (
    <section>
      {/* No section label — a pile of photographs says what it is. */}

      {/* Mobile: a tilted, overlapping swipe strip — the same pile language as
          the desktop layout, but touch-native. It runs to the screen edges to
          signal that it scrolls. The scroll container clips vertically, so the
          generous `py` is what keeps the tilt and shadows off its edges. */}
      <div className="no-scrollbar -mx-6 flex snap-x snap-mandatory items-center overflow-x-auto overscroll-x-contain px-6 py-10 lg:hidden">
        {shown.map((photo, i) => {
          const slot = SLOTS[i % SLOTS.length];
          const { shadow, dim } = depth(slot.z);
          return (
            <button
              key={photo.id}
              type="button"
              onClick={() => setViewer(photo)}
              aria-label={`View photo: ${photo.title}`}
              className={`${FRAME} ${shadow} relative shrink-0 snap-center ${i > 0 ? "-ml-8" : ""}`}
              style={
                {
                  aspectRatio: slot.ar,
                  height: i % 2 === 0 ? 195 : 150,
                  transform: `rotate(${slot.rot}deg) translateY(${i % 2 === 0 ? -10 : 12}px)`,
                  zIndex: slot.z,
                  "--dim": dim,
                } as React.CSSProperties
              }
            >
              <img
                src={photo.imageUrl}
                alt={photo.title}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </button>
          );
        })}
      </div>

      {/* Desktop: the pile. Stays inside the reading column — the tight width is
          what forces the overlap. The height gives the slots room to spread
          vertically and still clears the lowest one's tilt and shadow. */}
      <div className="relative hidden h-[520px] lg:block">
        {shown.map((photo, i) => {
          const slot = SLOTS[picks[i]];
          const { shadow, dim } = depth(slot.z);
          return (
            <button
              key={photo.id}
              type="button"
              onClick={() => setViewer(photo)}
              aria-label={`View photo: ${photo.title}`}
              // The rotation lives in a CSS var so hover/focus can straighten
              // and lift the photo out of the pile without any JS. The upward
              // translate is what matters for the photos further back — it
              // clears them of whatever is covering their lower half.
              className={`${FRAME} ${shadow} absolute [transform:rotate(var(--rot))] hover:[transform:translateY(-18px)_rotate(0deg)_scale(1.05)] focus-visible:z-50 focus-visible:outline-none focus-visible:[transform:translateY(-18px)_rotate(0deg)_scale(1.05)]`}
              style={
                {
                  left: `${slot.left + shift}%`,
                  top: `${slot.top}%`,
                  width: `${slot.w}%`,
                  aspectRatio: slot.ar,
                  zIndex: slot.z,
                  "--rot": `${slot.rot}deg`,
                  "--dim": dim,
                } as React.CSSProperties
              }
            >
              <img
                src={photo.imageUrl}
                alt={photo.title}
                loading="lazy"
                className="h-full w-full object-cover"
              />
              <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2.5 pt-8 text-left font-heading text-[10px] uppercase tracking-wider text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                {caption(photo)}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex justify-center lg:mt-2">
        <Link
          href="/photos"
          className="font-heading text-xs uppercase tracking-wider text-muted transition-colors hover:text-fg"
        >
          View all
        </Link>
      </div>

      {viewer && (
        <ImageViewer src={viewer.imageUrl} alt={viewer.title} onClose={() => setViewer(null)} />
      )}
    </section>
  );
}
