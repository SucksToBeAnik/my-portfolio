"use client";

import { ChatCircleDots } from "@phosphor-icons/react";

export function AskPrompt() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent("openchat"))}
      className="flex items-center gap-2 px-4 py-2.5 text-sm text-fg/60 hover:text-fg border border-hairline rounded-xl hover:bg-hover-bg transition-all"
    >
      <ChatCircleDots weight="thin" className="w-4 h-4 shrink-0" />
      <span>Ask me anything — I&apos;ll tell you about myself</span>
      <span className="ml-auto text-xs text-muted">&rarr;</span>
    </button>
  );
}
