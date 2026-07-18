"use client";

import { Check, Copy } from "@phosphor-icons/react";
import { useState } from "react";

/**
 * A fenced code block with a header bar: the filename (or language) on the left
 * and a copy button on the right. The filename comes from the fence meta —
 * ```ts app/page.tsx — and falls back to the language name.
 */
export function CodeBlock({
  code,
  lang,
  filename,
}: {
  code: string;
  lang?: string;
  filename?: string;
}) {
  const [copied, setCopied] = useState(false);
  const label = filename || lang;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard blocked (insecure context / denied) — nothing to do.
    }
  };

  return (
    <div className="post-code">
      <div className="post-code-bar">
        <span className="post-code-name">{label}</span>
        <button type="button" className="post-code-copy" onClick={copy} aria-label="Copy code">
          {copied ? <Check weight="bold" /> : <Copy weight="regular" />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <pre>
        <code className={lang ? `language-${lang}` : undefined}>{code}</code>
      </pre>
    </div>
  );
}
