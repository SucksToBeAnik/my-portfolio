"use client";

import { Eye, PencilSimpleLine } from "@phosphor-icons/react";

/** Segmented Edit / Preview pill for the post and project editors. */
export function EditPreviewToggle({
  preview,
  onChange,
}: {
  preview: boolean;
  onChange: (preview: boolean) => void;
}) {
  return (
    <div className="flex items-center rounded-lg border border-hairline p-0.5 text-xs">
      <button
        type="button"
        onClick={() => onChange(false)}
        aria-pressed={!preview}
        className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 transition-colors ${
          preview ? "text-fg/60 hover:text-fg" : "bg-fg text-bg"
        }`}
      >
        <PencilSimpleLine weight="thin" className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Edit</span>
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        aria-pressed={preview}
        className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 transition-colors ${
          preview ? "bg-fg text-bg" : "text-fg/60 hover:text-fg"
        }`}
      >
        <Eye weight="thin" className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Preview</span>
      </button>
    </div>
  );
}
