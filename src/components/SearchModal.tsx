"use client";

import {
  BookOpenText,
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
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { SearchIndexItem } from "@/actions/search";
import { getSearchItems, invalidateSearchCache } from "@/lib/search-index";

const typeConfig: Record<string, { icon: React.ElementType; label: string }> = {
  page: { icon: Compass, label: "Pages" },
  project: { icon: FolderOpen, label: "Projects" },
  book: { icon: BookOpenText, label: "Books" },
  microblog: { icon: Quotes, label: "Microblog" },
  til: { icon: Lightbulb, label: "TIL" },
  lifeEvent: { icon: Heart, label: "Life" },
  stack: { icon: Wrench, label: "Stacks" },
  media: { icon: Television, label: "Media" },
  gallery: { icon: Image, label: "Gallery" },
};

const typeOrder = ["page", "project", "book", "microblog", "til", "lifeEvent", "stack", "media", "gallery"];

const TYPE_ALIAS: Record<string, string> = {
  page: "page",
  pages: "page",
  project: "project",
  projects: "project",
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
  gallery: "gallery",
  galleries: "gallery",
};

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
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(<span key={key++}>{text.slice(last, match.index)}</span>);
    }
    parts.push(
      <mark key={key++} className="bg-fg/20 text-fg rounded-sm">
        {match[0]}
      </mark>,
    );
    last = regex.lastIndex;
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
  const _pathname = usePathname();

  const activeItems = query
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
    setActiveIndex(0);
    itemRefs.current = [];
  }, [query]);

  useEffect(() => {
    if (activeIndex >= 0) {
      itemRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  const handleSelect = useCallback(
    (url: string) => {
      onClose();
      router.push(url);
    },
    [onClose, router],
  );

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
            placeholder='Search or use @gallery, @stacks, @til...'
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
          {!loaded && query && (
            <div className="flex items-center justify-center py-8 text-xs text-muted">
              Loading...
            </div>
          )}

          {loaded && query && activeItems.length === 0 && (
            <div className="flex items-center justify-center py-8 text-xs text-muted">
              No results found.
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
                        ref={(el) => { itemRefs.current[idx] = el; }}
                        onClick={() => handleSelect(item.url)}
                        onMouseEnter={() => setActiveIndex(idx)}
                        className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left transition-colors cursor-pointer ${isActive ? "bg-hover-bg" : "hover:bg-hover-bg"}`}
                      >
                        <config.icon weight="thin" className="w-4 h-4 text-muted shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm truncate">{highlight(item.title, query)}</p>
                          {item.subtitle && (
                            <p className="text-xs text-muted truncate">{highlight(item.subtitle, query)}</p>
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
