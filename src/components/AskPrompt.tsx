"use client";

export function AskPrompt() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent("openchat"))}
      className="text-xs font-heading px-3 py-1.5 rounded-full border border-hairline text-muted hover:text-fg hover:border-fg/30 transition-colors cursor-pointer"
    >
      Ask me anything &rarr;
    </button>
  );
}
