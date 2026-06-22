"use client";

import { ArrowSquareOut } from "@phosphor-icons/react";
import { LinkPreview } from "@/components/LinkPreview";

function getDomain(url: string) {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return "Source";
  }
}

export function SourceLink({ url }: { url: string }) {
  return (
    <LinkPreview url={url} position="bottom">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-xs text-fg/40 hover:text-fg transition-colors"
      >
        {getDomain(url)}
        <ArrowSquareOut weight="thin" className="w-3.5 h-3.5" />
      </a>
    </LinkPreview>
  );
}
