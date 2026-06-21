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
        setOpen((p) => !p);
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
      setOpen((p) => !p);
    }
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    window.addEventListener("opensearch", handleOpenSearch);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
      window.removeEventListener("opensearch", handleOpenSearch);
    };
  }, []);

  return <SearchModal open={open} onClose={() => setOpen(false)} />;
}
