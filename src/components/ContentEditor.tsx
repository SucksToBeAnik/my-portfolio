"use client";

import { useCallback, useRef, useState } from "react";
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
  Sparkle,
} from "@phosphor-icons/react";
import { ImageUpload } from "@/components/ImageUpload";
import { uploadToCloudinary } from "@/lib/cloudinary";

interface ContentEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  generateContext?: { title?: string; type: string };
}

export function ContentEditor({
  content,
  onChange,
  placeholder,
  generateContext,
}: ContentEditorProps) {
  const imageDialogRef = useRef<HTMLDialogElement>(null);
  const [generating, setGenerating] = useState(false);

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
          "editor-content focus:outline-none min-h-[200px] px-4 py-3 text-sm text-fg",
      },
    },
  });

  const handleImageInserted = useCallback(
    (url: string) => {
      editor?.chain().focus().setImage({ src: url }).run();
      imageDialogRef.current?.close();
    },
    [editor]
  );

  const handleFileUpload = useCallback(
    async (file: File | null) => {
      if (!file) return;
      try {
        const url = await uploadToCloudinary(file);
        editor?.chain().focus().setImage({ src: url }).run();
        imageDialogRef.current?.close();
      } catch {
        // silently fail
      }
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

  const handleGenerate = useCallback(async () => {
    if (!editor || !generateContext || generating) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...generateContext, existing: editor.getHTML() }),
      });
      const data = await res.json();
      if (data.html) {
        editor.chain().focus().setContent(data.html, { emitUpdate: false }).run();
        onChange(data.html);
      }
    } catch {
      // silently fail
    } finally {
      setGenerating(false);
    }
  }, [editor, generateContext, generating, onChange]);

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

        {generateContext && (
          <>
            <div className="w-px h-4 mx-1 bg-nav-border" />
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs text-nav-text hover:text-nav-text-hover hover:bg-nav-hover-bg transition-colors disabled:opacity-50"
              title="Generate content with AI"
            >
              <Sparkle weight="thin" className="w-3.5 h-3.5" />
              {generating ? "..." : "Auto"}
            </button>
          </>
        )}
      </div>

      <EditorContent editor={editor} />

      <dialog
        ref={imageDialogRef}
        className="bg-transparent backdrop:bg-bg/60"
      >
        <div className="w-80 bg-bg border border-nav-border rounded-xl shadow-2xl p-4">
          <p className="text-xs font-medium text-fg mb-3">Insert Image</p>
          <ImageUpload onChange={handleImageInserted} onFilePending={handleFileUpload} />
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
