"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { refreshMetadata } from "@/actions/maintenance";

/**
 * Repairs rows whose Microlink lookup never succeeded and copies any image
 * still hosted on a third party onto our own CDN. This used to happen inside
 * the /sites and /stacks renders, where it sat on the critical path of a page
 * every visitor waits for.
 */
export function RefreshMetadataButton() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  function run() {
    startTransition(async () => {
      try {
        const report = await refreshMetadata();
        const total = report.sites + report.stacks + report.books;
        setResult(
          total === 0
            ? "Everything already up to date"
            : `Updated ${report.sites} sites, ${report.stacks} stacks, ${report.books} books`,
        );
        toast.success(total === 0 ? "Nothing to refresh" : `Refreshed ${total} rows`);
      } catch {
        toast.error("Refresh failed");
      }
    });
  }

  return (
    <div className="border border-hairline rounded-xl p-4 space-y-3">
      <div className="space-y-1">
        <p className="text-xs text-fg/50">Link metadata & images</p>
        <p className="text-[11px] text-fg/30">
          Retries failed title lookups and copies site logos, stack icons and book covers onto our
          own CDN.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={run}
          disabled={pending}
          className="px-3 py-1.5 text-xs font-medium bg-fg text-bg rounded-lg hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer"
        >
          {pending ? "Refreshing…" : "Refresh metadata"}
        </button>
        {result && <span className="text-[11px] text-fg/40">{result}</span>}
      </div>
    </div>
  );
}
