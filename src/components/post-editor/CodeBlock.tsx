"use client";

import { Check, Copy } from "@phosphor-icons/react";
import type { PrismEditor } from "prism-code-editor-lightweight";
// Prism grammars — side-effect imports register them with the editor. Each
// pulls in its own dependencies (e.g. typescript → javascript → clike).
import "prism-code-editor-lightweight/prism/languages/markup";
import "prism-code-editor-lightweight/prism/languages/css";
import "prism-code-editor-lightweight/prism/languages/javascript";
import "prism-code-editor-lightweight/prism/languages/typescript";
import "prism-code-editor-lightweight/prism/languages/jsx";
import "prism-code-editor-lightweight/prism/languages/tsx";
import "prism-code-editor-lightweight/prism/languages/json";
import "prism-code-editor-lightweight/prism/languages/bash";
import "prism-code-editor-lightweight/prism/languages/python";
import "prism-code-editor-lightweight/prism/languages/go";
import "prism-code-editor-lightweight/prism/languages/rust";
import "prism-code-editor-lightweight/prism/languages/sql";
import "prism-code-editor-lightweight/prism/languages/yaml";
import "prism-code-editor-lightweight/prism/languages/markdown";
import "prism-code-editor-lightweight/prism/languages/c";
import "prism-code-editor-lightweight/prism/languages/cpp";
import { minimalEditor, updateTheme } from "prism-code-editor-lightweight/setups";
import { useEffect, useRef, useState } from "react";
import { canonicalLang, languageLabel } from "@/lib/codeLang";
import { useTheme } from "@/lib/ThemeProvider";

/**
 * A fenced code block styled like an editor window: a title bar with macOS
 * traffic-light dots, an optional filename, the language name, and a copy
 * button, over Prism-highlighted code.
 *
 * Highlighting is a read-only `prism-code-editor` mounted into a shadow root
 * (its styles/theme stay isolated there). We render the raw code in a plain
 * <pre> fallback first; the shadow root then takes over rendering, so the code
 * is still present for crawlers and readable before/without JS.
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
  const { theme } = useTheme();
  // vs-code-dark is a neutral near-black (#1e1e1e); github-dark reads bluish.
  const themeName = theme === "light" ? "github-light" : "vs-code-dark";
  const themeNameRef = useRef(themeName);
  themeNameRef.current = themeName;

  const hostRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<PrismEditor | null>(null);
  const [copied, setCopied] = useState(false);
  const label = languageLabel(lang);

  // Mount the editor once per code/language; theme changes are handled below.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const editor = minimalEditor(host, {
      language: canonicalLang(lang) || "text",
      value: code,
      theme: themeNameRef.current,
      readOnly: true,
      lineNumbers: true,
      tabSize: 2,
    });
    editorRef.current = editor;

    // We're read-only: kill the shaded "current line" and the blinking caret.
    // The editable layer is `.prism-code-editor textarea` (NOT `.pce-textarea`);
    // caret-color:transparent hides the caret even when the textarea is focused.
    // These rules live in the shadow root, so !important beats the theme.
    const shadow = host.shadowRoot;
    if (shadow) {
      const style = document.createElement("style");
      style.textContent =
        ".active-line::after{background:transparent!important;border:none!important}" +
        ".prism-code-editor textarea{caret-color:transparent!important;cursor:default!important}";
      shadow.append(style);
    }

    return () => {
      editor.remove();
      editorRef.current = null;
    };
  }, [code, lang]);

  useEffect(() => {
    if (editorRef.current) updateTheme(editorRef.current, themeName);
  }, [themeName]);

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
          <button type="button" className="post-code-copy" onClick={copy} aria-label="Copy code">
            {copied ? <Check weight="bold" /> : <Copy weight="regular" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </span>
      </div>
      <div ref={hostRef} className="post-code-editor">
        <pre className="post-code-fallback">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}
