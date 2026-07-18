"use client";

import {
  Code,
  Image as ImageIcon,
  ListBullets,
  ListNumbers,
  Minus,
  Quotes,
  TextHOne,
  TextHTwo,
  TextT,
  VideoCamera,
} from "@phosphor-icons/react";
import { type Editor, Extension, type Range, ReactRenderer } from "@tiptap/react";
import Suggestion, { type SuggestionOptions, type SuggestionProps } from "@tiptap/suggestion";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";

export interface SlashActionCtx {
  editor: Editor;
  range: Range;
  onImage: () => void;
  onVideo: () => void;
}

interface SlashItem {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  aliases?: string[];
  action: (ctx: SlashActionCtx) => void;
}

const ITEMS: SlashItem[] = [
  {
    title: "Text",
    subtitle: "Plain paragraph",
    icon: TextT,
    aliases: ["paragraph", "body"],
    action: ({ editor, range }) => editor.chain().focus().deleteRange(range).setParagraph().run(),
  },
  {
    title: "Heading",
    subtitle: "Section heading",
    icon: TextHOne,
    aliases: ["h2", "title"],
    action: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run(),
  },
  {
    title: "Subheading",
    subtitle: "Smaller heading",
    icon: TextHTwo,
    aliases: ["h3"],
    action: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 3 }).run(),
  },
  {
    title: "Bullet list",
    subtitle: "Unordered list",
    icon: ListBullets,
    aliases: ["ul", "unordered"],
    action: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleBulletList().run(),
  },
  {
    title: "Numbered list",
    subtitle: "Ordered list",
    icon: ListNumbers,
    aliases: ["ol", "ordered"],
    action: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
  },
  {
    title: "Quote",
    subtitle: "Block quote",
    icon: Quotes,
    aliases: ["blockquote"],
    action: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
  },
  {
    title: "Code",
    subtitle: "Code block",
    icon: Code,
    aliases: ["codeblock", "pre"],
    action: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
  },
  {
    title: "Divider",
    subtitle: "Horizontal rule",
    icon: Minus,
    aliases: ["hr", "rule", "separator"],
    action: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
  },
  {
    title: "Image",
    subtitle: "Upload or embed",
    icon: ImageIcon,
    aliases: ["img", "photo", "picture"],
    action: ({ editor, range, onImage }) => {
      editor.chain().focus().deleteRange(range).run();
      onImage();
    },
  },
];

// Included only when the editor wires `onVideo` (see SlashCommand options).
const VIDEO_ITEM: SlashItem = {
  title: "Video",
  subtitle: "Upload or embed",
  icon: VideoCamera,
  aliases: ["vid", "movie", "clip", "mp4"],
  action: ({ editor, range, onVideo }) => {
    editor.chain().focus().deleteRange(range).run();
    onVideo();
  },
};

interface ListProps {
  items: SlashItem[];
  command: (item: SlashItem) => void;
}

