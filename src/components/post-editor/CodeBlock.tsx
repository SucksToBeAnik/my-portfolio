import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { CopyButton } from "@/components/post-editor/CopyButton";
import { languageLabel } from "@/lib/codeLang";
import { canHighlight, lowlight } from "@/lib/lowlight";

/**
 * A fenced code block styled like an editor window: a title bar with macOS
 * traffic-light dots, an optional filename, the language name, and a copy
 * button, over a line-numbered, syntax-highlighted body.
 *
 * Deliberately NOT a client component: on public post/project pages the
 * lowlight highlighting runs on the server and only the tiny CopyButton
 * hydrates, keeping ~35 highlight.js languages out of the reader bundle.
 * (When imported from the admin editors' client tree it compiles as a client
 * component — the editor already bundles lowlight for live highlighting.)
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
  const label = languageLabel(lang);

  const highlighted = canHighlight(lang)
    ? toJsxRuntime(lowlight.highlight(lang as string, code), { Fragment, jsx, jsxs })
    : code;

  const lineCount = code.split("\n").length;
  const gutter = Array.from({ length: lineCount }, (_, i) => i + 1).join("\n");

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
          <CopyButton code={code} />
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
