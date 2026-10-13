"use client";

import { Plus, X } from "@phosphor-icons/react";
import { LINK_KINDS, type LinkKind, type PublicationLink } from "@/lib/publications";

export function LinksEditor({
  links,
  onChange,
  inputCls,
}: {
  links: PublicationLink[];
  onChange: (links: PublicationLink[]) => void;
  inputCls: string;
}) {
  const set = (i: number, patch: Partial<PublicationLink>) =>
    onChange(links.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  return (
    <div className="space-y-2">
      {links.map((l, i) => (
        <div key={i} className="grid grid-cols-[7rem_1fr_auto] items-center gap-2">
          <select
            value={l.kind}
            onChange={(e) => set(i, { kind: e.target.value as LinkKind })}
            className={inputCls}
          >
            {LINK_KINDS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
          <input
            value={l.url}
            onChange={(e) => set(i, { url: e.target.value })}
            placeholder="https://..."
            className={inputCls}
            required
          />
          <button
            type="button"
            onClick={() => onChange(links.filter((_, j) => j !== i))}
            className="rounded-md p-1 text-fg/40 hover:bg-hover-bg hover:text-fg"
            aria-label="Remove link"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...links, { kind: "code", url: "" }])}
        className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-fg/60 hover:bg-hover-bg hover:text-fg"
      >
        <Plus className="h-3.5 w-3.5" /> Add link
      </button>
    </div>
  );
}
