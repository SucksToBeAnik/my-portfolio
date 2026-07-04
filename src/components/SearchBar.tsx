"use client";

import { MagnifyingGlass } from "@phosphor-icons/react";

export function SearchBar() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent("opensearch"))}
      className="flex items-center gap-2 pl-2.5 pr-2 py-1.5 rounded-full border border-fg/15 text-muted hover:text-fg hover:border-fg/30 transition-colors cursor-pointer"
      aria-label="Search"
    >
      <MagnifyingGlass weight="thin" className="w-3.5 h-3.5 shrink-0" />
      <span className="text-xs text-muted/70 mr-1.5">Search</span>
      <kbd className="shrink-0 inline-flex items-center leading-none text-[10px] text-muted/70">⌘K</kbd>
    </button>
  );
}
