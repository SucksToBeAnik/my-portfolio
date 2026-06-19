"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MagnifyingGlass, Compass, FolderOpen, BookOpenText, Quotes, Heart, Wrench } from "@phosphor-icons/react";
import { getSearchItems, invalidateSearchCache } from "@/lib/search-index";
import type { SearchIndexItem } from "@/actions/search";

const typeConfig: Record<string, { icon: React.ElementType; label: string }> = {
  page: { icon: Compass, label: "Pages" },
  project: { icon: FolderOpen, label: "Projects" },
  book: { icon: BookOpenText, label: "Books" },
  microblog: { icon: Quotes, label: "Microblog" },
  lifeEvent: { icon: Heart, label: "Life" },
  stack: { icon: Wrench, label: "Stacks" },
};

export function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<SearchIndexItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  const activeItems = query
    ? items.filter((i) => {
        const q = query.toLowerCase();
        return (
          i.title.toLowerCase().includes(q) ||
          i.subtitle.toLowerCase().includes(q)
        );
      })
    : [];

  const grouped = activeItems.reduce<Record<string, SearchIndexItem[]>>((acc, item) => {
    if (!acc[item.type]) acc[item.type] = [];
    acc[item.type].push(item);
    return acc;
  }, {});

  const typeOrder = ["page", "project", "book", "microblog", "lifeEvent", "stack"];

  useEffect(() => {
    if (open) {
      setQuery("");
      setLoaded(false);
      getSearchItems().then((data) => {
        setItems(data);
        setLoaded(true);
      });
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    invalidateSearchCache();
  }, [pathname]);

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
      }
    },
    [onClose],
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
      onClick={onClose}
      onKeyDown={handleKeyDown}
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
            placeholder="Search pages, projects, books..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 text-sm bg-transparent text-fg placeholder-fg/30 focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex px-1.5 py-0.5 text-[10px] text-muted bg-hover-bg rounded border border-hairline">
            ESC
          </kbd>
        </div>

        <div className="max-h-[50vh] overflow-y-auto">
          {!loaded && query && (
            <div className="flex items-center justify-center py-8 text-xs text-muted">Loading...</div>
          )}

          {loaded && query && activeItems.length === 0 && (
            <div className="flex items-center justify-center py-8 text-xs text-muted">No results found.</div>
          )}

          {loaded && query && typeOrder.map((type) => {
            const groupItems = grouped[type];
            if (!groupItems || groupItems.length === 0) return null;
            const config = typeConfig[type];

            return (
              <div key={type} className="px-2 py-2">
                <p className="px-2 text-[10px] uppercase tracking-wider text-muted mb-1">{config.label}</p>
                {groupItems.map((item) => (
                  <button
                    key={`${item.type}-${item.id}`}
                    onClick={() => handleSelect(item.url)}
                    className="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left hover:bg-hover-bg transition-colors cursor-pointer"
                  >
                    <config.icon weight="thin" className="w-4 h-4 text-muted shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm truncate">{item.title}</p>
                      {item.subtitle && (
                        <p className="text-xs text-muted truncate">{item.subtitle}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
