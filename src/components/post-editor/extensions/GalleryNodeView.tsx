"use client";

import { ArrowsOutSimple, CornersOut, Crop, Images, Plus, X } from "@phosphor-icons/react";
import { NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ImageUpload } from "@/components/ImageUpload";
import { GALLERY_MAX, type GalleryImage } from "@/components/post-editor/extensions/ImageGallery";
import { isVideoSrc } from "@/components/post-editor/imageTitle";
import { uploadToCloudinary } from "@/lib/cloudinary";

const MIN_HEIGHT = 80;
const MAX_HEIGHT = 1000;

/**
 * Editor view for a diptych/triptych spread. Empty slots render as dashed
 * "add" tiles; clicking one opens the standard ImageUpload dialog (local file
 * or URL). Filled slots get a hover × to remove, dropping image files onto
 * the spread fills the free slots, and captions live under each image
 * (stored in the image's `alt`, shown as figure captions on the public page).
 */
export function GalleryNodeView({
  node,
  updateAttributes,
  selected,
  editor,
  getPos,
}: ReactNodeViewProps) {
  const images = (node.attrs.images ?? []) as GalleryImage[];
  const width = String(node.attrs.width ?? "normal");
  const height: number | null = node.attrs.height ?? null;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [captionFocused, setCaptionFocused] = useState(false);

  // Index of the plate being dragged for an in-spread reorder; dropping it on
  // another plate swaps the two (the extension's stopEvent keeps ProseMirror
  // from turning a plate drag into a whole-node drag).
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const swap = (a: number, b: number) => {
    const next = [...images];
    [next[a], next[b]] = [next[b], next[a]];
    updateAttributes({ images: next });
  };

  // Row-level height crop, dragged like a single image's resize handle. All
  // plates share the one height so the spread stays aligned. The live value
  // is mirrored in a ref so the commit on pointerup/cancel never reads a
  // stale render closure.
  const [liveHeight, setLiveHeight] = useState<number | null>(null);
  const liveRef = useRef<number | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ y: number; h: number } | null>(null);
  const effectiveHeight = liveHeight ?? height;
  const dragging = liveHeight !== null;
  const plateStyle = effectiveHeight ? { height: `${effectiveHeight}px` } : undefined;

  const setLive = (v: number | null) => {
    liveRef.current = v;
    setLiveHeight(v);
  };

  const onResizeDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startH =
      height ?? rowRef.current?.querySelector(":scope img, :scope video")?.clientHeight ?? 240;
    dragStart.current = { y: e.clientY, h: startH };
    setLive(startH);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onResizeMove = (e: React.PointerEvent) => {
    if (!dragStart.current) return;
    const dy = e.clientY - dragStart.current.y;
    setLive(Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, dragStart.current.h + dy)));
  };

  const onResizeUp = (e: React.PointerEvent) => {
    if (!dragStart.current) return;
    dragStart.current = null;
    updateAttributes({ height: liveRef.current ? Math.round(liveRef.current) : null });
    setLive(null);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // capture may already be released
    }
  };

  const append = (added: GalleryImage[]) => {
    if (added.length === 0) return;
    updateAttributes({ images: [...images, ...added].slice(0, GALLERY_MAX) });
  };

  const openDialog = () => {
    setDialogOpen(true);
    dialogRef.current?.showModal();
  };

  const closeDialog = () => {
    dialogRef.current?.close();
    setDialogOpen(false);
  };

  const setAlt = (i: number, alt: string) =>
    updateAttributes({ images: images.map((img, idx) => (idx === i ? { ...img, alt } : img)) });

  // Cycle the plate fit so different crops can be compared in place:
  // crop (cover) → whole image (contain) → stretch (fill) → crop …
  const toggleFit = (i: number) =>
    updateAttributes({
      images: images.map((img, idx) =>
        idx === i
          ? {
              ...img,
              fit: img.fit === "contain" ? "fill" : img.fit === "fill" ? undefined : "contain",
            }
          : img,
      ),
    });

  const removeAt = (i: number) => {
    const next = images.filter((_, idx) => idx !== i);
    // Down to one image — collapse the spread back into a regular image node.
    // (Zero images just returns the spread to its empty-slots state.)
    if (next.length === 1) {
      const pos = getPos();
      if (typeof pos !== "number") return;
      editor
        .chain()
        .focus()
        .insertContentAt(
          { from: pos, to: pos + node.nodeSize },
          { type: "image", attrs: { src: next[0].src, alt: next[0].alt } },
        )
        .run();
      return;
    }
    updateAttributes({ images: next });
  };

  const uploadFiles = async (files: File[]) => {
    const picked = files
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, GALLERY_MAX - images.length);
    if (picked.length === 0) return;
    setBusy(true);
    const toastId = toast.loading(picked.length > 1 ? "Uploading images…" : "Uploading image…");
    try {
      const added = await Promise.all(
        picked.map(async (f) => ({ src: await uploadToCloudinary(f, "image"), alt: "" })),
      );
      append(added);
      toast.success(added.length > 1 ? "Images added" : "Image added", { id: toastId });
    } catch {
      toast.error("Upload failed", { id: toastId });
    } finally {
      setBusy(false);
    }
  };

  // An image already in the post, dragged onto the spread: move it into the
  // next free slot instead of letting ProseMirror re-insert it as a block
  // (the extension's stopEvent keeps ProseMirror's own drop handling away).
  const acceptDraggedImage = (): boolean => {
    const dragging = editor.view.dragging;
    if (!dragging || images.length >= GALLERY_MAX) return false;
    const dropped = dragging.slice.content.firstChild;
    if (dragging.slice.content.childCount !== 1 || dropped?.type.name !== "image") return false;
    const src = String(dropped.attrs.src ?? "");
    if (!src) return false;

    const pos = getPos();
    if (typeof pos !== "number") return false;
    const { tr, selection } = editor.state;
    // A moved node's source is the drag-start node selection — same cleanup
    // ProseMirror's own drop handling would do.
    const dragged =
      "node" in selection
        ? (selection as unknown as { node: { type: { name: string } } }).node
        : null;
    if (dragging.move && dragged?.type.name === "image") tr.deleteSelection();
    const mapped = tr.mapping.map(pos);
    const gallery = tr.doc.nodeAt(mapped);
    if (gallery?.type.name !== "imageGallery") return false;
    const galleryImages = (gallery.attrs.images ?? []) as GalleryImage[];
    tr.setNodeMarkup(mapped, undefined, {
      ...gallery.attrs,
      images: [...galleryImages, { src, alt: String(dropped.attrs.alt ?? "") }],
    });
    editor.view.dispatch(tr);
    editor.view.dragging = null;
    return true;
  };

  // Dashed placeholders up to the diptych minimum, so a fresh spread shows
  // two inviting slots instead of nothing.
  const placeholders = Math.max(0, 2 - images.length);
  const showCaptions =
    images.length > 0 && (selected || captionFocused || images.some((img) => img.alt.length > 0));

  return (
    <NodeViewWrapper
      className="post-gallery-nodeview"
      data-width={width !== "normal" ? width : undefined}
      data-selected={selected ? "" : undefined}
    >
      <div
        ref={rowRef}
        className="post-gallery-row"
        onDragOver={(e) => {
          if (images.length < GALLERY_MAX) e.preventDefault();
        }}
        onDrop={(e) => {
          if (acceptDraggedImage()) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }
          const files = Array.from(e.dataTransfer?.files ?? []);
          if (files.some((f) => f.type.startsWith("image/"))) {
            e.preventDefault();
            e.stopPropagation();
            uploadFiles(files);
          }
        }}
      >
        {images.map((img, i) => (
          <div key={`${img.src}-${i}`} className="post-gallery-item" contentEditable={false}>
            <div
              className="post-gallery-plate"
              draggable
              data-drag-source={dragIdx === i ? "" : undefined}
              onDragStart={(e) => {
                // A resize gesture must never turn into a native plate drag —
                // the drag would cancel the pointer stream mid-resize and the
                // new height would be lost.
                if (dragStart.current) {
                  e.preventDefault();
                  return;
                }
                e.stopPropagation();
                e.dataTransfer.effectAllowed = "move";
                // Firefox requires data for a drag to start.
                e.dataTransfer.setData("text/plain", "");
                setDragIdx(i);
              }}
              onDragEnd={() => setDragIdx(null)}
              onDragOver={(e) => {
                if (dragIdx !== null && dragIdx !== i) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
              onDrop={(e) => {
                if (dragIdx === null) return;
                e.preventDefault();
                e.stopPropagation();
                if (dragIdx !== i) swap(dragIdx, i);
                setDragIdx(null);
              }}
            >
              {isVideoSrc(img.src) ? (
                <video src={img.src} data-fit={img.fit} style={plateStyle} muted playsInline />
              ) : (
                <img
                  src={img.src}
                  alt={img.alt}
                  data-fit={img.fit}
                  style={plateStyle}
                  draggable={false}
                />
              )}
              <button
                type="button"
                title="Remove image"
                className="post-gallery-remove"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => removeAt(i)}
              >
                <X weight="bold" className="h-3 w-3" />
              </button>
              <button
                type="button"
                title={
                  img.fit === "contain"
                    ? "Fit: whole image — click to stretch"
                    : img.fit === "fill"
                      ? "Fit: stretched — click to crop"
                      : "Fit: cropped — click to show whole image"
                }
                className="post-gallery-fit"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => toggleFit(i)}
              >
                {img.fit === "contain" ? (
                  <CornersOut weight="bold" className="h-3 w-3" />
                ) : img.fit === "fill" ? (
                  <ArrowsOutSimple weight="bold" className="h-3 w-3" />
                ) : (
                  <Crop weight="bold" className="h-3 w-3" />
                )}
              </button>
              {i === 0 && (
                <button
                  type="button"
                  draggable={false}
                  title="Drag to resize the row · double-click to reset"
                  className={`post-image-resize${selected || dragging ? " is-visible" : ""}`}
                  onPointerDown={onResizeDown}
                  onPointerMove={onResizeMove}
                  onPointerUp={onResizeUp}
                  onPointerCancel={onResizeUp}
                  onDragStart={(e) => e.preventDefault()}
                  onDoubleClick={() => updateAttributes({ height: null })}
                />
              )}
            </div>
            {showCaptions && (
              <input
                type="text"
                value={img.alt}
                placeholder="Caption…"
                onChange={(e) => setAlt(i, e.target.value)}
                onFocus={() => setCaptionFocused(true)}
                onBlur={() => setCaptionFocused(false)}
                onMouseDown={(e) => e.stopPropagation()}
                className="post-gallery-caption"
              />
            )}
          </div>
        ))}
        {Array.from({ length: placeholders }, (_, i) => (
          <button
            key={`slot-${i}`}
            type="button"
            className="post-gallery-slot"
            style={plateStyle}
            disabled={busy}
            contentEditable={false}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={openDialog}
          >
            <Images weight="thin" className="h-5 w-5" />
            <span>{busy ? "Uploading…" : "Add image"}</span>
          </button>
        ))}
        {placeholders === 0 && images.length < GALLERY_MAX && (
          <button
            type="button"
            title="Add a third image"
            className="post-gallery-add"
            disabled={busy}
            contentEditable={false}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={openDialog}
          >
            <Plus weight="thin" className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Same upload UI as the regular image dialog: local file or URL. */}
      <dialog
        ref={dialogRef}
        onClose={() => setDialogOpen(false)}
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        className="bg-transparent backdrop:bg-black/50"
        contentEditable={false}
      >
        <div className="w-80 rounded-xl border border-nav-border bg-bg p-4 shadow-2xl">
          <p className="mb-3 text-xs font-medium text-fg">Add image to spread</p>
          <ImageUpload
            key={dialogOpen ? "open" : "closed"}
            onChange={(url) => {
              append([{ src: url, alt: "" }]);
              closeDialog();
            }}
            onFilePending={async (file) => {
              if (!file) return;
              closeDialog();
              await uploadFiles([file]);
            }}
          />
          <button
            type="button"
            onClick={closeDialog}
            className="mt-3 text-xs text-fg/60 hover:text-fg transition-colors"
          >
            Cancel
          </button>
        </div>
      </dialog>
    </NodeViewWrapper>
  );
}
