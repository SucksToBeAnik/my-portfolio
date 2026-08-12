"use client";

import {
  BookOpenText,
  Certificate,
  ChatCircleDots,
  Compass,
  FolderOpen,
  Heart,
  Image,
  Lightbulb,
  MagnifyingGlass,
  Quotes,
  Television,
  Wrench,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { SearchIndexItem } from "@/actions/search";
import { getSearchItems, invalidateSearchCache } from "@/lib/search-index";

const typeConfig: Record<string, { icon: React.ElementType; label: string }> = {
  page: { icon: Compass, label: "Pages" },
  project: { icon: FolderOpen, label: "Projects" },
  publication: { icon: Certificate, label: "Publications" },
  book: { icon: BookOpenText, label: "Books" },
  microblog: { icon: Quotes, label: "Microblog" },
  til: { icon: Lightbulb, label: "TIL" },
  lifeEvent: { icon: Heart, label: "Life" },
  stack: { icon: Wrench, label: "Stacks" },
  media: { icon: Television, label: "Media" },
  gallery: { icon: Image, label: "Photos" },
};

const typeOrder = [
  "page",
  "project",
  "publication",
  "book",
  "microblog",
  "til",
  "lifeEvent",
  "stack",
  "media",
  "gallery",
];

const TYPE_ALIAS: Record<string, string> = {
  page: "page",
  pages: "page",
  project: "project",
  projects: "project",
  publication: "publication",
  publications: "publication",
  book: "book",
  books: "book",
  microblog: "microblog",
  microblogs: "microblog",
  til: "til",
  tils: "til",
  life: "lifeEvent",
  stack: "stack",
  stacks: "stack",
  media: "media",
  // The index key stays `gallery` because that is the table name. Both filters
  // work, but the search guide uses `@gallery` so the syntax matches the data.
  photo: "gallery",
  photos: "gallery",
  gallery: "gallery",
  galleries: "gallery",
};

const TYPE_SUGGESTIONS = [
  "@pages",
  "@projects",
  "@publications",
  "@books",
  "@microblog",
  "@til",
  "@life",
  "@stacks",
  "@media",
  "@gallery",
];

const SEARCH_STARTERS = [
  { filter: "gallery", description: "Photos I've taken", type: "gallery" },
  { filter: "stacks", description: "Tools and gear I use", type: "stack" },
  { filter: "books", description: "What I've been reading", type: "book" },
  { filter: "til", description: "Things I've learned", type: "til" },
] satisfies Array<{
  filter: string;
  description: string;
  type: SearchIndexItem["type"];
}>;

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlight(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const words = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w && !w.startsWith("@"));
  if (words.length === 0) return text;
  const pattern = words.map((w) => `\\b${escapeRegex(w)}`).join("|");
  const regex = new RegExp(pattern, "gi");
  const parts: React.ReactNode[] = [];
  let last = 0;
  let key = 0;
  let match = regex.exec(text);
  while (match !== null) {
    if (match.index > last) {
      parts.push(<span key={key++}>{text.slice(last, match.index)}</span>);
    }
    parts.push(
      <mark key={key++} className="bg-fg/20 text-fg rounded-sm">
        {match[0]}
      </mark>,
    );
    last = regex.lastIndex;
    match = regex.exec(text);
  }
  if (last < text.length) {
    parts.push(<span key={key}>{text.slice(last)}</span>);
  }
  return parts.length > 0 ? parts : text;
}

