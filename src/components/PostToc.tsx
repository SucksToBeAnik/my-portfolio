"use client";

import { useEffect, useState } from "react";
import type { TocHeading } from "@/lib/toc";

/**
 * Floating reading progress / table of contents. On wide screens it hangs in
 * the left margin as a stack of thin bars (one per heading); hovering swaps the
 * bars for a glass overlay listing the sections. Scroll-spy tracks the section
 * currently in view. Hidden below `xl`, where there's no room beside the column.
 */
export function PostToc({ headings }: { headings: TocHeading[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (headings.length < 2) return;
    const elements = headings
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActiveId(visible[0].target.id);
      },
      // Fire once a heading crosses into the top third of the viewport.
      { rootMargin: "0px 0px -66% 0px", threshold: 0 },
    );
    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 2) return null;

  const minLevel = Math.min(...headings.map((h) => h.level));

  function handleClick(e: React.MouseEvent, id: string) {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", `#${id}`);
    setActiveId(id);
  }

  return (
    <div
      className="hidden xl:block fixed left-6 top-1/2 -translate-y-1/2 z-30"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {/* Collapsed: a stack of bars, one per heading. */}
      <div
        className={`flex flex-col gap-2.5 py-2 transition-opacity duration-300 ${
          open ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
        aria-hidden
      >
        {headings.map((h) => {
          const indent = h.level - minLevel;
          const isActive = h.id === activeId;
          return (
            <span
              key={h.id}
              className={`h-0.5 rounded-full transition-all duration-300 ${
                isActive ? "bg-fg" : "bg-fg/25"
              }`}
              style={{ width: `${28 - indent * 8}px`, marginLeft: `${indent * 8}px` }}
            />
          );
        })}
      </div>

      {/* Expanded: the section list, swapped in over the bars on hover. */}
      <nav
        className={`absolute left-0 top-1/2 min-w-[200px] max-w-[240px] -translate-y-1/2 rounded-2xl border border-nav-border bg-nav-popup-bg p-3 shadow-xl backdrop-blur-xl transition-all duration-200 ${
          open ? "translate-x-0 opacity-100" : "pointer-events-none -translate-x-2 opacity-0"
        }`}
      >
        <p className="px-2 pb-2 font-heading text-[10px] uppercase tracking-[0.15em] text-muted">
          On this page
        </p>
        <ul className="flex flex-col">
          {headings.map((h) => {
            const indent = h.level - minLevel;
            const isActive = h.id === activeId;
            return (
              <li key={h.id}>
                <a
                  href={`#${h.id}`}
                  onClick={(e) => handleClick(e, h.id)}
                  className={`block rounded-lg py-1.5 pr-2 text-xs leading-snug transition-colors ${
                    isActive
                      ? "bg-fg/[0.06] text-fg"
                      : "text-muted hover:bg-fg/[0.04] hover:text-fg"
                  }`}
                  style={{ paddingLeft: `${8 + indent * 12}px` }}
                >
                  {h.text}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
