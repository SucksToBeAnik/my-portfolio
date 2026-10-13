"use client";

import { useState } from "react";
import type { PublicationLink } from "@/lib/publications";

const linkCls =
  "cursor-pointer text-muted underline-offset-[3px] transition-colors hover:text-fg hover:underline";

/** Resource links plus the two in-place toggles: abstract and BibTeX copy. */
export function PublicationActions({
  links,
  abstract,
  bibtex,
}: {
  links: PublicationLink[];
  abstract: string | null;
  bibtex: string | null;
}) {
  const [open, setOpen] = useState(false);
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
    <>
      <div className="flex flex-wrap gap-x-3.5 gap-y-1 text-xs">
        {links.map((l) => (
          <a
            key={`${l.kind}-${l.url}`}
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            className={linkCls}
          >
            {l.kind}
          </a>
        ))}
        {abstract && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className={`${linkCls} ${open ? "text-fg" : ""}`}
          >
            abstract
          </button>
        )}
        {bibtex && (
          <button type="button" onClick={copyBibtex} className={linkCls}>
            {copied ? "bibtex copied" : "cite"}
          </button>
        )}
      </div>
      {open && abstract && (
        <p className="animate-fade-up border-l border-hairline pl-3 text-xs leading-relaxed text-fg/75 whitespace-pre-line">
          {abstract}
        </p>
      )}
    </>
  );
}
