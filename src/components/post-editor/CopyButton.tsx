"use client";

import { Check, Copy } from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";

/** The only interactive part of a rendered code block. */
export function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

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
    <button
      type="button"
      className="post-code-copy"
      onClick={copy}
      aria-label={copied ? "Copied" : "Copy code"}
    >
      {copied ? <Check weight="bold" /> : <Copy weight="regular" />}
    </button>
  );
}
