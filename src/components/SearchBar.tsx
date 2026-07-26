"use client";

import { MagnifyingGlass } from "@phosphor-icons/react";

export function SearchBar() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent("opensearch"))}
      className="flex items-center gap-2 pl-2.5 pr-2 py-1.5 rounded-full border border-control-border text-fg/70 hover:text-fg hover:border-fg/45 transition-colors cursor-pointer"
      aria-label="Search"
    >
      <MagnifyingGlass weight="bold" className="w-3.5 h-3.5 shrink-0" />
      <span className="text-xs mr-1.5">Search</span>
      <kbd className="shrink-0 inline-flex items-center leading-none text-[10px] text-fg/50">
        ⌘K
      </kbd>
    </button>
  );
}
