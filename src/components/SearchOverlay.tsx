"use client";

import { useState, useEffect } from "react";
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
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return <SearchModal open={open} onClose={() => setOpen(false)} />;
}
