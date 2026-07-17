import ImageExtension from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { ImageNodeView } from "@/components/post-editor/extensions/ImageNodeView";
import {
  buildImageTitle,
  type ImageWidth,
  parseImageTitle,
} from "@/components/post-editor/imageTitle";

export type { ImageWidth };

/**
 * Image node that carries layout hints — a `width` (normal / wide / full-bleed)
 * and an optional cropped `height` in px. Both are packed into the markdown
 * image title slot (see imageTitle.ts) and recovered from the rendered title /
 * data-attributes on the way back in.
 */
export const PostImage = ImageExtension.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: "normal",
        parseHTML: (el) =>
          el.getAttribute("data-width") || parseImageTitle(el.getAttribute("title")).width,
        renderHTML: (attrs) =>
          attrs.width && attrs.width !== "normal" ? { "data-width": attrs.width } : {},
      },
      height: {
        default: null,
        parseHTML: (el) => {
          const attr = el.getAttribute("data-height");
          if (attr) return Number(attr);
          return parseImageTitle(el.getAttribute("title")).height;
        },
        renderHTML: (attrs) =>
          attrs.height ? { "data-height": String(Math.round(attrs.height)) } : {},
      },
    };
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          const alt = state.esc(node.attrs.alt || "");
          const src = String(node.attrs.src || "").replace(/[()]/g, "\\$&");
          const title = buildImageTitle(node.attrs.width, node.attrs.height);
          state.write(`![${alt}](${src}${title ? ` "${title}"` : ""})`);
          // Image is a block node — close the block so the next block (e.g. a
          // heading) is separated by a blank line instead of glued onto the same
          // line, which would make it round-trip as literal "## ...".
          state.closeBlock(node);
        },
        parse: {
          // handled by markdown-it (title -> width/height via parseHTML above)
        },
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },
});
