import ReactMarkdown, { type Components } from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { isVideoSrc, parseImageTitle } from "@/components/post-editor/imageTitle";

const components: Components = {
  img: ({ src, alt, title }) => {
    const { width, height } = parseImageTitle(title);
    const caption = alt?.trim();
    const source = typeof src === "string" ? src : undefined;
    // For a cropped height, set object-fit but DON'T pin width inline for
    // wide/full — that would override the breakout width from the data-width
    // CSS (and mismatch the editor). Only normal images fill their column.
    const style = height
      ? {
          height: `${height}px`,
          objectFit: "cover" as const,
          ...(width === "normal" ? { width: "100%" } : {}),
        }
      : undefined;
    // Videos ride the same markdown-image pipeline (see imageTitle.isVideoSrc).
    return (
      <>
        {isVideoSrc(source) ? (
          <video
            src={source}
            controls
            playsInline
            data-width={width !== "normal" ? width : undefined}
            style={style}
          />
        ) : (
          <img
            src={source}
            alt={alt ?? ""}
            data-width={width !== "normal" ? width : undefined}
            style={style}
            loading="lazy"
          />
        )}
        {caption ? <span className="post-caption">{caption}</span> : null}
      </>
    );
  },
};

/**
 * Renders post markdown the same way the public page will. Text stays within
 * the reading column; images with a `wide`/`full` width hint break out via the
 * `.post-body` styles in globals.css.
 */
export function PostPreview({ content, className }: { content: string; className?: string }) {
  return (
    <div className={`post-body text-fg/55 ${className ?? ""}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
