"use client";

import {
  ArrowLeft,
  ArrowsOutLineHorizontal,
  Check,
  CloudArrowUp,
  Code as CodeIcon,
  DownloadSimple,
  Eye,
  LinkSimple,
  PencilSimple,
  Rectangle,
  RectangleDashed,
  TextB,
  TextHTwo,
  TextItalic,
  Trash,
} from "@phosphor-icons/react";
import LinkExtension from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { type Editor, EditorContent, useEditor, useEditorState } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Markdown } from "tiptap-markdown";
import { createMicroblog, updateMicroblog } from "@/actions/microblogs";
import { ImageUpload } from "@/components/ImageUpload";
import { type ImageWidth, PostImage } from "@/components/post-editor/extensions/PostImage";
import { SlashCommand } from "@/components/post-editor/extensions/slashCommand";
import { PostPreview } from "@/components/post-editor/PostPreview";
import { TagPicker } from "@/components/TagPicker";
import { uploadToCloudinary } from "@/lib/cloudinary";

const microblogTags = [
  "tech",
  "life",
  "thoughts",
  "coding",
  "design",
  "career",
  "learning",
  "tools",
  "opinion",
  "tip",
];

export interface PostEditorInitial {
  title: string;
  content: string;
  imageUrl: string;
  tags: string;
  published: boolean;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "post"
  );
}

