"use client";

import {
  ArrowsOutLineHorizontal,
  Code as CodeIcon,
  LinkSimple,
  Rectangle,
  RectangleDashed,
  TextB,
  TextHOne,
  TextHThree,
  TextHTwo,
  TextItalic,
  Trash,
} from "@phosphor-icons/react";
import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import type { ImageWidth } from "@/components/post-editor/extensions/PostImage";

function BubbleBtn({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center rounded px-2 py-1 transition-colors ${
        active ? "bg-nav-active-bg text-nav-active-text" : "text-fg/70 hover:bg-hover-bg"
      }`}
    >
      {children}
    </button>
  );
}

// Subscribes to the live editor selection via useEditorState so the toolbar
// always reflects the current node/marks. Reading editor.isActive() directly in
// render is stale (v3 useEditor doesn't re-render on every selection change),
// which made the image vs. text controls flicker between the two.
export function EditorBubbleMenu({
  editor,
  onImageWidth,
  onAddLink,
}: {
  editor: Editor;
  onImageWidth: (w: ImageWidth) => void;
  onAddLink: () => void;
}) {
  const s = useEditorState({
    editor,
    selector: ({ editor }) => ({
      isImage: editor.isActive("image"),
      imageWidth: (editor.getAttributes("image").width ?? "normal") as ImageWidth,
      bold: editor.isActive("bold"),
      italic: editor.isActive("italic"),
      code: editor.isActive("code"),
      link: editor.isActive("link"),
      h1: editor.isActive("heading", { level: 1 }),
      h2: editor.isActive("heading", { level: 2 }),
      h3: editor.isActive("heading", { level: 3 }),
    }),
  });

  return (
    <div
      data-bubble-menu
      className="flex items-center gap-0.5 rounded-lg border border-nav-border bg-bg p-1 shadow-2xl"
    >
      {s?.isImage ? (
        <>
          {(
            [
              ["normal", Rectangle, "Normal"],
              ["wide", ArrowsOutLineHorizontal, "Wide"],
              ["full", RectangleDashed, "Full-bleed"],
            ] as const
          ).map(([w, Icon, label]) => (
            <button
              key={w}
              type="button"
              title={label}
              onClick={() => onImageWidth(w)}
              className={`flex items-center rounded px-2 py-1 transition-colors ${
                s.imageWidth === w
                  ? "bg-nav-active-bg text-nav-active-text"
                  : "text-fg/70 hover:bg-hover-bg"
              }`}
            >
              <Icon weight="thin" className="h-4 w-4" />
            </button>
          ))}
          <div className="mx-0.5 h-4 w-px bg-nav-border" />
          <button
            type="button"
            title="Remove image"
            onClick={() => editor.chain().focus().deleteSelection().run()}
            className="flex items-center rounded px-2 py-1 text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash weight="thin" className="h-4 w-4" />
          </button>
        </>
      ) : (
        <>
          <BubbleBtn active={s?.bold} onClick={() => editor.chain().focus().toggleBold().run()}>
            <TextB weight="bold" className="h-4 w-4" />
          </BubbleBtn>
          <BubbleBtn active={s?.italic} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <TextItalic weight="bold" className="h-4 w-4" />
          </BubbleBtn>
          <BubbleBtn active={s?.code} onClick={() => editor.chain().focus().toggleCode().run()}>
            <CodeIcon weight="thin" className="h-4 w-4" />
          </BubbleBtn>
          <BubbleBtn active={s?.link} onClick={onAddLink}>
            <LinkSimple weight="thin" className="h-4 w-4" />
          </BubbleBtn>
          <div className="mx-0.5 h-4 w-px bg-nav-border" />
          <BubbleBtn
            active={s?.h1}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          >
            <TextHOne weight="thin" className="h-4 w-4" />
          </BubbleBtn>
          <BubbleBtn
            active={s?.h2}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <TextHTwo weight="thin" className="h-4 w-4" />
          </BubbleBtn>
          <BubbleBtn
            active={s?.h3}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            <TextHThree weight="thin" className="h-4 w-4" />
          </BubbleBtn>
        </>
      )}
    </div>
  );
}
