"use client";

import { Funnel } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";

interface FilterPopoverProps {
  tags: string[];
  active: string[];
  onChange: (tags: string[]) => void;
  label?: string;
}

export function FilterPopover({ tags, active, onChange, label }: FilterPopoverProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  if (tags.length === 0) return null;

  const hasActive = active.length > 0;

  function toggle(tag: string) {
    if (active.includes(tag)) {
      onChange(active.filter((t) => t !== tag));
    } else {
      onChange([...active, tag]);
    }
  }

  const buttonLabel =
    active.length === 1 ? active[0] : active.length > 1 ? `${active.length} filters` : label;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs transition-colors cursor-pointer ${
          hasActive ? "bg-fg text-bg" : "text-fg/40 hover:text-fg hover:bg-hover-bg"
        }`}
        aria-label="Filter"
      >
        <Funnel weight={hasActive ? "fill" : "regular"} className="w-3.5 h-3.5 shrink-0" />
        {buttonLabel && <span className="max-w-[100px] truncate">{buttonLabel}</span>}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-44 bg-bg border border-hairline rounded-xl shadow-xl overflow-hidden">
          <div
            className={`overflow-hidden transition-all duration-200 ease-in-out ${hasActive ? "max-h-10 opacity-100" : "max-h-0 opacity-0"}`}
          >
            <button
              type="button"
              onClick={() => { onChange([]); setOpen(false); }}
              className="w-full px-3 py-2 text-xs text-left text-fg/40 hover:bg-hover-bg transition-colors cursor-pointer border-b border-hairline"
            >
              Clear all
            </button>
          </div>
          <div className="max-h-52 overflow-y-auto">
            {tags.map((tag) => {
              const selected = active.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggle(tag)}
                  className={`w-full px-3 py-2 text-xs text-left flex items-center gap-2 transition-colors cursor-pointer hover:bg-hover-bg ${
                    selected ? "text-fg" : "text-fg/60"
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                      selected ? "bg-fg border-fg" : "border-fg/20"
                    }`}
                  >
                    {selected && (
                      <svg viewBox="0 0 10 8" className="w-2 h-2 text-bg fill-current">
                        <path d="M1 4l2.5 2.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                      </svg>
                    )}
                  </span>
                  <span className="truncate">{tag}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
