"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

type Beacon =
  | { type: "view"; path: string; referrer: string }
  | { type: "time"; path: string; ms: number }
  | { type: "click"; path: string; href: string; label?: string };

function send(beacon: Beacon) {
  navigator.sendBeacon("/api/visit", JSON.stringify(beacon));
}

/** Off-site links and downloads (the CV) are the clicks worth knowing about. */
function trackedLink(target: EventTarget | null): HTMLAnchorElement | null {
  const link = target instanceof Element ? target.closest("a") : null;
  if (!link?.href) return null;
  const url = new URL(link.href, location.href);
  const external = url.origin !== location.origin && url.protocol.startsWith("http");
  const download = link.hasAttribute("download") || url.pathname.endsWith(".pdf");
  return external || download ? link : null;
}

/**
 * Feeds the visitor log on /admin/visitors: a `view` per page (including
 * client-side navigations), how long each page was actually visible, and
 * clicks on off-site links and downloads. The server dedupes per visitor per
 * day. Crawlers that don't run JS never get here, and automated browsers
 * announce themselves via webdriver.
 */
export function VisitBeacon() {
  const pathname = usePathname();

  useEffect(() => {
    if (navigator.webdriver) return;
    send({ type: "view", path: pathname, referrer: document.referrer });

    // Only visible time counts; a backgrounded tab isn't being read. Each
    // stretch is sent when it ends, since a closing tab may never get another
    // chance — the server sums them per page.
    let visibleSince = document.visibilityState === "visible" ? performance.now() : null;
    const flush = () => {
      if (visibleSince === null) return;
      send({ type: "time", path: pathname, ms: Math.round(performance.now() - visibleSince) });
      visibleSince = null;
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
      else visibleSince = performance.now();
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flush);
    return () => {
      flush();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flush);
    };
  }, [pathname]);

  useEffect(() => {
    if (navigator.webdriver) return;
    const onClick = (e: MouseEvent) => {
      const link = trackedLink(e.target);
      if (!link) return;
      const label = (link.getAttribute("aria-label") ?? link.textContent ?? "").trim();
      send({
        type: "click",
        path: location.pathname,
        href: link.href,
        label: label.slice(0, 120) || undefined,
      });
    };
    // Capture phase, so links that stop propagation are still seen;
    // auxclick catches middle-click "open in new tab".
    document.addEventListener("click", onClick, true);
    document.addEventListener("auxclick", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("auxclick", onClick, true);
    };
  }, []);

  return null;
}
