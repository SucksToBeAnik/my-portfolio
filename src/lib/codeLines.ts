import { canHighlight, lowlight } from "@/lib/lowlight";

/** hast types, taken from lowlight's own return type so no extra dep is needed. */
type Root = ReturnType<typeof lowlight.highlight>;
type Child = Root["children"][number];
type Element = Extract<Child, { type: "element" }>;

/**
 * Highlights `code` and splits the result into one hast root per source line.
 *
 * Line numbers only stay glued to their code when each line is its own element:
 * a single <pre> beside a gutter of "1\n2\n3" drifts the moment a long line
 * wraps. Splitting here lets the reader lay the block out as a grid of
 * (number, line) rows, so lines can wrap freely and the numbers still line up.
 *
 * A token that spans lines (block comment, template string) is reopened on each
 * line with the same classes, which is what keeps its styling intact across the
 * break. Unhighlightable languages take the same path with one plain text node.
 */
export function highlightLines(code: string, lang?: string): Root[] {
  const source: Child[] = canHighlight(lang)
    ? lowlight.highlight(lang as string, code).children
    : [{ type: "text", value: code }];

  const lines: Root[] = [];
  let current: Child[] = [];

  /** Re-wrap a token in the span chain it sat inside, innermost last. */
  const emit = (node: Child, ancestors: Element[]) => {
    current.push(
      ancestors.reduceRight<Child>(
        (child, el) => ({ ...el, children: [child] as Element["children"] }),
        node,
      ),
    );
  };

  const walk = (node: Child, ancestors: Element[]) => {
    if (node.type === "text") {
      const parts = node.value.split("\n");
      for (const [i, part] of parts.entries()) {
        if (i > 0) {
          lines.push({ type: "root", children: current });
          current = [];
        }
        if (part) emit({ type: "text", value: part }, ancestors);
      }
      return;
    }
    if (node.type === "element") {
      for (const child of node.children) walk(child, [...ancestors, node]);
      return;
    }
    emit(node, ancestors);
  };

  for (const node of source) walk(node, []);
  lines.push({ type: "root", children: current });
  return lines;
}