export function PostEditor({ postId, initial }: { postId?: number; initial: PostEditorInitial }) {
  const router = useRouter();

  const [id, setId] = useState<number | undefined>(postId);
  const [title, setTitle] = useState(initial.title);
  const [content, setContent] = useState(initial.content);
  const [imageUrl, setImageUrl] = useState(initial.imageUrl);
  const [tags, setTags] = useState(initial.tags);
  const [published, setPublished] = useState(initial.published);

  const [preview, setPreview] = useState(false);
  const [metaOpen, setMetaOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [imageDialog, setImageDialog] = useState(false);
  const [status, setStatus] = useState<SaveStatus>("idle");

  const imageDialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow the title box so it matches the preview <h1> (no layout shift).
  const growTitle = useCallback(() => {
    const el = titleRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);
  useEffect(() => {
    if (!preview) growTitle();
  }, [preview, title, growTitle]);

  // Keep the newest values reachable from debounced callbacks without stale closures.
  const stateRef = useRef({ id, title, content, imageUrl, tags, published });
  stateRef.current = { id, title, content, imageUrl, tags, published };
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);

  const uploadAndInsert = useCallback(async (editor: Editor | null, file: File) => {
    if (!editor) return;
    const toastId = toast.loading("Uploading image…");
    try {
      const url = await uploadToCloudinary(file);
      editor.chain().focus().setImage({ src: url }).run();
      toast.success("Image added", { id: toastId });
    } catch {
      toast.error("Upload failed", { id: toastId });
    }
  }, []);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: false,
      }),
      LinkExtension.configure({ openOnClick: false }),
      PostImage,
      Placeholder.configure({
        placeholder: "Write, or press '/' for blocks…",
      }),
      Markdown.configure({
        html: true,
        transformPastedText: true,
        breaks: false,
      }),
      SlashCommand.configure({ onImage: () => setImageDialog(true) }),
    ],
    content: initial.content,
    editorProps: {
      attributes: {
        class: "post-editor-content focus:outline-none min-h-[60vh]",
      },
      handlePaste: (view, event) => {
        const file = Array.from(event.clipboardData?.files ?? []).find((f) =>
          f.type.startsWith("image/"),
        );
        if (file) {
          event.preventDefault();
          uploadAndInsert(editor, file);
          return true;
        }
        return false;
      },
      handleDrop: (view, event) => {
        const dt = (event as DragEvent).dataTransfer;
        const file = Array.from(dt?.files ?? []).find((f) => f.type.startsWith("image/"));
        if (file) {
          event.preventDefault();
          uploadAndInsert(editor, file);
          return true;
        }
        return false;
      },
    },
    onCreate: ({ editor }) => {
      // ProseMirror's default selection lands on the first node; when that node
      // is an image it shows up pre-selected for editing. Collapse to a caret so
      // nothing is selected on load.
      editor.commands.setTextSelection(0);
    },
    onUpdate: ({ editor }) => {
      const md = (
        editor.storage as unknown as { markdown: { getMarkdown: () => string } }
      ).markdown.getMarkdown();
      setContent(md);
    },
  });

  // Open the image dialog when triggered by the slash command.
  useEffect(() => {
    if (imageDialog) imageDialogRef.current?.showModal();
  }, [imageDialog]);

  // A node-selected image keeps its selection (and outline) after the editor
  // blurs, so clicking away wouldn't clear it. Collapse the node selection on
  // any outside click — but not on the image's own bubble menu, whose width
  // buttons need the selection to stay put.
  useEffect(() => {
    if (!editor) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (editor.view.dom.contains(target)) return;
      if (target.closest("[data-bubble-menu]")) return;
      const sel = editor.state.selection;
      if ("node" in sel) editor.commands.setTextSelection(sel.from);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [editor]);

  const doSave = useCallback(async (opts?: { publishOverride?: boolean; silent?: boolean }) => {
    const cur = stateRef.current;
    const publishedNow = opts?.publishOverride ?? cur.published;
    const isEmpty = !cur.title.trim() && !cur.content.trim();
    if (isEmpty) return; // don't persist a blank post
    if (savingRef.current) return;

    savingRef.current = true;
    setStatus("saving");
    const data = {
      title: cur.title.trim() || "Untitled",
      content: cur.content.trim() || " ",
      imageUrl: cur.imageUrl || null,
      tags: cur.tags || null,
      published: publishedNow,
    };
    try {
      if (cur.id) {
        await updateMicroblog(cur.id, data);
      } else {
        const { id: newId } = await createMicroblog(data);
        setId(newId);
        window.history.replaceState(null, "", `/admin/microblogs/${newId}/edit`);
      }
      setStatus("saved");
      if (!opts?.silent) toast.success(publishedNow ? "Published" : "Saved");
    } catch {
      setStatus("error");
      if (!opts?.silent) toast.error("Failed to save");
    } finally {
      savingRef.current = false;
    }
  }, []);

  // Debounced autosave whenever a tracked field changes. doSave reads the
  // latest values from stateRef and is stable, so it isn't a dependency.
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => doSave({ silent: true }), 1300);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [title, content, imageUrl, tags, doSave]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  const handlePublish = useCallback(async () => {
    const next = !stateRef.current.published;
    setPublished(next);
    stateRef.current.published = next;
    await doSave({ publishOverride: next });
  }, [doSave]);

  const insertImage = useCallback(
    (url: string) => {
      editor?.chain().focus().setImage({ src: url }).run();
      imageDialogRef.current?.close();
      setImageDialog(false);
    },
    [editor],
  );

  const setImageWidth = useCallback(
    (width: ImageWidth) => {
      editor?.chain().focus().updateAttributes("image", { width }).run();
    },
    [editor],
  );

  const addLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href;
    const url = window.prompt("URL", prev || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const exportMarkdown = useCallback(() => {
    const md = `# ${stateRef.current.title || "Untitled"}\n\n${stateRef.current.content}`;
    const blob = new Blob([md], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${slugify(stateRef.current.title)}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
    setExportOpen(false);
  }, []);

  const exportPdf = useCallback(() => {
    setExportOpen(false);
    setPreview(true);
    // Let the preview paint before invoking the print dialog.
    requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
  }, []);

  const statusLabel =
    status === "saving"
      ? "Saving…"
      : status === "saved"
        ? "Saved"
        : status === "error"
          ? "Save failed"
          : id
            ? "Saved"
            : "Draft";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg text-fg">
      {/* Top bar */}
      <header className="no-print flex h-14 shrink-0 items-center justify-between gap-3 border-b border-hairline px-3 md:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/admin/microblogs")}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-fg/60 hover:bg-hover-bg hover:text-fg transition-colors"
          >
            <ArrowLeft weight="thin" className="h-4 w-4" />
            <span className="hidden sm:inline">Posts</span>
          </button>
          <span className="flex items-center gap-1.5 text-[11px] text-fg/40">
            {status === "saving" ? (
              <CloudArrowUp weight="thin" className="h-3.5 w-3.5" />
            ) : status === "error" ? (
              <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
            ) : (
              <Check weight="thin" className="h-3.5 w-3.5" />
            )}
            {statusLabel}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPreview((p) => !p)}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
              preview ? "bg-hover-bg text-fg" : "text-fg/60 hover:bg-hover-bg hover:text-fg"
            }`}
          >
            {preview ? (
              <PencilSimple weight="thin" className="h-4 w-4" />
            ) : (
              <Eye weight="thin" className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">{preview ? "Edit" : "Preview"}</span>
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setExportOpen((o) => !o)}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-fg/60 hover:bg-hover-bg hover:text-fg transition-colors"
            >
              <DownloadSimple weight="thin" className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
            {exportOpen && (
              <>
                <button
                  type="button"
                  aria-label="Close export menu"
                  className="fixed inset-0 z-10 cursor-default"
                  onClick={() => setExportOpen(false)}
                />
                <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-xl border border-nav-border bg-bg p-1 shadow-2xl">
                  <button
                    type="button"
                    onClick={exportMarkdown}
                    className="block w-full rounded-lg px-2.5 py-1.5 text-left text-xs text-fg/80 hover:bg-hover-bg transition-colors"
                  >
                    Markdown (.md)
                  </button>
                  <button
                    type="button"
                    onClick={exportPdf}
                    className="block w-full rounded-lg px-2.5 py-1.5 text-left text-xs text-fg/80 hover:bg-hover-bg transition-colors"
                  >
                    PDF (print)
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMetaOpen((o) => !o)}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
              metaOpen ? "bg-hover-bg text-fg" : "text-fg/60 hover:bg-hover-bg hover:text-fg"
            }`}
          >
            <RectangleDashed weight="thin" className="h-4 w-4" />
            <span className="hidden sm:inline">Details</span>
          </button>

          <button
            type="button"
            onClick={handlePublish}
            className={`ml-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              published ? "bg-hover-bg text-fg/70 hover:text-fg" : "bg-fg text-bg hover:opacity-90"
            }`}
          >
            {published ? "Unpublish" : "Publish"}
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="relative flex-1 overflow-y-auto overflow-x-hidden">
        <div className="post-print mx-auto max-w-[720px] px-5 py-10 md:py-14">
          {preview ? (
            <article>
              <h1 className="m-0 p-0 font-heading text-3xl leading-tight">{title || "Untitled"}</h1>
              {imageUrl && <img src={imageUrl} alt="" className="mt-6 w-full rounded-lg" />}
              <PostPreview content={content} className="mt-6 text-fg/80" />
            </article>
          ) : (
            <>
              <textarea
                ref={titleRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    editor?.chain().focus().run();
                  }
                }}
                rows={1}
                placeholder="Untitled"
                className="block w-full resize-none overflow-hidden m-0 p-0 bg-transparent font-heading text-3xl leading-tight text-fg placeholder-fg/20 focus:outline-none"
              />
              <div className="mt-6">
                <EditorContent editor={editor} />
              </div>
            </>
          )}
        </div>

        {/* Bubble menu: inline text formatting + image width */}
        {editor && (
          <BubbleMenu
            editor={editor}
            options={{ placement: "top" }}
            shouldShow={({ editor, state }) => {
              if (preview) return false;
              if (editor.isActive("image")) return true;
              return !state.selection.empty;
            }}
          >
            <BubbleContent editor={editor} onImageWidth={setImageWidth} onAddLink={addLink} />
          </BubbleMenu>
        )}
      </div>

      {/* Details / meta panel */}
      {metaOpen && (
        <>
          <button
            type="button"
            aria-label="Close details"
            className="no-print fixed inset-0 z-40 bg-black/20"
            onClick={() => setMetaOpen(false)}
          />
          <aside className="no-print fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col gap-6 overflow-y-auto border-l border-hairline bg-bg p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-sm">Post details</h2>
              <button
                type="button"
                onClick={() => setMetaOpen(false)}
                className="rounded-lg px-2 py-1 text-xs text-fg/60 hover:bg-hover-bg"
              >
                Done
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-fg/50">Status</label>
              <button
                type="button"
                onClick={() => setPublished((p) => !p)}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                  published ? "bg-fg text-bg" : "bg-hover-bg text-fg/50 hover:text-fg"
                }`}
              >
                {published ? "● Published" : "○ Draft"}
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-fg/50">Tags</label>
              <TagPicker value={tags ?? ""} onChange={setTags} tags={microblogTags} />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-fg/50">Cover image</label>
              <ImageUpload
                value={imageUrl}
                onChange={setImageUrl}
                onRemove={() => setImageUrl("")}
                onFilePending={async (file) => {
                  if (!file) return;
                  try {
                    const url = await uploadToCloudinary(file);
                    setImageUrl(url);
                  } catch {
                    toast.error("Upload failed");
                  }
                }}
              />
            </div>
          </aside>
        </>
      )}

      {/* Image insert dialog */}
      <dialog
        ref={imageDialogRef}
        onClose={() => setImageDialog(false)}
        className="bg-transparent backdrop:bg-black/50"
      >
        <div className="w-80 rounded-xl border border-nav-border bg-bg p-4 shadow-2xl">
          <p className="mb-3 text-xs font-medium text-fg">Insert image</p>
          <ImageUpload
            onChange={insertImage}
            onFilePending={async (file) => {
              if (!file) return;
              await uploadAndInsert(editor, file);
              imageDialogRef.current?.close();
              setImageDialog(false);
            }}
          />
          <button
            type="button"
            onClick={() => {
              imageDialogRef.current?.close();
              setImageDialog(false);
            }}
            className="mt-3 text-xs text-fg/60 hover:text-fg transition-colors"
          >
            Cancel
          </button>
        </div>
      </dialog>
    </div>
  );
}

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
function BubbleContent({
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
      h2: editor.isActive("heading", { level: 2 }),
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
            active={s?.h2}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <TextHTwo weight="thin" className="h-4 w-4" />
          </BubbleBtn>
        </>
      )}
    </div>
  );
}
