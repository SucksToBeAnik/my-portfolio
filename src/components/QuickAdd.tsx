"use client";

import {
  ArrowLeft,
  BookOpenText,
  Check,
  Globe,
  Image,
  Lightbulb,
  Quotes,
  Television,
  Wrench,
  X,
} from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { createBook } from "@/actions/books";
import { BookSearch, type BookResult } from "@/components/BookSearch";
import { StarRating } from "@/components/StarRating";
import { TagPicker } from "@/components/TagPicker";

const BOOK_CATEGORIES = [
  "fiction",
  "non-fiction",
  "sci-fi",
  "fantasy",
  "self-help",
  "business",
  "biography",
  "history",
  "philosophy",
  "poetry",
];
const STACK_CATEGORIES = [
  "Editor / IDE",
  "Language / Runtime",
  "Framework",
  "Database",
  "Design",
  "DevOps / Infrastructure",
  "AI / ML",
  "Terminal / CLI",
  "Productivity",
  "Hardware",
];
import { createGalleryItem } from "@/actions/gallery";
import { createMedia, lookupIMDb, searchIMDb } from "@/actions/media";
import { createMicroblog } from "@/actions/microblogs";
import { createSite } from "@/actions/sites";
import { createStack } from "@/actions/stacks";
import { createTil } from "@/actions/tils";

type ContentType = "site" | "book" | "til" | "post" | "media" | "stack" | "gallery";
type Step = "type" | "form" | "success";
type MediaPick = Awaited<ReturnType<typeof lookupIMDb>>;
type IMDbResult = Awaited<ReturnType<typeof searchIMDb>>[number];

const TYPES: { id: ContentType; label: string; icon: React.ElementType; desc: string }[] = [
  { id: "site", label: "Site", icon: Globe, desc: "Save a URL" },
  { id: "media", label: "Media", icon: Television, desc: "Movie or series" },
  { id: "book", label: "Book", icon: BookOpenText, desc: "Add to reading list" },
  { id: "til", label: "TIL", icon: Lightbulb, desc: "Something you learned" },
  { id: "post", label: "Post", icon: Quotes, desc: "Short microblog post" },
  { id: "stack", label: "Stack", icon: Wrench, desc: "Tool or service" },
  { id: "gallery", label: "Gallery", icon: Image, desc: "Photo to gallery" },
];

const COLS = 2;

const TYPE_QUERY_KEYS: Partial<Record<ContentType, string[]>> = {
  site: ["sites"],
  book: ["books"],
  media: ["media"],
  stack: ["stacks"],
};

