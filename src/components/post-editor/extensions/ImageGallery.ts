import { Node, ReactNodeViewRenderer } from "@tiptap/react";
import { GalleryNodeView } from "@/components/post-editor/extensions/GalleryNodeView";
import {
  buildImageTitle,
  type ImageFit,
  type ImageWidth,
  parseImageTitle,
} from "@/components/post-editor/imageTitle";

export interface GalleryImage {
  src: string;
  alt: string;
  /** How the image sits in its 3:2 plate — crop to fill (default) or letterbox. */
  fit?: ImageFit;
}

/** Spreads hold 2 (diptych) or 3 (triptych) images. */
export const GALLERY_MAX = 3;

const TEXT_NODE = 3;

/** Subset of prosemirror-markdown's serializer state used by `serialize`. */
interface MarkdownState {
  write(text: string): void;
  esc(text: string): string;
  closeBlock(node: unknown): void;
}

/** Minimal shape of the gallery node as seen by the markdown serializer. */
interface GalleryNode {
  attrs: { images?: GalleryImage[]; width?: ImageWidth; height?: number | null };
}

function imagesFromEl(el: HTMLElement): GalleryImage[] {
  return Array.from(el.querySelectorAll("img")).map((img) => {
    const { fit } = parseImageTitle(img.getAttribute("title"));
    return {
      src: img.getAttribute("src") ?? "",
      alt: img.getAttribute("alt") ?? "",
      ...(fit !== "cover" ? { fit } : {}),
    };
  });
}

/** The element's non-whitespace children, iff they are 2+ images — else null. */
function galleryChildren(el: HTMLElement): HTMLElement[] | null {
  const children = Array.from(el.childNodes).filter(
    (n) => !(n.nodeType === TEXT_NODE && !n.textContent?.trim()),
  );
  if (children.length < 2 || !children.every((n) => n.nodeName === "IMG")) return null;
  return children as HTMLElement[];
}

/** Row width hint: an explicit data-width, else the first image's title token. */
function widthFromEl(el: HTMLElement, firstImg: HTMLElement | undefined): ImageWidth {
  const attr = el.getAttribute("data-width");
  if (attr === "wide" || attr === "full") return attr;
  return parseImageTitle(firstImg?.getAttribute("title")).width;
}

/** Row height crop: an explicit data-height, else the first image's h token. */
function heightFromEl(el: HTMLElement, firstImg: HTMLElement | undefined): number | null {
  const attr = el.getAttribute("data-height");
  if (attr) return Number(attr);
  return parseImageTitle(firstImg?.getAttribute("title")).height;
}

/**
 * A diptych/triptych spread: 2–3 images side by side with hairline gutters,
 * breaking out of the reading column (full-bleed by default; the bubble-menu
 * width toggle also applies to a selected spread). Serialized as consecutive
 * markdown images on a single line — `![a](s1 "full") ![b](s2)` — with the
 * width token carried by the first image's title slot. The public renderer
 * keeps the images in one paragraph and lays it out as a flex row (see the
 * `.post-body` spread styles in globals.css).
 */
export const ImageGallery = Node.create({
  name: "imageGallery",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      images: { default: [] },
      // New spreads land in the full-bleed zone; parse always sets this
      // explicitly so markdown without a token stays "normal".
      width: { default: "full" },
      // Row-level height crop in px (drag handle, like single images). null
      // falls back to the 3:2 plate ratio.
      height: { default: null },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-image-gallery]",
        getAttrs: (el) => {
          const first = el.querySelector("img") ?? undefined;
          return {
            images: imagesFromEl(el),
            width: widthFromEl(el, first),
            height: heightFromEl(el, first),
          };
        },
      },
      // Pasted HTML: claim a paragraph of nothing but 2+ images before the
      // default paragraph rule (priority 50). Markdown loads never hit this
      // rule — they are rewritten to the div form by `parse.updateDOM` below.
      {
        tag: "p",
        priority: 100,
        getAttrs: (el) => {
          const children = galleryChildren(el);
          if (!children) return false;
          return {
            images: imagesFromEl(el),
            width: widthFromEl(el, children[0]),
            height: heightFromEl(el, children[0]),
          };
        },
      },
    ];
  },

  renderHTML({ node }) {
    const images = (node.attrs.images ?? []) as GalleryImage[];
    const width = node.attrs.width as ImageWidth;
    const height = node.attrs.height as number | null;
    return [
      "div",
      {
        "data-image-gallery": "",
        ...(width && width !== "normal" ? { "data-width": width } : {}),
        ...(height ? { "data-height": String(Math.round(height)) } : {}),
      },
      ...images.map((img): [string, Record<string, string>] => [
        "img",
        {
          src: img.src,
          alt: img.alt,
          // The fit token rides the title slot so it survives the clipboard
          // (imagesFromEl reads it back on paste).
          ...(img.fit && img.fit !== "cover" ? { title: img.fit } : {}),
        },
      ]),
    ];
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: MarkdownState, node: GalleryNode) {
          const images = node.attrs.images ?? [];
          const line = images
            .map((img, i) => {
              const src = img.src.replace(/[()]/g, "\\$&");
              // The first image's title carries the row width token; the
              // row-level height crop goes on EVERY image so each figure on
              // the public page renders at the same height.
              const width = i === 0 ? (node.attrs.width ?? "normal") : "normal";
              const title = buildImageTitle(width, node.attrs.height ?? null, img.fit);
              return `![${state.esc(img.alt || "")}](${src}${title ? ` "${title}"` : ""})`;
            })
            .join(" ");
          state.write(line);
          state.closeBlock(node);
        },
        parse: {
          // tiptap-markdown's normalizeBlocks lifts every block-level <img>
          // out of its paragraph BEFORE the ProseMirror DOM parse — which
          // would split a spread into separate images. This hook runs first:
          // rewrite image-only paragraphs to the gallery <div> form so the
          // imgs are no longer inside a <p> and survive normalization.
          updateDOM(element: HTMLElement) {
            for (const p of Array.from(element.querySelectorAll("p"))) {
              const children = galleryChildren(p);
              if (!children) continue;
              const div = p.ownerDocument.createElement("div");
              div.setAttribute("data-image-gallery", "");
              const width = parseImageTitle(children[0].getAttribute("title")).width;
              if (width !== "normal") div.setAttribute("data-width", width);
              for (const img of children) div.appendChild(img);
              p.replaceWith(div);
            }
          },
        },
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(GalleryNodeView, {
      // Let the node view own drag events over the spread row: ProseMirror
      // would otherwise handle the drop first (native listener on the editor
      // DOM fires before React's delegated one) and insert the drop as a new
      // block instead of filling a slot. Plate dragstarts stay with the node
      // view too (in-spread reorder) — dragging the row's outline/gutter area
      // still moves the whole spread.
      stopEvent: ({ event }) => {
        if (!(event.target instanceof Element)) return false;
        if (event.type === "dragstart") return !!event.target.closest(".post-gallery-plate");
        return (
          (event.type === "drop" || event.type === "dragover" || event.type === "dragenter") &&
          !!event.target.closest(".post-gallery-row")
        );
      },
    });
  },
});
