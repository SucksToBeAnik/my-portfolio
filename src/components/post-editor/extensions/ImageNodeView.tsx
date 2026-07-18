"use client";

import { NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import { useRef, useState } from "react";
import { getYouTubeId, isVideoSrc } from "@/components/post-editor/imageTitle";

const MIN_HEIGHT = 80;
const MAX_HEIGHT = 1400;

/**
 * Renders an image with:
 *  - an optional, inline-editable caption (stored in `alt`)
 *  - a drag handle to crop the image height (stored in `height`)
 * Both round-trip through markdown via the title slot (see PostImage).
 */
export function ImageNodeView({ node, updateAttributes, selected }: ReactNodeViewProps) {
  const src = String(node.attrs.src ?? "");
  const alt = String(node.attrs.alt ?? "");
  const width = String(node.attrs.width ?? "normal");
  const height: number | null = node.attrs.height ?? null;
  const dataWidth = width !== "normal" ? width : undefined;

  const ytId = getYouTubeId(src);
  const isYouTube = !!ytId;
  const isVideo = !isYouTube && isVideoSrc(src);
  const [focused, setFocused] = useState(false);
  const [liveHeight, setLiveHeight] = useState<number | null>(null);

  const mediaRef = useRef<HTMLImageElement | HTMLVideoElement | null>(null);
  const dragStart = useRef<{ y: number; h: number } | null>(null);

  const effectiveHeight = liveHeight ?? height;
  const showCaption = selected || focused || alt.length > 0;
  const dragging = liveHeight !== null;

  const imgStyle = effectiveHeight
    ? { height: `${effectiveHeight}px`, width: "100%", objectFit: "cover" as const }
    : // Videos / YouTube thumbnails have a small intrinsic size, so stretch them
      // to the column width by default (plain images already fill via max-width).
      isYouTube || isVideo
      ? { width: "100%" as const }
      : undefined;

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startH = height ?? mediaRef.current?.clientHeight ?? 240;
    dragStart.current = { y: e.clientY, h: startH };
    setLiveHeight(startH);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragStart.current) return;
    const dy = e.clientY - dragStart.current.y;
    setLiveHeight(Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, dragStart.current.h + dy)));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragStart.current) return;
    dragStart.current = null;
    updateAttributes({ height: liveHeight ? Math.round(liveHeight) : null });
    setLiveHeight(null);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // capture may already be released
    }
  };

  return (
    <NodeViewWrapper className="post-image-nodeview" data-width={dataWidth}>
      <div className="post-image-frame">
        {isYouTube ? (
          <>
            <img
              ref={(el) => {
                mediaRef.current = el;
              }}
              src={`https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`}
              alt={alt}
              data-height={effectiveHeight ? String(Math.round(effectiveHeight)) : undefined}
              style={imgStyle}
              className={selected ? "ProseMirror-selectednode" : ""}
            />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-fg/90">
                <svg viewBox="0 0 24 24" className="ml-0.5 h-5 w-5 text-bg" fill="currentColor">
                  <title>Video</title>
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </>
        ) : isVideo ? (
          <video
            ref={(el) => {
              mediaRef.current = el;
            }}
            src={src}
            controls
            playsInline
            data-height={effectiveHeight ? String(Math.round(effectiveHeight)) : undefined}
            style={imgStyle}
            className={selected ? "ProseMirror-selectednode" : ""}
          />
        ) : (
          <img
            ref={(el) => {
              mediaRef.current = el;
            }}
            src={src}
            alt={alt}
            data-height={effectiveHeight ? String(Math.round(effectiveHeight)) : undefined}
            style={imgStyle}
            className={selected ? "ProseMirror-selectednode" : ""}
          />
        )}
        <button
          type="button"
          contentEditable={false}
          title="Drag to resize · double-click to reset"
          className={`post-image-resize${selected || dragging ? " is-visible" : ""}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onDoubleClick={() => updateAttributes({ height: null })}
        />
      </div>
      {showCaption && (
        <input
          type="text"
          value={alt}
          contentEditable={false}
          placeholder="Write a caption…"
          onChange={(e) => updateAttributes({ alt: e.target.value })}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onMouseDown={(e) => e.stopPropagation()}
          className="post-image-caption"
        />
      )}
    </NodeViewWrapper>
  );
}
