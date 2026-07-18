"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ImageWidth } from "@/components/post-editor/imageTitle";

/** Clips at or under this length auto-play muted on loop, like a moving still. */
const AMBIENT_MAX_SECONDS = 12;

/**
 * A post video that mirrors PostFigure: hairline mat, grayscale→colour reveal on
 * scroll-in. Short clips become ambient loops (muted, looping, no chrome and
 * paused while off-screen); longer clips keep native controls.
 */
export function PostVideo({
  src,
  caption,
  width,
  height,
  interactive = true,
}: {
  src: string;
  caption?: string;
  width: ImageWidth;
  height: number | null;
  interactive?: boolean;
}) {
  const figureRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [revealed, setRevealed] = useState(!interactive);
  const [loaded, setLoaded] = useState(false);
  const [ambient, setAmbient] = useState(false);
  const show = revealed && loaded;

  const onMeta = useCallback(
    (e: React.SyntheticEvent<HTMLVideoElement>) => {
      const { duration } = e.currentTarget;
      if (interactive && Number.isFinite(duration) && duration <= AMBIENT_MAX_SECONDS) {
        setAmbient(true);
      }
      setLoaded(true);
    },
    [interactive],
  );

  // Metadata for a cached video can arrive before hydration attaches
  // `onLoadedMetadata`, leaving the figure hidden on a normal refresh. Catch
  // the already-loaded case on mount (mirrors onMeta).
  useEffect(() => {
    const v = videoRef.current;
    if (v && v.readyState >= 1) {
      if (interactive && Number.isFinite(v.duration) && v.duration <= AMBIENT_MAX_SECONDS) {
        setAmbient(true);
      }
      setLoaded(true);
    }
  }, [interactive]);

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
          if (entry.isIntersecting) setRevealed(true);
          // Ambient clips only play while visible.
          if (!ambient) continue;
          const video = videoRef.current;
          if (!video) continue;
          if (entry.isIntersecting) video.play().catch(() => {});
          else video.pause();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [interactive, ambient]);

  const dataWidth = width !== "normal" ? width : undefined;
  const videoStyle = height ? { height: `${height}px`, objectFit: "cover" as const } : undefined;

  return (
    <span
      ref={figureRef}
      className="post-figure post-figure-video"
      data-width={dataWidth}
      data-show={show ? "" : undefined}
      data-static=""
    >
      <span className="post-figure-media">
        <video
          ref={videoRef}
          src={src}
          style={videoStyle}
          playsInline
          muted={ambient}
          loop={ambient}
          autoPlay={ambient}
          controls={!ambient}
          preload="metadata"
          onLoadedMetadata={onMeta}
        />
      </span>
      {caption ? <span className="post-caption">{caption}</span> : null}
    </span>
  );
}
