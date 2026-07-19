"use client";

import {
  ArrowLeft,
  Check,
  CloudArrowUp,
  DownloadSimple,
  EyeSlash,
  Globe,
  RectangleDashed,
} from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import LinkExtension from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { type Editor, EditorContent, useEditor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Markdown } from "tiptap-markdown";
import { createProject, updateProject } from "@/actions/projects";
import { EditPreviewToggle } from "@/components/EditPreviewToggle";
import { ImageUpload } from "@/components/ImageUpload";
import { PostToc } from "@/components/PostToc";
import { EditorBubbleMenu } from "@/components/post-editor/EditorBubbleMenu";
import { CodeBlockTab } from "@/components/post-editor/extensions/codeBlockTab";
import { type ImageWidth, PostImage } from "@/components/post-editor/extensions/PostImage";
import { SlashCommand } from "@/components/post-editor/extensions/slashCommand";
import { PostPreview } from "@/components/post-editor/PostPreview";
import { TagPicker } from "@/components/TagPicker";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { extractHeadings } from "@/lib/toc";

const projectTags = [
  "web",
  "mobile",
  "ai",
  "tool",
  "open-source",
  "backend",
  "frontend",
  "design",
  "experiment",
];

export interface ProjectEditorInitial {
  title: string;
  content: string;
  microview: string;
  tags: string;
  published: boolean;
  featured: boolean;
  imageUrl: string;
  url: string;
  githubUrl: string;
  workedOn: string;
}

const MICROVIEW_MAX = 180;

type SaveStatus = "idle" | "saving" | "saved" | "error";

function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "project"
  );
}

