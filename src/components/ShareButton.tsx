"use client";

import { ArrowUpRight, Check } from "@phosphor-icons/react";
import { useState } from "react";

export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // user cancelled — fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — nothing to do
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex items-center gap-2 rounded-full bg-fg px-5 py-2.5 text-sm font-medium text-bg transition-opacity hover:opacity-80"
    >
      {copied ? (
        <>
          <Check weight="bold" className="h-4 w-4" />
          Link copied
        </>
      ) : (
        <>
          Share
          <ArrowUpRight weight="bold" className="h-4 w-4" />
        </>
      )}
    </button>
  );
}
