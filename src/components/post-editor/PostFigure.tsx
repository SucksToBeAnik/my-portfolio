"use client";

import { useEffect, useRef, useState } from "react";
import { ImageViewer } from "@/components/ImageViewer";
import type { ImageFit, ImageWidth } from "@/components/post-editor/imageTitle";

/**
 * A post image rendered as a gallery print: a hairline mat frames it, it fades
 * up from grayscale to full colour the first time it scrolls into view, and it
 * opens in the lightbox on click. `interactive={false}` (editor preview)
 * disables the observer and the lightbox — the image simply appears.
 */
export function PostFigure({
  src,
  caption,
  width,
  height,
  fit = "cover",
  interactive = true,
}: {
  src: string;
  caption?: string;
  width: ImageWidth;
  height: number | null;
  fit?: ImageFit;
  interactive?: boolean;
}) {
  const figureRef = useRef<HTMLElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [revealed, setRevealed] = useState(!interactive);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const show = revealed && loaded;

  // A cached image can finish loading before React hydrates and attaches
  // `onLoad`, so the event never fires and the figure stays hidden (this is why
  // images vanished on a normal refresh but returned on a hard refresh). Catch
  // the already-complete case on mount.
  useEffect(() => {
    if (imgRef.current?.complete) setLoaded(true);
  }, []);

  useEffect(() => {
    if (!interactive) return;
    const el = figureRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setRevealed(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setRevealed(true);
            io.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [interactive]);

  const dataWidth = width !== "normal" ? width : undefined;
  // objectFit follows the fit hint so a height-cropped image in a spread can
  // still letterbox/stretch (inline style would beat the data-fit CSS).
  const imgStyle = height ? { height: `${height}px`, objectFit: fit } : undefined;

  const img = (
    <img
      ref={imgRef}
      src={src}
      alt={caption ?? ""}
      style={imgStyle}
      loading="lazy"
      onLoad={() => setLoaded(true)}
    />
  );

  return (
    <span
      ref={figureRef}
      className="post-figure"
      data-width={dataWidth}
      data-fit={fit !== "cover" ? fit : undefined}
      data-show={show ? "" : undefined}
      data-static={interactive ? undefined : ""}
    >
      {interactive ? (
        <button
          type="button"
          className="post-figure-media"
          onClick={() => setOpen(true)}
          aria-label={caption ? `View image: ${caption}` : "View image"}
        >
          {img}
        </button>
      ) : (
        <span className="post-figure-media">{img}</span>
      )}
      {caption ? <span className="post-caption">{caption}</span> : null}
      {open && <ImageViewer src={src} alt={caption ?? ""} onClose={() => setOpen(false)} />}
    </span>
  );
}