export function ProjectEditor({
  projectId,
  initial,
}: {
  projectId?: number;
  initial: ProjectEditorInitial;
}) {
  const router = useRouter();
  const qc = useQueryClient();

  const [id, setId] = useState<number | undefined>(projectId);
  const [title, setTitle] = useState(initial.title);
  const [content, setContent] = useState(initial.content);
  const [microview, setMicroview] = useState(initial.microview);
  const [tags, setTags] = useState(initial.tags);
  const [published, setPublished] = useState(initial.published);
  const [featured, setFeatured] = useState(initial.featured);
  const [imageUrl, setImageUrl] = useState(initial.imageUrl);
  const [url, setUrl] = useState(initial.url);
  const [githubUrl, setGithubUrl] = useState(initial.githubUrl);
  const [workedOn, setWorkedOn] = useState(initial.workedOn);

  const [preview, setPreview] = useState(false);
  const [metaOpen, setMetaOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [imageDialog, setImageDialog] = useState(false);
  const [videoDialog, setVideoDialog] = useState(false);
  const [status, setStatus] = useState<SaveStatus>("idle");

  const imageDialogRef = useRef<HTMLDialogElement>(null);
  const videoDialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Section list for the preview TOC, recomputed as the draft content changes.
  const headings = useMemo(() => extractHeadings(content), [content]);

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
  const stateRef = useRef({
    id,
    title,
    content,
    microview,
    tags,
    published,
    featured,
    imageUrl,
    url,
    githubUrl,
    workedOn,
  });
  stateRef.current = {
    id,
    title,
    content,
    microview,
    tags,
    published,
    featured,
    imageUrl,
    url,
    githubUrl,
    workedOn,
  };
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);

  // Images and videos ride the same node/markdown pipeline — a video is just an
  // image node whose src points at a video file (see imageTitle.isVideoSrc).
  const uploadAndInsert = useCallback(async (editor: Editor | null, file: File) => {
    if (!editor) return;
    const isVideo = file.type.startsWith("video/");
    const toastId = toast.loading(isVideo ? "Uploading video…" : "Uploading image…");
    try {
      const url = await uploadToCloudinary(file, isVideo ? "video" : "image");
      editor.chain().focus().setImage({ src: url }).run();
      toast.success(isVideo ? "Video added" : "Image added", { id: toastId });
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
        placeholder: "Write the deep-dive, or press '/' for blocks…",
      }),
      Markdown.configure({
        html: true,
        transformPastedText: true,
        breaks: false,
      }),
      SlashCommand.configure({
        onImage: () => setImageDialog(true),
        onVideo: () => setVideoDialog(true),
      }),
      CodeBlockTab,
    ],
    content: initial.content,
    editorProps: {
      attributes: {
        class: "post-editor-content focus:outline-none min-h-[60vh]",
      },
      handlePaste: (_view, event) => {
        const file = Array.from(event.clipboardData?.files ?? []).find(
          (f) => f.type.startsWith("image/") || f.type.startsWith("video/"),
        );
        if (file) {
          event.preventDefault();
          uploadAndInsert(editor, file);
          return true;
        }
        return false;
      },
      handleDrop: (_view, event) => {
        const dt = (event as DragEvent).dataTransfer;
        const file = Array.from(dt?.files ?? []).find(
          (f) => f.type.startsWith("image/") || f.type.startsWith("video/"),
        );
        if (file) {
          event.preventDefault();
          uploadAndInsert(editor, file);
          return true;
        }
        return false;
      },
    },
    onCreate: ({ editor }) => {
      editor.commands.setTextSelection(0);
    },
    onUpdate: ({ editor }) => {
      const md = (
        editor.storage as unknown as { markdown: { getMarkdown: () => string } }
      ).markdown.getMarkdown();
      setContent(md);
    },
  });

  // Open the media dialogs when triggered by the slash command.
  useEffect(() => {
    if (imageDialog) imageDialogRef.current?.showModal();
  }, [imageDialog]);
  useEffect(() => {
    if (videoDialog) videoDialogRef.current?.showModal();
  }, [videoDialog]);

  // Collapse a lingering node selection on any outside click (see PostEditor).
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

  const doSave = useCallback(
    async (opts?: { publishOverride?: boolean; silent?: boolean }) => {
      const cur = stateRef.current;
      const publishedNow = opts?.publishOverride ?? cur.published;
      const isEmpty = !cur.title.trim() && !cur.content.trim();
      if (isEmpty) return; // don't persist a blank project
      if (savingRef.current) return;

      savingRef.current = true;
      setStatus("saving");
      const data = {
        title: cur.title.trim() || "Untitled",
        content: cur.content.trim() || null,
        microview: cur.microview.trim() || null,
        tags: cur.tags || null,
        published: publishedNow,
        featured: cur.featured,
        imageUrl: cur.imageUrl || null,
        url: cur.url || null,
        githubUrl: cur.githubUrl || null,
        workedOn: cur.workedOn || null,
      };
      try {
        if (cur.id) {
          await updateProject(cur.id, data);
        } else {
          const { id: newId } = await createProject(data);
          setId(newId);
          window.history.replaceState(null, "", `/admin/projects/${newId}/edit`);
        }
        // The admin list caches rows in React Query; mark them stale so the list
        // refetches when the user navigates back to it.
        qc.invalidateQueries({ queryKey: ["projects"] });
        setStatus("saved");
        if (!opts?.silent) toast.success(publishedNow ? "Published" : "Saved");
      } catch {
        setStatus("error");
        if (!opts?.silent) toast.error("Failed to save");
      } finally {
        savingRef.current = false;
      }
    },
    [qc],
  );

  // Debounced autosave whenever a tracked field changes.
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => doSave({ silent: true }), 1300);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [title, content, microview, tags, featured, imageUrl, url, githubUrl, workedOn, doSave]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  const handlePublish = useCallback(async () => {
    const next = !stateRef.current.published;
    // Microview is the hook shown on the /projects card + metadata — required.
    if (next && !stateRef.current.microview.trim()) {
      toast.error("Add a microview before publishing");
      setMetaOpen(true);
      return;
    }
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

  const insertVideo = useCallback(
    (url: string) => {
      editor?.chain().focus().setImage({ src: url }).run();
      videoDialogRef.current?.close();
      setVideoDialog(false);
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
    const linkUrl = window.prompt("URL", prev || "https://");
    if (linkUrl === null) return;
    if (linkUrl === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: linkUrl }).run();
  }, [editor]);

  const uploadCover = useCallback(async (file: File | null) => {
    if (!file) return;
    const toastId = toast.loading("Uploading…");
    try {
      setImageUrl(await uploadToCloudinary(file, "image"));
      toast.success("Uploaded", { id: toastId });
    } catch {
      toast.error("Upload failed", { id: toastId });
    }
  }, []);

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
    const done = () => {
      setPreview(false);
      window.removeEventListener("afterprint", done);
    };
    window.addEventListener("afterprint", done);
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

  const inputCls =
    "block w-full rounded-lg border border-hairline bg-transparent px-3 py-2 text-xs text-fg placeholder-fg/30 focus:border-fg/30 focus:outline-none";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg text-fg">
      {/* Top bar */}
      <header className="no-print grid h-14 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-1 border-b border-hairline px-2 md:px-4">
        <div className="flex min-w-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => router.push("/admin/projects")}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-fg/60 hover:bg-hover-bg hover:text-fg transition-colors"
          >
            <ArrowLeft weight="thin" className="h-4 w-4" />
            <span className="hidden sm:inline">Projects</span>
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

        <EditPreviewToggle preview={preview} onChange={setPreview} />

        <div className="flex min-w-0 items-center justify-end gap-1">
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
            aria-label={published ? "Unpublish" : "Publish"}
            className={`ml-0.5 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-all sm:px-3 ${
              published ? "bg-hover-bg text-fg/70 hover:text-fg" : "bg-fg text-bg hover:opacity-90"
            }`}
          >
            {published ? (
              <EyeSlash weight="thin" className="h-4 w-4 sm:hidden" />
            ) : (
              <Globe weight="thin" className="h-4 w-4 sm:hidden" />
            )}
            <span className="hidden sm:inline">{published ? "Unpublish" : "Publish"}</span>
          </button>
        </div>
      </header>

      {/* Body */}
      <div ref={bodyRef} className="relative flex-1 overflow-y-auto overflow-x-hidden">
        {preview && <PostToc headings={headings} scrollRootRef={bodyRef} />}
        <div className="post-print mx-auto max-w-[720px] px-5 py-10 md:py-14">
          {preview ? (
            <article>
              <h1 className="m-0 p-0 font-heading text-3xl leading-tight">{title || "Untitled"}</h1>
              <PostPreview content={content} className="mt-6 text-fg/80" interactive={false} />
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
            <EditorBubbleMenu editor={editor} onImageWidth={setImageWidth} onAddLink={addLink} />
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
              <h2 className="font-heading text-sm">Project details</h2>
              <button
                type="button"
                onClick={() => setMetaOpen(false)}
                className="rounded-lg px-2 py-1 text-xs text-fg/60 hover:bg-hover-bg"
              >
                Done
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="space-y-2">
                  <label className="text-xs text-fg/50">Status</label>
                  <button
                    type="button"
                    onClick={() =>
                      setPublished((p) => {
                        // A project can only be featured while published.
                        if (p) setFeatured(false);
                        return !p;
                      })
                    }
                    className={`block px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                      published ? "bg-fg text-bg" : "bg-hover-bg text-fg/50 hover:text-fg"
                    }`}
                  >
                    {published ? "● Published" : "○ Draft"}
                  </button>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-fg/50">Featured</label>
                  <button
                    type="button"
                    disabled={!published}
                    onClick={() => setFeatured((p) => !p)}
                    className={`block px-3 py-1.5 text-xs rounded-lg font-medium transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
                      featured ? "bg-fg text-bg" : "bg-hover-bg text-fg/50 hover:text-fg"
                    }`}
                  >
                    {featured ? "★ Featured" : "☆ Feature"}
                  </button>
                </div>
              </div>
              {!published && (
                <p className="text-[10px] text-fg/30">Publish the project to feature it.</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-1 text-xs text-fg/50">
                Microview <span className="text-red-400">*</span>
              </label>
              <textarea
                value={microview}
                onChange={(e) => setMicroview(e.target.value)}
                rows={3}
                maxLength={MICROVIEW_MAX}
                required
                placeholder="Short hook shown on the /projects card — required to publish…"
                className="block w-full resize-none rounded-lg border border-hairline bg-transparent px-3 py-2 text-xs text-fg placeholder-fg/30 focus:border-fg/30 focus:outline-none"
              />
              <p className="text-[10px] text-fg/30">
                {microview.length}/{MICROVIEW_MAX}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-fg/50">Cover image / GIF</label>
              <ImageUpload
                value={imageUrl}
                onChange={setImageUrl}
                onRemove={() => setImageUrl("")}
                onFilePending={uploadCover}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-fg/50">Worked on</label>
              <input
                type="date"
                value={workedOn}
                onChange={(e) => setWorkedOn(e.target.value)}
                className={`${inputCls} dark:[color-scheme:dark]`}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-fg/50">Project URL</label>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://…"
                className={inputCls}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-fg/50">GitHub URL</label>
              <input
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/…"
                className={inputCls}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-fg/50">Tags</label>
              <TagPicker value={tags ?? ""} onChange={setTags} tags={projectTags} />
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
            key={imageDialog ? "image-open" : "image-closed"}
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

      {/* Video insert dialog */}
      <dialog
        ref={videoDialogRef}
        onClose={() => setVideoDialog(false)}
        className="bg-transparent backdrop:bg-black/50"
      >
        <div className="w-80 rounded-xl border border-nav-border bg-bg p-4 shadow-2xl">
          <p className="mb-3 text-xs font-medium text-fg">Insert video</p>
          <ImageUpload
            key={videoDialog ? "video-open" : "video-closed"}
            accept="video/*"
            resourceType="video"
            onChange={insertVideo}
            onFilePending={async (file) => {
              if (!file) return;
              await uploadAndInsert(editor, file);
              videoDialogRef.current?.close();
              setVideoDialog(false);
            }}
          />
          <button
            type="button"
            onClick={() => {
              videoDialogRef.current?.close();
              setVideoDialog(false);
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