export function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<SearchIndexItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const fetchRef = useRef(0);
  const router = useRouter();

  const lastWord = query.split(/\s+/).pop() ?? "";
  const isTypePicking = lastWord.startsWith("@");

  const matchingTypes = isTypePicking ? TYPE_SUGGESTIONS.filter((s) => s.startsWith(lastWord)) : [];

  const activeItems: SearchIndexItem[] = isTypePicking
    ? matchingTypes.map((s, i) => {
        const typeKey = (TYPE_ALIAS[s.slice(1)] ?? "page") as SearchIndexItem["type"];
        return {
          id: -(i + 1),
          title: s,
          subtitle: `Filter by ${s.slice(1)}`,
          url: `__type__:${s.slice(1)}`,
          type: typeKey,
        };
      })
    : query
      ? items.filter((i) => {
          const raw = query.toLowerCase().split(/\s+/).filter(Boolean);
          const typeFilters: string[] = [];
          const words: string[] = [];
          for (const w of raw) {
            const match = w.match(/^@(\w+)$/);
            if (match && TYPE_ALIAS[match[1]]) {
              typeFilters.push(TYPE_ALIAS[match[1]]);
            } else {
              words.push(w);
            }
          }
          if (typeFilters.length > 0 && !typeFilters.includes(i.type)) return false;
          if (words.length === 0) return true;
          const haystack = `${i.title} ${i.subtitle}`.toLowerCase();
          return words.every((w) => new RegExp(`\\b${escapeRegex(w)}`).test(haystack));
        })
      : [];

  const grouped = activeItems.reduce<Record<string, SearchIndexItem[]>>((acc, item) => {
    if (!acc[item.type]) acc[item.type] = [];
    acc[item.type].push(item);
    return acc;
  }, {});

  const flatItems = typeOrder.flatMap((type) => grouped[type] ?? []);

  useEffect(() => {
    if (open) {
      const id = ++fetchRef.current;
      setQuery("");
      setLoaded(false);
      setActiveIndex(-1);
      invalidateSearchCache();
      getSearchItems().then((data) => {
        if (id !== fetchRef.current) return;
        setItems(data);
        setLoaded(true);
      });
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(flatItems.length > 0 ? 0 : -1);
    itemRefs.current = [];
  }, [query, flatItems.length]);

  useEffect(() => {
    if (activeIndex >= 0) {
      itemRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  const handleSelect = useCallback(
    (url: string) => {
      if (url.startsWith("__type__:")) {
        const type = url.slice(9);
        const words = query.split(/\s+/);
        words[words.length - 1] = `@${type}`;
        setQuery(`${words.join(" ")} `);
        return;
      }
      onClose();
      router.push(url);
    },
    [onClose, router, query],
  );

  const handleAsk = useCallback(() => {
    onClose();
    window.dispatchEvent(new CustomEvent("openchat"));
  }, [onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (flatItems.length > 0) setActiveIndex((i) => (i + 1) % flatItems.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (flatItems.length > 0) setActiveIndex((i) => (i <= 0 ? flatItems.length - 1 : i - 1));
      } else if (e.key === "Enter" && activeIndex >= 0 && flatItems[activeIndex]) {
        e.preventDefault();
        handleSelect(flatItems[activeIndex].url);
      }
    },
    [onClose, flatItems, activeIndex, handleSelect],
  );

  if (!open) return null;

  let flatIndex = 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
      onClick={onClose}
    >
      <div className="fixed inset-0 bg-bg/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-[520px] mx-4 bg-bg border border-hairline rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-hairline">
          <MagnifyingGlass weight="thin" className="w-4 h-4 text-muted shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search for anything..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 text-sm bg-transparent text-fg placeholder-fg/30 focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex px-1.5 py-0.5 text-[10px] text-muted bg-hover-bg rounded border border-hairline">
            ESC
          </kbd>
        </div>

        <div ref={listRef} className="max-h-[50vh] overflow-y-auto">
          {!query && (
            <div className="px-2 py-2">
              <p className="px-2 pt-1 pb-2 text-xs text-muted">
                Feeling lost? <span className="text-fg/80">Try searching for...</span>
              </p>
              <div className="grid gap-1 sm:grid-cols-2">
                {SEARCH_STARTERS.map((starter) => {
                  const config = typeConfig[starter.type];
                  return (
                    <button
                      key={starter.filter}
                      type="button"
                      onClick={() => handleSelect(`__type__:${starter.filter}`)}
                      className="group flex items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-hover-bg cursor-pointer"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-hairline bg-hover-bg transition-transform group-hover:-rotate-3">
                        <config.icon weight="thin" className="h-4 w-4 text-muted" />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-mono text-xs text-fg">@{starter.filter}</span>
                        <span className="block truncate text-[11px] text-muted">
                          {starter.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="mx-2 mt-2 border-t border-hairline pt-3 pb-1 text-[11px] text-muted">
                Tip: combine a filter with a topic, like{" "}
                <button
                  type="button"
                  onClick={() => setQuery("@books harry potter")}
                  className="font-mono text-fg/75 underline decoration-fg/20 underline-offset-4 transition-colors hover:text-fg cursor-pointer"
                >
                  @books harry potter
                </button>
                .
              </p>
            </div>
          )}

          {!loaded && query && !isTypePicking && (
            <div className="flex items-center justify-center py-8 text-xs text-muted">
              Loading...
            </div>
          )}

          {loaded && query && activeItems.length === 0 && (
            <div className="flex flex-col items-center px-6 py-8 text-center">
              {isTypePicking ? (
                <p className="text-xs text-muted">No matching type filters.</p>
              ) : (
                <>
                  <p className="text-sm text-fg/80">Nothing found for “{query.trim()}”.</p>
                  <p className="mt-1 text-xs text-muted">I might still know what you&apos;re after.</p>
                  <button
                    type="button"
                    onClick={handleAsk}
                    className="mt-4 inline-flex items-center gap-2 rounded-full border border-control-border px-3 py-1.5 text-xs text-fg/80 transition-colors hover:border-fg/45 hover:text-fg cursor-pointer"
                  >
                    <ChatCircleDots weight="thin" className="h-4 w-4" />
                    Ask me instead
                  </button>
                </>
              )}
            </div>
          )}

          {loaded &&
            query &&
            typeOrder.map((type) => {
              const groupItems = grouped[type];
              if (!groupItems || groupItems.length === 0) return null;
              const config = typeConfig[type];

              return (
                <div key={type} className="px-2 py-2">
                  <p className="px-2 text-[10px] uppercase tracking-wider text-muted mb-1">
                    {config.label}
                  </p>
                  {groupItems.map((item) => {
                    const idx = flatIndex++;
                    const isActive = idx === activeIndex;
                    return (
                      <button
                        key={`${item.type}-${item.id}`}
                        ref={(el) => {
                          itemRefs.current[idx] = el;
                        }}
                        onClick={() => handleSelect(item.url)}
                        onMouseEnter={() => setActiveIndex(idx)}
                        className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left transition-colors cursor-pointer ${isActive ? "bg-hover-bg" : "hover:bg-hover-bg"}`}
                      >
                        <config.icon weight="thin" className="w-4 h-4 text-muted shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm truncate">{highlight(item.title, query)}</p>
                          {item.subtitle && (
                            <p className="text-xs text-muted truncate">
                              {highlight(item.subtitle, query)}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
