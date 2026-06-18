"use client";

import { useCallback, useRef, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExtension from "@tiptap/extension-link";
import ImageExtension from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import {
  ListBullets,
  ListNumbers,
  LinkSimple,
  Image,
} from "@phosphor-icons/react";
import { ImageUpload } from "@/components/ImageUpload";

interface ContentEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function ContentEditor({
  content,
  onChange,
  placeholder,
}: ContentEditorProps) {
  const imageDialogRef = useRef<HTMLDialogElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      LinkExtension.configure({
        openOnClick: false,
      }),
      ImageExtension,
      Placeholder.configure({
        placeholder: placeholder || "Start writing...",
      }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          "prose prose-invert max-w-none focus:outline-none min-h-[200px] px-4 py-3 text-sm text-fg",
      },
    },
  });

  const lastContent = useRef(content);
  useEffect(() => {
    if (editor && content !== lastContent.current) {
      lastContent.current = content;
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  const handleImageInserted = useCallback(
    (url: string) => {
      editor?.chain().focus().setImage({ src: url }).run();
      imageDialogRef.current?.close();
    },
    [editor]
  );

  const addLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  const btn = (
    active: boolean | undefined,
    onClick: () => void,
    label: string
  ) => (
    <button
      type="button"
      onClick={onClick}
      className={`px-2 py-1 rounded text-xs leading-none transition-colors ${
        active
          ? "bg-nav-active-bg text-nav-active-text"
          : "text-nav-text hover:text-nav-text-hover hover:bg-nav-hover-bg"
      }`}
    >
      {label}
    </button>
  );

  const iconBtn = (
    active: boolean | undefined,
    onClick: () => void,
    label: string,
    Icon: typeof ListBullets
  ) => (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center px-2 py-1 rounded text-xs transition-colors ${
        active
          ? "bg-nav-active-bg text-nav-active-text"
          : "text-nav-text hover:text-nav-text-hover hover:bg-nav-hover-bg"
      }`}
      title={label}
    >
      <Icon weight="thin" className="w-3.5 h-3.5" />
    </button>
  );

  return (
    <div className="border border-nav-border rounded-xl overflow-hidden bg-nav-hover-bg/30">
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-nav-border bg-nav-bg/30 flex-wrap">
        {btn(editor.isActive("bold"), () => editor.chain().focus().toggleBold().run(), "B")}
        {btn(editor.isActive("italic"), () => editor.chain().focus().toggleItalic().run(), "I")}

        <div className="w-px h-4 mx-1 bg-nav-border" />

        {btn(
          editor.isActive("heading", { level: 2 }),
          () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
          "H2"
        )}
        {btn(
          editor.isActive("heading", { level: 3 }),
          () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
          "H3"
        )}

        <div className="w-px h-4 mx-1 bg-nav-border" />

        {iconBtn(
          editor.isActive("bulletList"),
          () => editor.chain().focus().toggleBulletList().run(),
          "Bullet list",
          ListBullets
        )}
        {iconBtn(
          editor.isActive("orderedList"),
          () => editor.chain().focus().toggleOrderedList().run(),
          "Ordered list",
          ListNumbers
        )}

        <div className="w-px h-4 mx-1 bg-nav-border" />

        {iconBtn(
          editor.isActive("link"),
          addLink,
          "Link",
          LinkSimple
        )}
        {iconBtn(
          false,
          () => imageDialogRef.current?.showModal(),
          "Image",
          Image
        )}
      </div>

      <EditorContent editor={editor} />

      <dialog
        ref={imageDialogRef}
        className="bg-transparent backdrop:bg-bg/60"
      >
        <div className="w-80 bg-bg border border-nav-border rounded-xl shadow-2xl p-4">
          <p className="text-xs font-medium text-fg mb-3">Insert Image</p>
          <ImageUpload onUpload={handleImageInserted} />
          <button
            type="button"
            onClick={() => imageDialogRef.current?.close()}
            className="mt-3 text-xs text-nav-text hover:text-nav-text-hover transition-colors"
          >
            Cancel
          </button>
        </div>
      </dialog>
    </div>
  );
}
