"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { fetchMicrolink } from "@/lib/microlink-cache";

interface LinkPreviewProps {
  url: string;
  children: React.ReactNode;
  className?: string;
  position?: "right" | "bottom";
  /** Pre-fetched metadata; when set, no microlink request is made on hover. */
  preload?: Omit<PreviewData, "domain">;
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
}: LinkPreviewProps) {
  const [data, setData] = useState<PreviewData | null>(
    preload ? { ...preload, domain: getDomain(url) } : null,
  );
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState<React.CSSProperties>({});
  const fetchedRef = useRef(Boolean(preload));
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const popupRef = useRef<HTMLDivElement>(null);

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
    setVisible(false);
  }

  const popup = visible ? (
    <div
      ref={popupRef}
      style={{
        position: "fixed",
        transform: position === "bottom" ? "translateX(-50%)" : undefined,
        zIndex: 9999,
        ...pos,
      }}
      className="w-64 bg-bg border border-hairline rounded-xl shadow-2xl overflow-hidden pointer-events-none"
    >
      {data?.image && (
        <div className="relative w-full aspect-[16/10] bg-hover-bg">
          <Image src={data.image} alt="" fill className="object-cover" sizes="256px" />
        </div>
      )}
      <div className="px-3.5 py-3 space-y-1.5">
        <div className="flex items-center gap-2">
          {data?.logo && (
            <div className="w-4 h-4 shrink-0 rounded overflow-hidden bg-hover-bg">
              <Image src={data.logo} alt="" width={16} height={16} className="object-contain" />
            </div>
          )}
          <p className="text-[10px] text-fg/40 uppercase tracking-wider truncate">
            {data?.domain || getDomain(url)}
          </p>
        </div>
        {data?.title && (
          <p className="text-sm font-medium text-fg leading-snug line-clamp-2">{data.title}</p>
        )}
        {data?.description && (
          <p className="text-xs text-fg/50 leading-relaxed line-clamp-2">{data.description}</p>
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
