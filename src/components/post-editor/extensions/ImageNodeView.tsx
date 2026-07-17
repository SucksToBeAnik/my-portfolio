"use client";

import { NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import { useRef, useState } from "react";

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

  const [focused, setFocused] = useState(false);
  const [liveHeight, setLiveHeight] = useState<number | null>(null);

  const imgRef = useRef<HTMLImageElement>(null);
  const dragStart = useRef<{ y: number; h: number } | null>(null);

  const effectiveHeight = liveHeight ?? height;
  const showCaption = selected || focused || alt.length > 0;
  const dragging = liveHeight !== null;

  const imgStyle = effectiveHeight
    ? { height: `${effectiveHeight}px`, width: "100%", objectFit: "cover" as const }
    : undefined;

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startH = height ?? imgRef.current?.clientHeight ?? 240;
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
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          data-height={effectiveHeight ? String(Math.round(effectiveHeight)) : undefined}
          style={imgStyle}
          className={selected ? "ProseMirror-selectednode" : ""}
        />
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
