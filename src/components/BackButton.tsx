"use client";

import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { labelForPath } from "@/lib/sectionLabel";

/**
 * Detail-page back button. When there's an in-app page to return to, it goes
 * back and labels itself with that page (e.g. "Home" when arriving from `/`).
 * Otherwise — a direct visit from a shared link — it falls back to the section
 * index and its default label.
 */
export function BackButton({ label, fallbackHref }: { label: string; fallbackHref: string }) {
  const router = useRouter();
  const [state, setState] = useState<{ label: string; canGoBack: boolean }>({
    label,
    canGoBack: false,
  });

  useEffect(() => {
    let prev: string | null = null;
    try {
      prev = sessionStorage.getItem("navPrevPath");
    } catch {
      prev = null;
    }
    if (prev && window.history.length > 1) {
      setState({ label: labelForPath(prev), canGoBack: true });
    }
  }, []);

  function handleBack() {
    if (state.canGoBack) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className="inline-flex items-center gap-1 text-xs text-muted transition-colors hover:text-fg"
    >
      <ArrowLeft weight="thin" className="w-3.5 h-3.5" />
      {state.label}
    </button>
  );
}
