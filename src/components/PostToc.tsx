"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TocHeading } from "@/lib/toc";

/**
 * Floating reading progress / table of contents. On wide screens it hangs in
 * the left margin as a stack of thin bars (one per heading); hovering swaps the
 * bars for a glass overlay listing the sections. Scroll-spy tracks the section
 * currently in view. Hidden below `xl`, where there's no room beside the column.
 *
 * On the public pages the scroll container is the window (default). In the admin
 * editor preview, scrolling happens inside an `overflow-y-auto` panel — pass
 * that element via `scrollRootRef` so scroll tracking and jumps target it.
 *
 * Active section and navigation are driven by the *live* heading elements
 * (matched to `headings` by document order), not by id, so they work even if a
 * slug ever diverged from the rendered id.
 */
export function PostToc({
  headings,
  scrollRootRef,
}: {
  headings: TocHeading[];
  scrollRootRef?: React.RefObject<HTMLElement | null>;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const elementsRef = useRef<HTMLElement[]>([]);

  // The heading nearest above the top of the reading viewport is "active".
  const computeActive = useCallback(() => {
    const els = elementsRef.current;
    if (els.length === 0) return;
    const root = scrollRootRef?.current ?? null;

    // A short trailing section can't be scrolled up to the activation line, so
    // once the scroller bottoms out, force the last heading active.
    const atBottom = root
      ? root.scrollTop + root.clientHeight >= root.scrollHeight - 2
      : window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
    if (atBottom) {
      setActiveIndex(els.length - 1);
      return;
    }

    const line = (root ? root.getBoundingClientRect().top : 0) + 100;
    let idx = 0;
    for (let i = 0; i < els.length; i++) {
      if (els[i].getBoundingClientRect().top - line <= 0) idx = i;
      else break;
    }
    setActiveIndex(idx);
  }, [scrollRootRef]);

  useEffect(() => {
    if (headings.length < 2) return;
    const root = scrollRootRef?.current ?? null;
    const scope: ParentNode = root ?? document;
    elementsRef.current = Array.from(
      scope.querySelectorAll<HTMLElement>(".post-body h1, .post-body h2, .post-body h3"),
    );
    computeActive();

    const scroller: HTMLElement | Window = root ?? window;
    scroller.addEventListener("scroll", computeActive, { passive: true });
    window.addEventListener("resize", computeActive);
    return () => {
      scroller.removeEventListener("scroll", computeActive);
      window.removeEventListener("resize", computeActive);
    };
  }, [headings, scrollRootRef, computeActive]);

  if (headings.length < 2) return null;

  const minLevel = Math.min(...headings.map((h) => h.level));

  function handleClick(e: React.MouseEvent, index: number, id: string) {
    e.preventDefault();
    const el = elementsRef.current[index];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    // Reflect the section in the URL on public pages only — not in the editor,
    // where a custom scroll root means we're inside an admin route.
    if (!scrollRootRef) history.replaceState(null, "", `#${id}`);
    setActiveIndex(index);
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
        {headings.map((h, i) => {
          const indent = h.level - minLevel;
          const isActive = i === activeIndex;
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
          {headings.map((h, i) => {
            const indent = h.level - minLevel;
            const isActive = i === activeIndex;
            return (
              <li key={h.id}>
                <a
                  href={`#${h.id}`}
                  onClick={(e) => handleClick(e, i, h.id)}
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
