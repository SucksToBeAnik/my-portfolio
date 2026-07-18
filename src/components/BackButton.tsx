"use client";

import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { useRouter } from "next/navigation";

/**
 * Detail-page back button. Returns to the previous browser URL when there's
 * in-app history; otherwise falls back to the section index (e.g. for visitors
 * landing directly from a shared link).
 */
export function BackButton({ label, fallbackHref }: { label: string; fallbackHref: string }) {
  const router = useRouter();

  function handleBack() {
    if (window.history.length > 1) {
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
      {label}
    </button>
  );
}
