"use client";

import { useState, useRef } from "react";
import Image from "next/image";

interface LinkPreviewProps {
  url: string;
  children: React.ReactNode;
  className?: string;
  position?: "right" | "bottom";
}

interface PreviewData {
  title: string | null;
  description: string | null;
  image: string | null;
  logo: string | null;
  domain: string;
}

export function LinkPreview({ url, children, className = "", position = "right" }: LinkPreviewProps) {
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
        fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`)
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
      className={`relative inline-flex ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {visible && (
        <div
          style={{
            position: "fixed",
            transform: position === "bottom" ? "translateX(-50%)" : undefined,
            ...pos,
          }}
          className="w-64 bg-bg border border-hairline rounded-xl shadow-2xl overflow-hidden pointer-events-none z-50"
        >
          {data?.image && (
            <div className="relative w-full aspect-[16/10] bg-hover-bg">
              <Image
                src={data.image}
                alt=""
                fill
                className="object-cover"
                sizes="256px"
              />
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
        </div>
      )}
    </span>
  );
}
