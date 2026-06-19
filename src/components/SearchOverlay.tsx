"use client";

import { useEffect, useState } from "react";
import { SearchModal } from "@/components/SearchModal";

export function SearchOverlay() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((p) => !p);
      }
    }
    function handleOpenSearch() {
      setOpen((p) => !p);
    }
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("opensearch", handleOpenSearch);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("opensearch", handleOpenSearch);
    };
  }, []);

  return <SearchModal open={open} onClose={() => setOpen(false)} />;
}
