"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Records the previous in-app pathname in sessionStorage so the back button can
 * label itself with the page it will actually return to. Mounted once, above
 * the page content, so its effect runs before any BackButton reads the value.
 */
export function NavHistoryTracker() {
  const pathname = usePathname();

  useEffect(() => {
    try {
      const current = sessionStorage.getItem("navCurrentPath");
      if (current && current !== pathname) {
        sessionStorage.setItem("navPrevPath", current);
      }
      sessionStorage.setItem("navCurrentPath", pathname);
    } catch {
      // sessionStorage unavailable (e.g. private mode) — back button falls back.
    }
  }, [pathname]);

  return null;
}
