"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";

interface LinkPreviewProps {
  url: string;
  children: React.ReactNode;
}

interface PreviewData {
  title: string | null;
  description: string | null;
  image: string | null;
  domain: string;
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

export function LinkPreview({ url, children }: LinkPreviewProps) {
  const [data, setData] = useState<PreviewData | null>(null);
  const [style, setStyle] = useState<React.CSSProperties | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleMouseEnter = useCallback(() => {
    timerRef.current = setTimeout(async () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;
      const cardHeight = 200;

      if (spaceAbove >= cardHeight) {
        setStyle({
          position: "fixed",
          bottom: `${window.innerHeight - rect.top + 8}px`,
          left: `${rect.left + rect.width / 2}px`,
          transform: "translateX(-50%)",
        });
      } else if (spaceBelow >= cardHeight) {
        setStyle({
          position: "fixed",
          top: `${rect.bottom + 8}px`,
          left: `${rect.left + rect.width / 2}px`,
          transform: "translateX(-50%)",
        });
      } else {
        setStyle({
          position: "fixed",
          top: "8px",
          left: `${rect.left + rect.width / 2}px`,
          transform: "translateX(-50%)",
        });
      }

      if (!data) {
        try {
          const res = await fetch(
            `https://api.microlink.io/?url=${encodeURIComponent(url)}`
          );
          if (res.ok) {
            const json = await res.json();
            if (json.status === "success") {
              setData({
                title: json.data.title || null,
                description: json.data.description || null,
                image: json.data.image?.url || null,
                domain: getDomain(url),
              });
            }
          }
        } catch {
          // fail silently
        }
      }
    }, 400);
  }, [url, data]);

  const handleMouseLeave = useCallback(() => {
    clearTimeout(timerRef.current);
    setStyle(null);
  }, []);

  return (
    <span
      ref={triggerRef}
      className="relative inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {style && data && (
        <div
          style={style}
          className="w-56 bg-[#0d1117] border border-white/10 rounded-lg shadow-xl overflow-hidden pointer-events-none z-50"
        >
          {data.image && (
            <div className="relative w-full aspect-[16/9] bg-white/5">
              <Image
                src={data.image}
                alt=""
                fill
                className="object-cover"
                sizes="224px"
              />
            </div>
          )}
          <div className="px-3 py-2 space-y-1">
            <p className="text-[11px] text-white/40 uppercase tracking-wider">
              {data.domain}
            </p>
            {data.title && (
              <p className="text-sm font-medium text-white leading-snug line-clamp-2">
                {data.title}
              </p>
            )}
            {data.description && (
              <p className="text-xs text-white/50 leading-relaxed line-clamp-2">
                {data.description}
              </p>
            )}
          </div>
        </div>
      )}
    </span>
  );
}
