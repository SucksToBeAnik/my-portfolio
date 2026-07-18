"use client";

import { CaretDown } from "@phosphor-icons/react";
import { NodeViewContent, NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import { CODE_LANGUAGES } from "@/lib/codeLang";

/**
 * Editable code block with a language picker in its top-right corner. The
 * selected language is stored on the node's `language` attribute, which
 * tiptap-markdown serializes as the fence info string (```typescript) — the
 * same value the reader's CodeBlock highlights from.
 */
export function CodeBlockNodeView({ node, updateAttributes }: ReactNodeViewProps) {
  const language = String(node.attrs.language ?? "");

  return (
    <NodeViewWrapper className="post-cb-editor">
      <div className="post-cb-lang" contentEditable={false}>
        <select
          value={language}
          aria-label="Code language"
          // Keep the selection/keystroke inside the control instead of the editor.
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => updateAttributes({ language: e.target.value || null })}
        >
          {CODE_LANGUAGES.map((l) => (
            <option key={l.value || "plain"} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
        <CaretDown weight="bold" aria-hidden="true" />
      </div>
      <pre>
        <NodeViewContent<"code"> as="code" />
      </pre>
    </NodeViewWrapper>
  );
}
