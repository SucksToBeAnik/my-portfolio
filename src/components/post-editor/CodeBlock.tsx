import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { CopyButton } from "@/components/post-editor/CopyButton";
import { languageLabel } from "@/lib/codeLang";
import { highlightLines } from "@/lib/codeLines";

/**
 * A fenced code block: near-monochrome code on a tinted surface, numbered lines
 * that wrap instead of scrolling sideways, and the language name plus a copy
 * button above it. No window chrome, no frame, no rules — whitespace does all
 * the separating.
 *
 * Each line is its own grid row (number cell + code cell) so a wrapped line
 * pushes its own number's row down instead of drifting out of step with it.
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
  const lines = highlightLines(code, lang);

  return (
    <div className="post-code">
      <div className="post-code-bar">
        {filename && <span className="post-code-name">{filename}</span>}
        {label && <span className="post-code-lang">{label}</span>}
        <CopyButton code={code} />
      </div>
      <pre className="post-code-pre">
        <code className="hljs">
          {lines.map((line, i) => (
            // A line has no identity beyond its position — the index is the key.
            <Fragment key={i}>
              <span className="post-code-num" aria-hidden="true">
                {i + 1}
              </span>
              <span className="post-code-line">{toJsxRuntime(line, { Fragment, jsx, jsxs })}</span>
            </Fragment>
          ))}
        </code>
      </pre>
    </div>
  );
}
