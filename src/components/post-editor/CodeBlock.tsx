"use client";

import { Check, Copy } from "@phosphor-icons/react";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import { useState } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { languageLabel } from "@/lib/codeLang";
import { canHighlight, lowlight } from "@/lib/lowlight";

/**
 * A fenced code block styled like an editor window: a title bar with macOS
 * traffic-light dots, an optional filename, the language name, and a copy
 * button, over a line-numbered, syntax-highlighted body.
 *
 * Highlighting runs synchronously with lowlight (the same instance the editor
 * uses), so the coloured markup is present in the server-rendered HTML — no
 * hydration gap, readable by crawlers and without JS. The gutter is a separate
 * column of numbers aligned to the code by a shared line-height.
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
  const label = languageLabel(lang);

  const highlighted = canHighlight(lang)
    ? toJsxRuntime(lowlight.highlight(lang as string, code), { Fragment, jsx, jsxs })
    : code;

  const lineCount = code.split("\n").length;
  const gutter = Array.from({ length: lineCount }, (_, i) => i + 1).join("\n");

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
        <span className="post-code-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        {filename && <span className="post-code-name">{filename}</span>}
        <span className="post-code-meta">
          {label && <span className="post-code-lang">{label}</span>}
          <button
            type="button"
            className="post-code-copy"
            onClick={copy}
            aria-label={copied ? "Copied" : "Copy code"}
          >
            {copied ? <Check weight="bold" /> : <Copy weight="regular" />}
          </button>
        </span>
      </div>
      <div className="post-code-body">
        <span className="post-code-gutter" aria-hidden="true">
          {gutter}
        </span>
        <pre className="post-code-pre">
          <code className="hljs">{highlighted}</code>
        </pre>
      </div>
    </div>
  );
}
