"use client";

import { useEffect } from "react";

/**
 * Positions post side-notes as tooltips on mobile. Tapping a reference number
 * opens its note as a fixed card centered over the number, clamped to the
 * viewport, and placed above (or below if there's no room). On wide screens
 * (≥1240px) notes live in the margin via CSS, so this does nothing there.
 */
export function SidenoteTooltips() {
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1240px)");
    let openRef: HTMLElement | null = null;
    let openNote: HTMLElement | null = null;

    const close = () => {
      openNote?.classList.remove("is-open");
      openRef?.setAttribute("aria-expanded", "false");
      openRef = null;
      openNote = null;
    };

    const place = (ref: HTMLElement, note: HTMLElement) => {
      const margin = 12;
      const vw = window.innerWidth;
      const w = note.offsetWidth;
      const h = note.offsetHeight;
      const r = ref.getBoundingClientRect();
      const left = Math.max(margin, Math.min(r.left + r.width / 2 - w / 2, vw - w - margin));
      const above = r.top - h - margin;
      const top = above >= margin ? above : r.bottom + margin;
      note.style.left = `${Math.round(left)}px`;
      note.style.top = `${Math.round(top)}px`;
    };

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const ref = target.closest<HTMLElement>(".post-sidenote-ref");
      if (ref) {
        if (desktop.matches) return; // margin notes on wide screens
        e.preventDefault();
        const note = ref.parentElement?.querySelector<HTMLElement>(".post-sidenote");
        if (!note) return;
        if (openNote === note) return close();
        close();
        note.classList.add("is-open");
        ref.setAttribute("aria-expanded", "true");
        openRef = ref;
        openNote = note;
        place(ref, note);
        return;
      }
      if (openNote && !target.closest(".post-sidenote")) close();
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, []);

  return null;
}
