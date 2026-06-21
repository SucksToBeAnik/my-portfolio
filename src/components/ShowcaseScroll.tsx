"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export function ShowcaseScroll() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("showcase") !== "1") return;
    // Double rAF ensures the snap container has been laid out and painted
    // before we attempt the scroll — clientHeight is 0 during hydration.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const container = document.getElementById("snap-container");
        if (!container) return;
        container.scrollTo({ top: container.clientHeight, behavior: "smooth" });
      });
    });
  }, [searchParams]);

  return null;
}
