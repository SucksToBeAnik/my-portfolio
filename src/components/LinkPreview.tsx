"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cdnImage } from "@/lib/cloudinary";
import { fetchMicrolink } from "@/lib/microlink-cache";

const POPUP_IMAGE_WIDTH = 512;
const POPUP_LOGO_WIDTH = 32;
// Short enough that the popup still feels like it belongs to the cursor, long
// enough to read as a movement rather than a flash. The exit keeps the node
// mounted for the same span, so leaving fades instead of cutting.
const POPUP_TRANSITION_MS = 140;

interface LinkPreviewProps {
  url: string;
  children: React.ReactNode;
  className?: string;
  position?: "right" | "bottom";
  /** Pre-fetched metadata; when set, no microlink request is made on hover. */
  preload?: Omit<PreviewData, "domain">;
  /** Replaces the standard metadata card, for previews such as a PDF page. */
  previewContent?: React.ReactNode;
  /** Keeps an opened card in the DOM so embedded media is loaded only once. */
  persistPreview?: boolean;
  previewClassName?: string;
}

interface PreviewData {
  title: string | null;
  description: string | null;
  image: string | null;
  logo: string | null;
  domain: string;
}

function getDomain(u: string): string {
  try {
    return new URL(u.startsWith("http") ? u : `https://${u}`).hostname.replace("www.", "");
  } catch {
    return u;
  }
}