const SlashList = forwardRef<{ onKeyDown: (o: { event: KeyboardEvent }) => boolean }, ListProps>(
  ({ items, command }, ref) => {
    const [selected, setSelected] = useState(0);

    useEffect(() => setSelected(0), [items]);

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (event.key === "ArrowUp") {
          setSelected((s) => (s + items.length - 1) % items.length);
          return true;
        }
        if (event.key === "ArrowDown") {
          setSelected((s) => (s + 1) % items.length);
          return true;
        }
        if (event.key === "Enter") {
          if (items[selected]) command(items[selected]);
          return true;
        }
        return false;
      },
    }));

    if (items.length === 0) {
      return (
        <div className="w-60 rounded-xl border border-nav-border bg-bg shadow-2xl p-2 text-xs text-fg/40">
          No matches
        </div>
      );
    }

    return (
      <div
        data-slash-menu
        className="w-64 rounded-xl border border-nav-border bg-bg shadow-2xl p-1.5"
      >
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <button
              key={item.title}
              type="button"
              onMouseEnter={() => setSelected(i)}
              onClick={() => command(item)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors ${
                i === selected ? "bg-hover-bg" : "hover:bg-hover-bg"
              }`}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-hairline">
                <Icon weight="thin" className="h-4 w-4 text-fg/70" />
              </span>
              <span className="min-w-0">
                <span className="block text-xs text-fg">{item.title}</span>
                <span className="block text-[11px] text-fg/40 truncate">{item.subtitle}</span>
              </span>
            </button>
          );
        })}
      </div>
    );
  },
);
SlashList.displayName = "SlashList";

const POPUP_WIDTH = 264;

// Position the menu at the caret using viewport-fixed coordinates. Flip above
// the caret when there isn't enough room below, and clamp its height to the
// available space so the list stays scrollable instead of running off-screen.
function positionPopup(popup: HTMLElement, rect: DOMRect | null) {
  if (!rect) return;
  const margin = 6;
  const vh = window.innerHeight;
  const vw = window.innerWidth;

  const menu = popup.querySelector<HTMLElement>("[data-slash-menu]");
  const spaceBelow = vh - rect.bottom - margin;
  const spaceAbove = rect.top - margin;
  const flipUp = spaceBelow < 220 && spaceAbove > spaceBelow;
  const avail = Math.max(140, flipUp ? spaceAbove : spaceBelow);

  if (menu) {
    menu.style.maxHeight = `${Math.min(340, avail)}px`;
    menu.style.overflowY = "auto";
    menu.style.overscrollBehavior = "contain";
  }

  // Anchor vertically so the menu always grows into the free space. When
  // flipping up, pin the popup's BOTTOM just above the caret and let it expand
  // upward — this avoids relying on the menu's rendered height, which reads as 0
  // on the first paint and otherwise leaves the menu anchored at the caret and
  // running off the bottom of the screen.
  if (flipUp) {
    popup.style.top = "auto";
    popup.style.bottom = `${vh - rect.top + margin}px`;
  } else {
    popup.style.bottom = "auto";
    popup.style.top = `${rect.bottom + margin}px`;
  }

  let left = rect.left;
  if (left + POPUP_WIDTH > vw - margin) left = vw - POPUP_WIDTH - margin;
  popup.style.left = `${Math.max(margin, left)}px`;
}

// `trigger.typed` is set true only when the user actually presses "/". That's
// what makes this behave like Notion: the menu opens on a fresh keystroke, but
// never reappears just because the caret moved onto an existing "/" somewhere.
type Trigger = { typed: boolean };
type ListRenderer = ReactRenderer<
  { onKeyDown: (o: { event: KeyboardEvent }) => boolean },
  ListProps
>;

function createRender(trigger: Trigger): SuggestionOptions<SlashItem>["render"] {
  return () => {
    let component: ListRenderer | null = null;
    let popup: HTMLDivElement | null = null;
    let onOutside: ((e: PointerEvent) => void) | null = null;

    const close = () => {
      if (onOutside) {
        document.removeEventListener("pointerdown", onOutside, true);
        onOutside = null;
      }
      popup?.remove();
      popup = null;
      component?.destroy();
      component = null;
    };

    const open = (props: SuggestionProps<SlashItem>) => {
      component = new ReactRenderer(SlashList, {
        props: { items: props.items, command: (item: SlashItem) => props.command(item) },
        editor: props.editor,
      });
      popup = document.createElement("div");
      popup.style.position = "fixed";
      popup.style.zIndex = "60";
      document.body.appendChild(popup);
      popup.appendChild(component.element);
      positionPopup(popup, props.clientRect?.() ?? null);

      onOutside = (e) => {
        if (popup && !popup.contains(e.target as Node)) close();
      };
      document.addEventListener("pointerdown", onOutside, true);
    };

    return {
      onStart: (props) => {
        const typed = trigger.typed;
        trigger.typed = false;
        if (!typed) return; // only open when "/" was just typed
        open(props);
      },
      onUpdate: (props) => {
        if (!popup || !component) return; // stayed closed — nothing to track
        component.updateProps({
          items: props.items,
          command: (item: SlashItem) => props.command(item),
        });
        positionPopup(popup, props.clientRect?.() ?? null);
      },
      onKeyDown: (props) => {
        if (props.event.key === "Escape") {
          close();
          return true;
        }
        if (!popup) return false;
        return component?.ref?.onKeyDown({ event: props.event }) ?? false;
      },
      onExit: () => {
        trigger.typed = false;
        close();
      },
    };
  };
}

interface SlashStorage {
  trigger: Trigger;
  keydown: ((e: KeyboardEvent) => void) | null;
}

export const SlashCommand = Extension.create<
  { onImage: () => void; onVideo?: () => void },
  SlashStorage
>({
  name: "slashCommand",

  addOptions() {
    return { onImage: () => {}, onVideo: undefined };
  },

  addStorage() {
    return { trigger: { typed: false }, keydown: null };
  },

  // Record whether the last keystroke was "/" so the menu opens on a fresh
  // slash keypress only, never when the caret navigates onto an existing one.
  onCreate() {
    const dom = this.editor.view.dom;
    const handler = (e: KeyboardEvent) => {
      this.storage.trigger.typed = e.key === "/";
    };
    dom.addEventListener("keydown", handler);
    this.storage.keydown = handler;
  },

  onDestroy() {
    if (this.storage.keydown) {
      this.editor.view.dom.removeEventListener("keydown", this.storage.keydown);
      this.storage.keydown = null;
    }
  },

  addProseMirrorPlugins() {
    const onImage = () => this.options.onImage();
    const onVideoOpt = this.options.onVideo;
    const onVideo = () => onVideoOpt?.();
    const availableItems = onVideoOpt ? [...ITEMS, VIDEO_ITEM] : ITEMS;
    return [
      Suggestion<SlashItem>({
        editor: this.editor,
        char: "/",
        allowSpaces: false,
        startOfLine: false,
        command: ({ editor, range, props }) => props.action({ editor, range, onImage, onVideo }),
        items: ({ query }) => {
          const q = query.toLowerCase();
          return availableItems.filter(
            (item) =>
              item.title.toLowerCase().includes(q) || item.aliases?.some((a) => a.includes(q)),
          );
        },
        render: createRender(this.storage.trigger),
      }),
    ];
  },
});
