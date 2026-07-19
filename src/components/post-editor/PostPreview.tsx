import ReactMarkdown, { type Components } from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { LiteYouTube } from "@/components/LiteYouTube";
import { CodeBlock } from "@/components/post-editor/CodeBlock";
import { getYouTubeId, isVideoSrc, parseImageTitle } from "@/components/post-editor/imageTitle";
import { PostFigure } from "@/components/post-editor/PostFigure";
import { PostVideo } from "@/components/post-editor/PostVideo";
import {
  normalizeFootnotes,
  remarkCallout,
  remarkSidenotes,
} from "@/components/post-editor/postMarkdownPlugins";
import { SidenoteTooltips } from "@/components/post-editor/SidenoteTooltips";
import { Slugger } from "@/lib/toc";

/** Minimal shape of the hast nodes react-markdown hands to component renderers. */
type HastNode =
  | { type: "text"; value: string }
  | {
      type: "element";
      tagName: string;
      properties?: { className?: unknown };
      data?: { meta?: unknown };
      children: HastNode[];
    }
  | { type: string; children?: HastNode[] };

/** Flatten a hast node's text descendants into a plain string. */
function nodeText(node: HastNode | undefined): string {
  if (!node) return "";
  if (node.type === "text" && "value" in node) return node.value;
  if ("children" in node && node.children) return node.children.map(nodeText).join("");
  return "";
}

/**
 * Every image/video/YouTube embed in a post rides the markdown-image pipeline
 * (see imageTitle). `interactive` is true on the public page (scroll-reveal +
 * lightbox) and false in the editor preview (images just appear, no lightbox).
 */
function makeComponents(interactive: boolean, slugger: Slugger): Components {
  // Ids match src/lib/toc.ts's extractHeadings so the floating TOC can link
  // straight to a section. Only h1–h3 get ids (the levels the TOC surfaces),
  // and the slugger is walked in document order to keep dedup counters aligned.
  const heading = (Tag: "h1" | "h2" | "h3") =>
    function Heading({ node, children }: { node?: unknown; children?: React.ReactNode }) {
      const id = slugger.slug(nodeText(node as HastNode));
      return <Tag id={id}>{children}</Tag>;
    };

  return {
    h1: heading("h1"),
    h2: heading("h2"),
    h3: heading("h3"),
    img: ({ src, alt, title }) => {
      const { width, height } = parseImageTitle(title);
      const caption = alt?.trim() || undefined;
      const source = typeof src === "string" ? src : undefined;
      if (!source) return null;

      const ytId = getYouTubeId(source);
      if (ytId) {
        // No mat for YouTube — the player carries its own chrome/dark bg, so a
        // frame around it just reads as a gap. The figure only spaces it out,
        // handles breakout, and hangs the caption.
        return (
          <span
            className="post-figure post-figure-embed"
            data-width={width !== "normal" ? width : undefined}
          >
            <LiteYouTube
              id={ytId}
              title={caption ?? ""}
              dataWidth={width !== "normal" ? width : undefined}
            />
            {caption ? <span className="post-caption">{caption}</span> : null}
          </span>
        );
      }

      if (isVideoSrc(source)) {
        return (
          <PostVideo
            src={source}
            caption={caption}
            width={width}
            height={height}
            interactive={interactive}
          />
        );
      }

      return (
        <PostFigure
          src={source}
          caption={caption}
          width={width}
          height={height}
          interactive={interactive}
        />
      );
    },
    // Fenced code blocks get a header bar (filename/language + copy). The <pre>
    // wraps a single <code> whose class holds the language and whose fence meta
    // (```ts app/page.tsx) holds the filename.
    pre: ({ node }) => {
      const pre = node as unknown as HastNode;
      const children = "children" in pre && pre.children ? pre.children : [];
      const codeEl = children.find(
        (child) => child.type === "element" && "tagName" in child && child.tagName === "code",
      );
      const props = codeEl && "properties" in codeEl ? codeEl.properties : undefined;
      const className = props?.className;
      const classes = Array.isArray(className) ? className.map(String) : [];
      const lang = classes.find((c) => c.startsWith("language-"))?.slice("language-".length);
      const meta =
        codeEl && "data" in codeEl && typeof codeEl.data?.meta === "string"
          ? codeEl.data.meta.trim()
          : "";
      const code = nodeText(codeEl).replace(/\n$/, "");
      return <CodeBlock code={code} lang={lang} filename={meta || undefined} />;
    },
  };
}

/**
 * Renders post markdown the same way the public page will. Text stays within
 * the reading column; images with a `wide`/`full` width hint break out via the
 * `.post-body` styles in globals.css.
 */
export function PostPreview({
  content,
  className,
  interactive = true,
}: {
  content: string;
  className?: string;
  interactive?: boolean;
}) {
  // Fresh slugger per render so heading-id dedup counters restart each pass
  // (never accumulate across re-renders) and stay in sync with the TOC.
  const components = makeComponents(interactive, new Slugger());
  return (
    <div className={`post-body text-fg/55 ${className ?? ""}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks, remarkCallout, remarkSidenotes]}
        components={components}
      >
        {normalizeFootnotes(content)}
      </ReactMarkdown>
      <SidenoteTooltips />
    </div>
  );
}