export function LinkPreview({
  url,
  children,
  className = "",
  position = "right",
  preload,
  previewContent,
  persistPreview = false,
  previewClassName = "w-64",
}: LinkPreviewProps) {
  const [data, setData] = useState<PreviewData | null>(
    preload ? { ...preload, domain: getDomain(url) } : null,
  );
  // `visible` mounts the popup; `shown` drives the transition. They're separate
  // so the closing frame can still be on screen while it animates out.
  const [visible, setVisible] = useState(false);
  const [shown, setShown] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  // og-image URLs rotate and go 404; drop the frame rather than show a broken
  // image on top of an otherwise fine preview.
  const [imageBroken, setImageBroken] = useState(false);
  const [pos, setPos] = useState<React.CSSProperties>({});
  const fetchedRef = useRef(Boolean(preload || previewContent));
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const unmountTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const popupRef = useRef<HTMLDivElement>(null);

  // One frame after mounting, flip to the open state so the browser has a
  // "from" to transition out of.
  useEffect(() => {
    if (!visible) return;
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, [visible]);

  useEffect(
    () => () => {
      clearTimeout(timerRef.current);
      clearTimeout(unmountTimerRef.current);
    },
    [],
  );

  // Runs before paint: measures the rendered popup and nudges it back inside
  // the viewport. Re-runs when data arrives, since the image changes its height.
  useLayoutEffect(() => {
    if (!visible || !popupRef.current) return;
    const margin = 12;
    const rect = popupRef.current.getBoundingClientRect();
    let dx = 0;
    let dy = 0;
    if (rect.bottom > window.innerHeight - margin) {
      dy = window.innerHeight - margin - rect.bottom;
    }
    if (rect.top + dy < margin) dy = margin - rect.top;
    if (rect.right > window.innerWidth - margin) {
      dx = window.innerWidth - margin - rect.right;
    }
    if (rect.left + dx < margin) dx = margin - rect.left;
    if (dx || dy) {
      setPos((p) => ({
        ...p,
        top: (p.top as number) + dy,
        left: (p.left as number) + dx,
      }));
    }
  }, [visible, data]);

  function handleMouseEnter(e: React.MouseEvent<HTMLSpanElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    // Coming back mid-exit: cancel the pending unmount and re-open the node
    // that's still on screen rather than starting over from nothing.
    clearTimeout(unmountTimerRef.current);
    if (visible) setShown(true);

    // Start the og-image before the 400 ms intent delay, so the popup paints
    // with its image instead of a blank box. Costs nothing for the visitor who
    // never pauses long enough to open it.
    if (data?.image) new Image().src = cdnImage(data.image, POPUP_IMAGE_WIDTH);

    timerRef.current = setTimeout(() => {
      if (position === "bottom") {
        setPos({ top: rect.bottom + 8, left: rect.left + rect.width / 2 });
      } else {
        const spaceRight = window.innerWidth - rect.right;
        if (spaceRight >= 300) {
          setPos({ top: rect.top - 8, left: rect.right + 12 });
        } else {
          setPos({ top: rect.top - 8, left: rect.left - 268 });
        }
      }
      setHasOpened(true);
      setVisible(true);

      if (!fetchedRef.current) {
        fetchedRef.current = true;
        fetchMicrolink(url).then((meta) => {
          if (meta) setData({ ...meta, domain: getDomain(url) });
        });
      }
    }, 400);
  }

  function handleMouseLeave() {
    clearTimeout(timerRef.current);
    setShown(false);
    unmountTimerRef.current = setTimeout(() => setVisible(false), POPUP_TRANSITION_MS);
  }

  // Two layers on purpose: the outer one is measured by the layout effect
  // above, so it has to stay free of the animation's scale/offset — otherwise
  // the viewport correction would be computed from a mid-transition box.
  const popup =
    visible || (persistPreview && hasOpened) ? (
      <div
        ref={popupRef}
        aria-hidden={!visible}
        style={{
          position: "fixed",
          transform: position === "bottom" ? "translateX(-50%)" : undefined,
          visibility: visible ? "visible" : "hidden",
          zIndex: 9999,
          ...pos,
        }}
        className={`${previewClassName} pointer-events-none`}
      >
        <div
          style={{
            opacity: shown ? 1 : 0,
            transform: shown ? "translateY(0) scale(1)" : "translateY(4px) scale(0.97)",
            transformOrigin: position === "bottom" ? "top center" : "left center",
            transition: `opacity ${POPUP_TRANSITION_MS}ms ease-out, transform ${POPUP_TRANSITION_MS}ms ease-out`,
          }}
          className="bg-bg border border-hairline rounded-[22px] shadow-2xl overflow-hidden"
        >
          {previewContent ?? (
            <>
              {data?.image && !imageBroken && (
                <div className="relative mx-3 mt-3 aspect-[16/10] overflow-hidden rounded-[16px] bg-hover-bg">
                  {/* Plain img, not next/image: the src is already width-capped on our
                    own CDN when it's a mirrored asset, and routing arbitrary hover
                    URLs through the optimizer would both miss the warm-up above and
                    spend transformations on images most visitors never see. */}
                  <img
                    src={cdnImage(data.image, POPUP_IMAGE_WIDTH)}
                    alt=""
                    onError={() => setImageBroken(true)}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </div>
              )}
              <div className="px-3 py-2.5 space-y-1">
                <div className="flex items-center gap-2">
                  {data?.logo && (
                    <div className="w-4 h-4 shrink-0 rounded overflow-hidden bg-hover-bg">
                      <img
                        src={cdnImage(data.logo, POPUP_LOGO_WIDTH)}
                        alt=""
                        width={16}
                        height={16}
                        className="object-contain"
                      />
                    </div>
                  )}
                  <p className="text-[10px] text-fg/40 uppercase tracking-wider truncate">
                    {data?.domain || getDomain(url)}
                  </p>
                </div>
                {data?.title && (
                  <p className="text-sm font-medium text-fg leading-snug line-clamp-2">
                    {data.title}
                  </p>
                )}
                {data?.description && (
                  <p className="text-xs text-fg/50 leading-relaxed line-clamp-2">
                    {data.description}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    ) : null;

  return (
    <span
      className={`relative inline-flex ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {typeof document !== "undefined" && popup ? createPortal(popup, document.body) : null}
    </span>
  );
}
