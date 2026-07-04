"use client";

import { ChatCircleDots } from "@phosphor-icons/react";

export function AskButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent("openchat"))}
      className="group flex items-center px-2 py-1.5 rounded-full border border-hairline text-muted hover:text-fg hover:border-fg/30 transition-colors cursor-pointer overflow-hidden"
      aria-label="Ask me anything"
    >
      <ChatCircleDots weight="thin" className="size-3.5 shrink-0" />
      <span className="flex items-center gap-3 max-w-0 group-hover:max-w-[100px] opacity-0 group-hover:opacity-100 whitespace-nowrap overflow-hidden transition-all duration-300 ease-out">
        <span className="text-xs text-muted/70 pl-2">Ask Me</span>
        <kbd className="shrink-0 inline-flex items-center leading-none text-[10px] text-muted/70">⌘/</kbd>
      </span>
    </button>
  );
}
