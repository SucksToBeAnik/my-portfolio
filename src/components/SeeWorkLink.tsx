"use client";

import { CaretDown } from "@phosphor-icons/react";

export function SeeWorkLink() {
  return (
    <button
      type="button"
      onClick={() => {
        document.getElementById("content")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }}
      className="flex items-center gap-1.5 text-xs font-heading px-3 py-1.5 rounded-full border border-fg/15 text-muted hover:text-fg hover:border-fg/30 transition-colors cursor-pointer uppercase"
    >
      See my work
      <CaretDown weight="bold" className="w-3 h-3 animate-bounce" />
    </button>
  );
}
