"use client";

import { CaretDown } from "@phosphor-icons/react";

export function ScrollDown() {
  function scrollToContent() {
    document.getElementById("content")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="flex justify-start">
      <button
        type="button"
        onClick={scrollToContent}
        className="animate-bounce w-9 h-9 rounded-full border border-hairline bg-fg/5 flex items-center justify-center text-muted hover:text-fg transition-colors cursor-pointer"
        aria-label="Scroll to content"
      >
        <CaretDown weight="thin" className="w-4 h-4" />
      </button>
    </div>
  );
}
