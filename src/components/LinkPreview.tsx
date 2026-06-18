"use client";

import { useState, useRef } from "react";
import Image from "next/image";

interface LinkPreviewProps {
  url: string;
  children: React.ReactNode;
}

interface PreviewData {
  title: string | null;
  description: string | null;
  image: string | null;
  logo: string | null;
  domain: string;
}

export function LinkPreview({ url, children }: LinkPreviewProps) {
  const [data, setData] = useState<PreviewData | null>(null);
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState<React.CSSProperties>({});
  const fetchedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  function getDomain(u: string): string {
    try {
      return new URL(u.startsWith("http") ? u : `https://${u}`).hostname.replace("www.", "");
    } catch {
      return u;
    }
  }

  function handleMouseEnter(e: React.MouseEvent<HTMLSpanElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;

    timerRef.current = setTimeout(() => {
      if (spaceAbove >= 200) {
        setPos({
          bottom: window.innerHeight - rect.top + 8,
          left: rect.left + rect.width / 2,
        });
      } else {
        setPos({
          top: rect.bottom + 8,
          left: rect.left + rect.width / 2,
        });
      }
      setVisible(true);

      if (!fetchedRef.current) {
        fetchedRef.current = true;
        fetch(
          `https://api.microlink.io/?url=${encodeURIComponent(url)}`
        )
          .then((r) => r.json())
          .then((json) => {
            if (json.status === "success") {
              setData({
                title: json.data.title || null,
                description: json.data.description || null,
                image: json.data.image?.url || null,
                logo: json.data.logo?.url || null,
                domain: getDomain(url),
              });
            }
          })
          .catch(() => {});
      }
    }, 400);
  }

  function handleMouseLeave() {
    clearTimeout(timerRef.current);
    setVisible(false);
  }

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {visible && (
        <div
          style={{
            position: "fixed",
            transform: "translateX(-50%)",
            ...pos,
          }}
          className="w-56 bg-[#0d1117] border border-white/10 rounded-lg shadow-xl overflow-hidden pointer-events-none z-50"
        >
          {data?.image || data?.logo ? (
            <div className="relative w-full aspect-[16/9] bg-white/5">
              <Image
                src={data.image || data.logo!}
                alt=""
                fill
                className="object-cover"
                sizes="224px"
              />
            </div>
          ) : (
            <div className="w-full aspect-[16/9] bg-white/5" />
          )}
          <div className="px-3 py-2 space-y-1">
            <p className="text-[11px] text-white/40 uppercase tracking-wider">
              {data?.domain || getDomain(url)}
            </p>
            {data?.title && (
              <p className="text-sm font-medium text-white leading-snug line-clamp-2">
                {data.title}
              </p>
            )}
            {data?.description && (
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
