"use client";

export function AskPrompt() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent("openchat"))}
      className="inline font-medium text-fg/80 hover:text-fg transition-colors cursor-pointer"
    >
      Ask me anything &rarr;
    </button>
  );
}
