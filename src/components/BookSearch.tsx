"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { searchBooks } from "@/actions/books";

export type BookResult = Awaited<ReturnType<typeof searchBooks>>[number];

interface BookSearchProps {
  onSelect: (book: BookResult) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  inputClassName?: string;
}

export function BookSearch({ onSelect, inputRef, inputClassName }: BookSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BookResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [dropPos, setDropPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const showDropdown = (results.length > 0 || (searched && !searching && query.trim())) && !searching;

  function closeDropdown() {
    setResults([]);
    setSearched(false);
    setQuery("");
    setActiveIdx(-1);
    setDropPos(null);
  }

  // Position the portal dropdown below the input wrapper
  useEffect(() => {
    if (!showDropdown) { setDropPos(null); return; }
    function compute() {
      if (!wrapRef.current) return;
      const r = wrapRef.current.getBoundingClientRect();
      setDropPos({ top: r.bottom + 4, left: r.left, width: r.width });
    }
    compute();
    window.addEventListener("scroll", compute, true);
    window.addEventListener("resize", compute);
    return () => {
      window.removeEventListener("scroll", compute, true);
      window.removeEventListener("resize", compute);
    };
  }, [showDropdown]);

  // Close when clicked outside (input or portal dropdown) — keep query text
  useEffect(() => {
    if (!showDropdown) return;
    function onMouseDown(e: MouseEvent) {
      const target = e.target as Node;
      if (wrapRef.current?.contains(target)) return;
      if (listRef.current?.contains(target)) return;
      setResults([]);
      setSearched(false);
      setActiveIdx(-1);
      setDropPos(null);
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [showDropdown]);

  // Close when the input wrapper is scrolled off-screen (e.g. drawer sliding away)
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (!entry.isIntersecting) closeDropdown(); },
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  async function handleChange(q: string) {
    setQuery(q);
    setActiveIdx(-1);
    clearTimeout(timer.current);
    if (!q.trim()) { setResults([]); setSearched(false); return; }
    timer.current = setTimeout(async () => {
      setSearching(true);
      const res = await searchBooks(q);
      setResults(res);
      setSearched(true);
      setSearching(false);
      setActiveIdx(res.length > 0 ? 0 : -1);
    }, 400);
  }

  function handleSelect(book: BookResult) {
    closeDropdown();
    onSelect(book);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!results.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = (activeIdx + 1) % results.length;
      setActiveIdx(next);
      scrollToItem(next);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = (activeIdx - 1 + results.length) % results.length;
      setActiveIdx(prev);
      scrollToItem(prev);
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      handleSelect(results[activeIdx]);
    } else if (e.key === "Escape") {
      closeDropdown();
    }
  }

  function scrollToItem(idx: number) {
    const container = listRef.current;
    const item = container?.children[idx] as HTMLElement | undefined;
    if (!container || !item) return;
    const itemTop = item.offsetTop;
    const itemBottom = itemTop + item.offsetHeight;
    if (itemTop < container.scrollTop) {
      container.scrollTop = itemTop;
    } else if (itemBottom > container.scrollTop + container.clientHeight) {
      container.scrollTop = itemBottom - container.clientHeight;
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search for a book..."
        autoComplete="off"
        className={inputClassName}
      />
      {searching && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted pointer-events-none">
          searching...
        </span>
      )}
      {showDropdown && dropPos && createPortal(
        <div
          ref={listRef}
          style={{ top: dropPos.top, left: dropPos.left, width: dropPos.width }}
          className="fixed z-[200] bg-bg border border-hairline rounded-xl shadow-xl overflow-y-auto max-h-72"
        >
          {results.length === 0 ? (
            <p className="px-4 py-4 text-xs text-muted text-center">No results found</p>
          ) : (
            results.map((r, i) => (
              <button
                key={r.id}
                type="button"
                onClick={() => handleSelect(r)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors text-left cursor-pointer ${
                  i === activeIdx ? "bg-hover-bg" : "hover:bg-hover-bg"
                }`}
              >
                {r.coverUrl ? (
                  <img src={r.coverUrl} alt="" className="w-8 h-12 object-cover rounded shrink-0" />
                ) : (
                  <div className="w-8 h-12 rounded bg-hover-bg shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm truncate">{r.title}</p>
                  <p className="text-xs text-muted truncate">
                    {r.authors.join(", ")}
                    {r.publishedDate ? ` · ${r.publishedDate}` : ""}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>,
        document.body,
      )}
    </div>
  );
}
