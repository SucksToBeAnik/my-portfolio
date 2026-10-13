"use client";

import { RELATED_KINDS, type RelatedKind, type RelatedRef } from "@/lib/research";

const GROUP_LABELS: Record<RelatedKind, string> = {
  publication: "Publications",
  post: "Posts",
  project: "Projects",
};

/** Checkbox lists of existing content, grouped by kind. Order follows ticking order. */
export function RelatedPicker({
  options,
  value,
  onChange,
}: {
  options: Record<RelatedKind, { id: number; title: string }[]>;
  value: RelatedRef[];
  onChange: (value: RelatedRef[]) => void;
}) {
  const has = (kind: RelatedKind, id: number) => value.some((r) => r.kind === kind && r.id === id);
  const toggle = (kind: RelatedKind, id: number) =>
    onChange(
      has(kind, id)
        ? value.filter((r) => !(r.kind === kind && r.id === id))
        : [...value, { kind, id }],
    );

  return (
    <div className="space-y-3">
      {RELATED_KINDS.map((kind) =>
        options[kind].length === 0 ? null : (
          <div key={kind} className="space-y-1">
            <p className="text-[11px] text-fg/40">{GROUP_LABELS[kind]}</p>
            <div className="max-h-40 overflow-y-auto rounded-lg border border-hairline">
              {options[kind].map((item) => (
                <label
                  key={item.id}
                  className="flex cursor-pointer items-center gap-2 border-b border-hairline px-3 py-1.5 text-xs last:border-b-0 hover:bg-hover-bg"
                >
                  <input
                    type="checkbox"
                    checked={has(kind, item.id)}
                    onChange={() => toggle(kind, item.id)}
                    className="accent-current"
                  />
                  <span className="truncate">{item.title}</span>
                </label>
              ))}
            </div>
          </div>
        ),
      )}
    </div>
  );
}
