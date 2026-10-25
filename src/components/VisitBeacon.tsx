"use client";

import { useEffect } from "react";

/**
 * Pings /api/visit once per page load for the daily unique-visitor count.
 * Mounted in the root layout, so client-side navigations don't re-fire it;
 * the server dedupes per visitor per day anyway. Crawlers that don't run JS
 * never get here, and automated browsers announce themselves via webdriver.
 */
export function VisitBeacon() {
  useEffect(() => {
    if (navigator.webdriver) return;
    navigator.sendBeacon("/api/visit");
  }, []);

  return null;
}
