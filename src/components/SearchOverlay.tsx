"use client";

import { useEffect, useRef, useState } from "react";
import { SearchModal } from "@/components/SearchModal";

export function SearchOverlay() {
  const [open, setOpen] = useState(false);
  const openRef = useRef(false);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const willOpen = !openRef.current;
        if (willOpen) window.dispatchEvent(new CustomEvent("closechat"));
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
      if (willOpen) window.dispatchEvent(new CustomEvent("closechat"));
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

  return <SearchModal open={open} onClose={() => setOpen(false)} />;
}
