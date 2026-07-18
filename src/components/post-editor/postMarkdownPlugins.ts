/**
 * remark transforms for the post renderer. Both run on the mdast tree before it
 * becomes HTML, so the output round-trips as plain markdown in the editor.
 *
 *  - remarkCallout   → a blockquote whose first line is `[!NOTE]` (or TIP /
 *                      IMPORTANT / WARNING / CAUTION) becomes a callout <div>,
 *                      so it no longer picks up the pull-quote styling.
 *  - remarkSidenotes → `[^1]` footnotes are lifted out of the bottom section and
 *                      rendered inline as Tufte-style margin side-notes.
 */

/** Minimal mdast shape — enough to walk and rewrite the nodes we care about. */
interface MdNode {
  type: string;
  identifier?: string;
  value?: string;
  children?: MdNode[];
  data?: {
    hName?: string;
    hProperties?: Record<string, unknown>;
  };
}

const ALERT = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i;

/**
 * The editor's markdown serializer escapes `[` and `]`, so a typed `[^1]` is
 * stored as `\[^1\]`. remark-gfm parses footnotes as syntax tokens (not text),
 * so escaped brackets are never recognised — un-escape footnote markers before
 * the markdown is parsed so references and definitions round-trip.
 */
export function normalizeFootnotes(markdown: string): string {
  return markdown.replace(/\\\[\^([^\]]+)\\\]/g, "[^$1]");
}

export function remarkCallout() {
  return (tree: unknown) => walkCallouts(tree as MdNode);
}

function walkCallouts(node: MdNode): void {
  if (!node.children) return;
  for (const child of node.children) {
    if (child.type === "blockquote") toCallout(child);
    walkCallouts(child);
  }
}

function toCallout(bq: MdNode): void {
  const firstPara = bq.children?.[0];
  const firstChild = firstPara?.children?.[0];
  if (
    firstPara?.type !== "paragraph" ||
    firstChild?.type !== "text" ||
    typeof firstChild.value !== "string"
  ) {
    return;
  }
  const match = ALERT.exec(firstChild.value);
  if (!match || !firstPara.children) return;
  const type = match[1].toUpperCase();

  // Strip the marker off the opening line.
  firstChild.value = firstChild.value.slice(match[0].length);
  if (firstChild.value === "") {
    firstPara.children.shift();
    if (firstPara.children[0]?.type === "break") firstPara.children.shift();
    if (firstPara.children.length === 0) bq.children?.shift();
  }

  bq.data = {
    hName: "div",
    hProperties: { className: ["post-callout", `post-callout-${type.toLowerCase()}`] },
  };
  const label: MdNode = {
    type: "paragraph",
    data: { hName: "p", hProperties: { className: ["post-callout-label"] } },
    children: [{ type: "text", value: type }],
  };
  bq.children = [label, ...(bq.children ?? [])];
}

export function remarkSidenotes() {
  return (tree: unknown) => {
    const root = tree as MdNode;
    const defs = new Map<string, MdNode[]>();
    collectDefs(root, defs);
    replaceRefs(root, defs, { n: 0 });
  };
}

/** Pull footnote definitions out of the tree, flattened to inline content. */
function collectDefs(node: MdNode, defs: Map<string, MdNode[]>): void {
  if (!node.children) return;
  node.children = node.children.filter((child) => {
    if (child.type === "footnoteDefinition" && child.identifier) {
      defs.set(child.identifier, inlineFrom(child.children ?? []));
      return false;
    }
    collectDefs(child, defs);
    return true;
  });
}

/** Flatten block content (paragraphs) into inline nodes for a <span> host. */
function inlineFrom(blocks: MdNode[]): MdNode[] {
  const out: MdNode[] = [];
  for (const block of blocks) {
    if (block.type === "paragraph" && block.children) {
      if (out.length) out.push({ type: "text", value: " " });
      out.push(...block.children);
    } else if (block.children) {
      out.push(...inlineFrom(block.children));
    }
  }
  return out;
}

function replaceRefs(node: MdNode, defs: Map<string, MdNode[]>, counter: { n: number }): void {
  if (!node.children) return;
  node.children = node.children.map((child) => {
    if (child.type === "footnoteReference" && child.identifier) {
      const body = defs.get(child.identifier);
      if (!body) return child;
      counter.n += 1;
      return sidenote(counter.n, body);
    }
    replaceRefs(child, defs, counter);
    return child;
  });
}

function sidenote(n: number, body: MdNode[]): MdNode {
  const label = String(n);
  return {
    type: "sidenote",
    data: { hName: "span", hProperties: { className: ["post-sidenote-wrap"] } },
    children: [
      // The ref number is a button; on mobile SidenoteTooltips positions the
      // note as a tooltip on tap. On wide screens the note is always shown,
      // floated into the margin (CSS only).
      {
        type: "sidenoteRef",
        data: {
          hName: "button",
          hProperties: {
            type: "button",
            className: ["post-sidenote-ref"],
            "aria-expanded": "false",
          },
        },
        children: [{ type: "text", value: label }],
      },
      {
        type: "sidenoteBody",
        data: { hName: "span", hProperties: { className: ["post-sidenote"], role: "note" } },
        children: [
          {
            type: "sidenoteNum",
            data: { hName: "span", hProperties: { className: ["post-sidenote-num"] } },
            children: [{ type: "text", value: label }],
          },
          { type: "text", value: " " },
          ...body,
        ],
      },
    ],
  };
}
