"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

// Only shown on ⌘K — don't put the whole search UI in every route's
// initial bundle; fetch the chunk on first open instead.
const SearchModal = dynamic(() => import("@/components/SearchModal").then((m) => m.SearchModal), {
  ssr: false,
});

export function SearchOverlay() {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const openRef = useRef(false);

  useEffect(() => {
    openRef.current = open;
    if (open) setLoaded(true);
  }, [open]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const willOpen = !openRef.current;
        if (willOpen) {
          window.dispatchEvent(new CustomEvent("closechat"));
          window.dispatchEvent(new CustomEvent("closequickadd"));
        }
        setOpen(willOpen);
      }
      // When search is open, cmd+/ closes it and hands off to chat
      if ((e.metaKey || e.ctrlKey) && e.key === "/" && openRef.current) {
        e.preventDefault();
        e.stopImmediatePropagation();
        setOpen(false);
        window.dispatchEvent(new CustomEvent("openchat"));
      }
    }
    function handleOpenSearch() {
      const willOpen = !openRef.current;
      if (willOpen) {
        window.dispatchEvent(new CustomEvent("closechat"));
        window.dispatchEvent(new CustomEvent("closequickadd"));
      }
      setOpen(willOpen);
    }
    function handleCloseSearch() {
      setOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    window.addEventListener("opensearch", handleOpenSearch);
    window.addEventListener("closesearch", handleCloseSearch);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
      window.removeEventListener("opensearch", handleOpenSearch);
      window.removeEventListener("closesearch", handleCloseSearch);
    };
  }, []);

  if (!loaded) return null;
  return <SearchModal open={open} onClose={() => setOpen(false)} />;
}
