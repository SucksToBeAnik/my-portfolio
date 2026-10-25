"use client";

import { useState } from "react";
import { Peek } from "@/components/Peek";
import type { PublicationLink } from "@/lib/publications";

const linkCls =
  "cursor-pointer py-1 text-muted underline-offset-[3px] transition-colors hover:text-fg hover:underline sm:py-0";

/** Resource links plus the abstract peek and BibTeX copy. */
export function PublicationActions({
  links,
  abstract,
  abstractFooter,
  bibtex,
}: {
  links: PublicationLink[];
  abstract: string | null;
  abstractFooter?: string;
  bibtex: string | null;
}) {
  const [copied, setCopied] = useState(false);

  if (links.length === 0 && !abstract && !bibtex) return null;

  async function copyBibtex() {
    if (!bibtex) return;
    try {
      await navigator.clipboard.writeText(bibtex);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — nothing to do
    }
  }

  return (
    <div className="flex shrink-0 flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] sm:gap-x-3">
      {links.map((l) => (
        <a
          key={`${l.kind}-${l.url}`}
          href={l.url}
          target="_blank"
          rel="noopener noreferrer"
          className={linkCls}
        >
          {l.kind} ↗
        </a>
      ))}
      {abstract && (
        <Peek
          label="abstract"
          title="Abstract"
          footer={abstractFooter}
          className={`${linkCls} aria-expanded:text-fg`}
        >
          <p className="whitespace-pre-line">{abstract}</p>
        </Peek>
      )}
      {bibtex && (
        <button type="button" onClick={copyBibtex} className={linkCls}>
          {copied ? "bibtex copied" : "cite"}
        </button>
      )}
    </div>
  );
}