export function QuickAdd() {
  const { data: session } = useSession();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("type");
  const [activeIdx, setActiveIdx] = useState(0);
  const [selectedType, setSelectedType] = useState<ContentType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // refs for stable keyboard handler
  const openRef = useRef(false);
  const stepRef = useRef<Step>("type");
  const activeIdxRef = useRef(0);

  useEffect(() => {
    openRef.current = open;
  }, [open]);
  useEffect(() => {
    stepRef.current = step;
  }, [step]);
  useEffect(() => {
    activeIdxRef.current = activeIdx;
  }, [activeIdx]);

  // focus refs
  const titleRef = useRef<HTMLInputElement>(null);
  const stackUrlRef = useRef<HTMLInputElement>(null);
  const mediaSearchRef = useRef<HTMLInputElement>(null);
  const bookSearchRef = useRef<HTMLInputElement | null>(null);

  // ── form fields ──────────────────────────────────────────

  const [bookStatus, setBookStatus] = useState<"reading" | "read" | "want_to_read">("want_to_read");
  const [bookPicked, setBookPicked] = useState<BookResult | null>(null);
  const [bookRating, setBookRating] = useState<number | null>(null);
  const [bookReview, setBookReview] = useState("");
  const [bookCategory, setBookCategory] = useState("");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [published, setPublished] = useState(false);

  const [stackName, setStackName] = useState("");
  const [stackUrl, setStackUrl] = useState("");
  const [stackImageUrl, setStackImageUrl] = useState("");
  const [stackDesc, setStackDesc] = useState("");
  const [stackCategory, setStackCategory] = useState("");
  const [stackFetching, setStackFetching] = useState(false);
  const stackFetchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const [mediaRating, setMediaRating] = useState<number | null>(null);

  const [galleryTitle, setGalleryTitle] = useState("");
  const [galleryFile, setGalleryFile] = useState<File | null>(null);

  const [mediaSearch, setMediaSearch] = useState("");
  const [mediaResults, setMediaResults] = useState<IMDbResult[]>([]);
  const [mediaSearching, setMediaSearching] = useState(false);
  const [mediaLooking, setMediaLooking] = useState(false);
  const [mediaPicked, setMediaPicked] = useState<MediaPick>(null);
  const [mediaStatus, setMediaStatus] = useState<"watching" | "watched" | "planned" | "dropped">(
    "planned",
  );
  const [mediaReview, setMediaReview] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // ─────────────────────────────────────────────────────────

  function reset() {
    setStep("type");
    setActiveIdx(0);
    setSelectedType(null);
    setError("");
    setLoading(false);
    setTitle("");
    setContent("");
    setPublished(false);
    setBookStatus("want_to_read");
    setBookPicked(null);
    setBookRating(null);
    setBookReview("");
    setBookCategory("");
    setStackName("");
    setStackUrl("");
    setStackImageUrl("");
    setStackDesc("");
    setStackCategory("");
    setStackFetching(false);
    setMediaSearch("");
    setMediaResults([]);
    setMediaPicked(null);
    setMediaStatus("planned");
    setMediaReview("");
    setMediaRating(null);
    setMediaSearching(false);
    setMediaLooking(false);
    setGalleryTitle("");
    setGalleryFile(null);
  }

  function close() {
    setOpen(false);
    reset();
  }

  function selectType(t: ContentType) {
    setSelectedType(t);
    setStep("form");
  }

  // ── global keyboard handler (stable — uses refs) ──────────
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // cmd+i to toggle
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === "i") {
        if ((e.target as HTMLElement).isContentEditable) return;
        e.preventDefault();
        if (openRef.current) {
          close();
        } else {
          window.dispatchEvent(new CustomEvent("closechat"));
          window.dispatchEvent(new CustomEvent("closesearch"));
          setOpen(true);
        }
        return;
      }

      if (!openRef.current) return;

      if (e.key === "Escape") {
        close();
        return;
      }

      // type-picker navigation
      if (stepRef.current === "type") {
        const total = TYPES.length;
        if (e.key === "ArrowRight") {
          e.preventDefault();
          setActiveIdx((i) => (i + 1) % total);
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          setActiveIdx((i) => (i - 1 + total) % total);
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          setActiveIdx((i) => (i + COLS) % total);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setActiveIdx((i) => (i - COLS + total) % total);
        } else if (e.key === "Enter") {
          e.preventDefault();
          selectType(TYPES[activeIdxRef.current].id);
        }
      }
    }
    function onCloseQuickAdd() {
      if (openRef.current) close();
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("closequickadd", onCloseQuickAdd);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("closequickadd", onCloseQuickAdd);
    };
  }, []);

  // ── focus first field when form opens ────────────────────
  useEffect(() => {
    if (step !== "form") return;
    setTimeout(() => {
      if (selectedType === "stack") stackUrlRef.current?.focus();
      else if (selectedType === "media") mediaSearchRef.current?.focus();
      else if (selectedType === "book") bookSearchRef.current?.focus();
      else if (selectedType !== "site") titleRef.current?.focus();
    }, 50);
  }, [step, selectedType]);

  // ── site: paste-to-save ───────────────────────────────────
  useEffect(() => {
    if (step !== "form" || selectedType !== "site") return;
    async function onPaste(e: ClipboardEvent) {
      const text = e.clipboardData?.getData("text")?.trim();
      if (!text) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      const normalized = text.startsWith("http") ? text : `https://${text}`;
      try {
        const { hostname } = new URL(normalized);
        if (!hostname.includes(".")) throw new Error();
      } catch {
        toast.error("Not a valid URL");
        return;
      }
      const url = normalized;
      setLoading(true);
      setError("");
      try {
        await createSite({ url });
        qc.invalidateQueries({ queryKey: ["sites"] });
        setStep("success");
        setTimeout(close, 1400);
      } catch {
        setError("Something went wrong.");
        setLoading(false);
      }
    }
    window.addEventListener("paste", onPaste, { capture: true });
    return () => window.removeEventListener("paste", onPaste, { capture: true });
  }, [step, selectedType]);

  // ── IMDb search ───────────────────────────────────────────
  async function handleMediaSearch(q: string) {
    setMediaSearch(q);
    clearTimeout(searchTimer.current);
    if (!q.trim()) {
      setMediaResults([]);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      setMediaSearching(true);
      const results = await searchIMDb(q);
      setMediaResults(results);
      setMediaSearching(false);
    }, 400);
  }

  async function handleMediaSelect(result: IMDbResult) {
    setMediaResults([]);
    setMediaSearch("");
    setMediaLooking(true);
    const details = await lookupIMDb(result.imdbId);
    setMediaLooking(false);
    if (!details) {
      setError("Could not load details. Try again.");
      return;
    }
    setMediaPicked(details);
    setError("");
  }

  // ── submit ────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedType) return;
    if (selectedType === "media" && !mediaPicked) {
      setError("Search and select a movie or series first.");
      return;
    }
    if (selectedType === "book" && !bookPicked) {
      setError("Search and select a book first.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      if (selectedType === "book" && bookPicked) {
        await createBook({
          title: bookPicked.title,
          author: bookPicked.authors.join(", ") || "Unknown",
          coverUrl: bookPicked.coverUrl ?? undefined,
          status: bookStatus,
          rating: bookRating ?? undefined,
          review: bookReview.trim() || undefined,
          category: bookCategory || undefined,
        });
      } else if (selectedType === "til") {
        await createTil({ title, content });
      } else if (selectedType === "post") {
        await createMicroblog({ title, content, published });
      } else if (selectedType === "stack") {
        await createStack({
          name: stackName,
          url: stackUrl,
          imageUrl: stackImageUrl || undefined,
          description: stackDesc.trim() || undefined,
          category: stackCategory || undefined,
        });
      } else if (selectedType === "gallery") {
        if (!galleryFile) {
          setError("Select an image first.");
          setLoading(false);
          return;
        }
        const { default: exifr } = await import("exifr");
        const exif = await exifr.parse(galleryFile, ["DateTimeOriginal"]);
        const takenAt = exif?.DateTimeOriginal
          ? new Date(exif.DateTimeOriginal).toISOString()
          : null;
        const { uploadToCloudinary } = await import("@/lib/cloudinary");
        const imageUrl = await uploadToCloudinary(galleryFile);
        await createGalleryItem({ title: galleryTitle, imageUrl, takenAt });
      } else if (selectedType === "media" && mediaPicked) {
        await createMedia({
          title: mediaPicked.title,
          type: mediaPicked.type,
          status: mediaStatus,
          year: mediaPicked.year,
          posterUrl: mediaPicked.posterUrl ?? undefined,
          imdbUrl: mediaPicked.imdbUrl ?? undefined,
          plot: mediaPicked.plot ?? undefined,
          seasons: mediaPicked.seasons ?? undefined,
          imdbId: mediaPicked.imdbId,
          review: mediaReview.trim() || undefined,
          rating: mediaRating ?? undefined,
        });
      }
      const queryKey = TYPE_QUERY_KEYS[selectedType];
      if (queryKey) qc.invalidateQueries({ queryKey });
      setStep("success");
      setTimeout(close, 1400);
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  }

  if (!session?.user) return null;
  if (!open) return null;

  const typeInfo = TYPES.find((t) => t.id === selectedType);

  const inputCls =
    "text-sm bg-hover-bg rounded-lg px-3 py-2 text-fg placeholder-fg/30 focus:outline-none border border-transparent focus:border-fg/20 transition-colors w-full";
  const labelCls = "text-[10px] uppercase tracking-wider text-muted";
  const toggleCls = (active: boolean) =>
    `flex-1 py-1.5 rounded-lg text-xs transition-all cursor-pointer border ${
      active ? "border-fg/30 text-fg bg-hover-bg" : "border-hairline text-muted hover:text-fg"
    }`;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-start justify-center pt-[12vh] sm:pt-[16vh]"
      onClick={close}
    >
      <div className="fixed inset-0 bg-bg/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-[420px] mx-4 bg-bg border border-hairline rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-hairline">
          <div className="flex items-center gap-2">
            {step === "form" && (
              <button
                type="button"
                onClick={() => {
                  setStep("type");
                  setSelectedType(null);
                  setError("");
                }}
                className="p-1 -ml-1 text-muted hover:text-fg transition-colors cursor-pointer"
              >
                <ArrowLeft weight="thin" className="w-4 h-4" />
              </button>
            )}
            <span className="text-sm font-heading">
              {step === "success"
                ? "Done"
                : step === "form" && typeInfo
                  ? selectedType === "gallery" ? "Add to Gallery" : `Add ${typeInfo.label}`
                  : "Quick Add"}
            </span>
            {step === "type" && (
              <kbd className="px-1.5 py-0.5 text-[9px] text-muted bg-hover-bg rounded border border-hairline leading-none">
                ⌘I
              </kbd>
            )}
          </div>
          <button
            type="button"
            onClick={close}
            className="p-1 text-muted hover:text-fg transition-colors cursor-pointer"
          >
            <X weight="thin" className="w-4 h-4" />
          </button>
        </div>

        {/* ── Type picker ── */}
        {step === "type" && (
          <div className="grid grid-cols-2 gap-2 p-3">
            {TYPES.map(({ id, label, icon: Icon, desc }, idx) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setActiveIdx(idx);
                  selectType(id);
                }}
                onMouseEnter={() => setActiveIdx(idx)}
                className={`flex flex-col items-start gap-2 p-3 rounded-xl border transition-all text-left cursor-pointer group ${
                  activeIdx === idx
                    ? "border-fg/30 bg-hover-bg"
                    : "border-hairline hover:border-fg/20 hover:bg-hover-bg"
                }`}
              >
                <Icon
                  weight="thin"
                  className={`w-5 h-5 transition-colors ${activeIdx === idx ? "text-fg" : "text-muted group-hover:text-fg"}`}
                />
                <div>
                  <p className="text-sm">{label}</p>
                  <p className="text-[10px] text-muted">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ── Success ── */}
        {step === "success" && (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted">
            <Check weight="thin" className="w-7 h-7" />
            <p className="text-xs">Saved</p>
          </div>
        )}

        {/* ── Site: paste prompt (no form) ── */}
        {step === "form" && selectedType === "site" && (
          <div className="flex flex-col items-center justify-center gap-3 py-8 px-4">
            <Globe weight="thin" className="w-6 h-6 text-muted" />
            {loading ? (
              <p className="text-xs text-muted">Saving...</p>
            ) : (
              <>
                <p className="text-sm text-muted">Paste a URL</p>
                <kbd className="px-2 py-1 text-[10px] text-muted bg-hover-bg rounded border border-hairline">
                  ⌘V
                </kbd>
              </>
            )}
          </div>
        )}

        {/* ── Form (all other types) ── */}
        {step === "form" && selectedType && selectedType !== "site" && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4">
            {/* BOOK */}
            {selectedType === "book" && (
              <>
                {!bookPicked ? (
                  <div className="flex flex-col gap-1">
                    <label className={labelCls}>Search</label>
                    <BookSearch
                      inputRef={bookSearchRef}
                      inputClassName={inputCls}
                      onSelect={(book) => setBookPicked(book)}
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-2.5 rounded-xl border border-hairline bg-hover-bg">
                    {bookPicked.coverUrl && (
                      <img
                        src={bookPicked.coverUrl}
                        alt=""
                        className="w-8 h-12 object-cover rounded shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm truncate">{bookPicked.title}</p>
                      <p className="text-[10px] text-muted truncate">
                        {bookPicked.authors.join(", ")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setBookPicked(null);
                        setTimeout(() => bookSearchRef.current?.focus(), 50);
                      }}
                      className="text-[10px] text-muted hover:text-fg transition-colors cursor-pointer shrink-0"
                    >
                      Change
                    </button>
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <label className={labelCls}>Status</label>
                  <div className="flex gap-1.5">
                    {(["want_to_read", "reading", "read"] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setBookStatus(s)}
                        className={toggleCls(bookStatus === s)}
                      >
                        {s === "want_to_read" ? "Want" : s === "reading" ? "Reading" : "Read"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className={labelCls}>
                    Rating <span className="normal-case">(optional)</span>
                  </label>
                  <StarRating value={bookRating} onChange={setBookRating} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className={labelCls}>
                    Review <span className="normal-case">(optional)</span>
                  </label>
                  <textarea
                    value={bookReview}
                    onChange={(e) => setBookReview(e.target.value)}
                    rows={3}
                    placeholder="Your thoughts..."
                    className={`${inputCls} resize-none`}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className={labelCls}>
                    Category <span className="normal-case">(optional)</span>
                  </label>
                  <TagPicker
                    compact
                    value={bookCategory}
                    onChange={setBookCategory}
                    tags={BOOK_CATEGORIES}
                  />
                </div>
              </>
            )}

            {/* TIL / POST */}
            {(selectedType === "til" || selectedType === "post") && (
              <>
                <div className="flex flex-col gap-1">
                  <label className={labelCls}>Title</label>
                  <input
                    ref={titleRef}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="Title..."
                    className={inputCls}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className={labelCls}>Content</label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                    rows={4}
                    placeholder="Markdown supported..."
                    className={`${inputCls} resize-none`}
                  />
                </div>
                {selectedType === "post" && (
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <div
                      onClick={() => setPublished((p) => !p)}
                      className={`relative w-8 h-4 rounded-full transition-colors cursor-pointer ${published ? "bg-fg/50" : "bg-hover-bg border border-hairline"}`}
                    >
                      <div
                        className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-fg transition-transform ${published ? "translate-x-4" : ""}`}
                      />
                    </div>
                    <span className="text-xs text-muted">Publish now</span>
                  </label>
                )}
              </>
            )}

            {/* STACK */}
            {selectedType === "stack" && (
              <>
                <div className="flex flex-col gap-1">
                  <label className={labelCls}>URL</label>
                  <div className="relative">
                    <input
                      ref={stackUrlRef}
                      type="url"
                      value={stackUrl}
                      onChange={(e) => {
                        const url = e.target.value;
                        setStackUrl(url);
                        clearTimeout(stackFetchTimer.current);
                        if (!url.trim()) return;
                        const normalized = url.startsWith("http") ? url : `https://${url}`;
                        stackFetchTimer.current = setTimeout(async () => {
                          setStackFetching(true);
                          try {
                            const res = await fetch(
                              `https://api.microlink.io/?url=${encodeURIComponent(normalized)}`,
                            );
                            const json = await res.json();
                            if (json.status === "success") {
                              if (json.data.title && !stackName) setStackName(json.data.title);
                              if (json.data.logo?.url) setStackImageUrl(json.data.logo.url);
                            }
                          } catch {}
                          setStackFetching(false);
                        }, 600);
                      }}
                      required
                      placeholder="https://..."
                      className={inputCls}
                    />
                    {stackFetching && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted pointer-events-none">
                        fetching...
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {stackImageUrl && (
                    <img
                      src={stackImageUrl}
                      alt=""
                      className="w-8 h-8 rounded object-contain bg-hover-bg shrink-0"
                    />
                  )}
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <label className={labelCls}>Name</label>
                    <input
                      value={stackName}
                      onChange={(e) => setStackName(e.target.value)}
                      required
                      placeholder="Tool name..."
                      className={inputCls}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className={labelCls}>
                    Description <span className="normal-case">(optional)</span>
                  </label>
                  <textarea
                    value={stackDesc}
                    onChange={(e) => setStackDesc(e.target.value)}
                    rows={2}
                    placeholder="What do you use it for?"
                    className={`${inputCls} resize-none`}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className={labelCls}>
                    Category <span className="normal-case">(optional)</span>
                  </label>
                  <TagPicker
                    compact
                    multiple={false}
                    value={stackCategory}
                    onChange={setStackCategory}
                    tags={STACK_CATEGORIES}
                  />
                </div>
              </>
            )}

            {/* GALLERY */}
            {selectedType === "gallery" && (
              <>
                <div className="flex flex-col gap-1">
                  <label className={labelCls}>Image</label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp,image/avif"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setGalleryFile(file);
                    }}
                    className="text-xs text-fg file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-hover-bg file:text-fg hover:file:opacity-80"
                  />
                  {galleryFile && (
                    <p className="text-[10px] text-muted">{galleryFile.name}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <label className={labelCls}>Title</label>
                  <input
                    ref={titleRef}
                    value={galleryTitle}
                    onChange={(e) => setGalleryTitle(e.target.value)}
                    required
                    placeholder="Image title..."
                    className={inputCls}
                  />
                </div>
              </>
            )}

            {/* MEDIA */}
            {selectedType === "media" && (
              <>
                {!mediaPicked ? (
                  <div className="flex flex-col gap-1">
                    <label className={labelCls}>Search</label>
                    <div className="relative">
                      <input
                        ref={mediaSearchRef}
                        value={mediaSearch}
                        onChange={(e) => handleMediaSearch(e.target.value)}
                        placeholder={
                          mediaLooking ? "Loading details..." : "Search movie or series..."
                        }
                        disabled={mediaLooking}
                        autoComplete="off"
                        className={inputCls}
                      />
                      {(mediaSearching || mediaLooking) && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted">
                          {mediaLooking ? "loading..." : "searching..."}
                        </span>
                      )}
                      {mediaResults.length > 0 && (
                        <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-bg border border-hairline rounded-xl shadow-xl overflow-hidden max-h-56 overflow-y-auto">
                          {mediaResults.map((r) => (
                            <button
                              key={r.imdbId}
                              type="button"
                              onClick={() => handleMediaSelect(r)}
                              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-hover-bg transition-colors text-left cursor-pointer"
                            >
                              {r.posterUrl ? (
                                <img
                                  src={r.posterUrl}
                                  alt=""
                                  className="w-7 h-10 object-cover rounded shrink-0"
                                />
                              ) : (
                                <div className="w-7 h-10 rounded bg-hover-bg shrink-0" />
                              )}
                              <div className="min-w-0">
                                <p className="text-xs truncate">{r.title}</p>
                                <p className="text-[10px] text-muted">
                                  {r.year} · {r.type === "series" ? "Series" : "Movie"}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-2.5 rounded-xl border border-hairline bg-hover-bg">
                    {mediaPicked.posterUrl && (
                      <img
                        src={mediaPicked.posterUrl}
                        alt=""
                        className="w-8 h-12 object-cover rounded shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm truncate">{mediaPicked.title}</p>
                      <p className="text-[10px] text-muted">
                        {mediaPicked.year} · {mediaPicked.type === "series" ? "Series" : "Movie"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setMediaPicked(null);
                        setMediaSearch("");
                        setTimeout(() => mediaSearchRef.current?.focus(), 50);
                      }}
                      className="text-[10px] text-muted hover:text-fg transition-colors cursor-pointer shrink-0"
                    >
                      Change
                    </button>
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <label className={labelCls}>Status</label>
                  <div className="flex gap-1.5">
                    {(["planned", "watching", "watched", "dropped"] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setMediaStatus(s)}
                        className={`${toggleCls(mediaStatus === s)} capitalize`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className={labelCls}>
                    Rating <span className="normal-case">(optional)</span>
                  </label>
                  <StarRating value={mediaRating} onChange={setMediaRating} />
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label className={labelCls}>
                      Review <span className="normal-case">(optional)</span>
                    </label>
                    <span
                      className={`text-[10px] tabular-nums ${mediaReview.length > 450 ? "text-red-400" : "text-muted"}`}
                    >
                      {mediaReview.length}/500
                    </span>
                  </div>
                  <textarea
                    value={mediaReview}
                    onChange={(e) => setMediaReview(e.target.value)}
                    maxLength={500}
                    rows={3}
                    placeholder="Your take..."
                    className={`${inputCls} resize-none`}
                  />
                </div>
              </>
            )}

            {error && <p className="text-xs text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 rounded-lg text-sm bg-fg text-bg hover:opacity-80 transition-opacity disabled:opacity-40 cursor-pointer mt-1"
            >
              {loading ? "Saving..." : selectedType === "gallery" ? "Add to Gallery" : `Add ${typeInfo?.label}`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
