"use client";

import { Star } from "@phosphor-icons/react";

export function StarRating({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange((value ?? 0) === n ? null : n)}
          className={`p-1.5 rounded transition-colors cursor-pointer hover:text-fg ${
            (value ?? 0) >= n ? "text-fg" : "text-fg/30"
          }`}
        >
          <Star weight="fill" className="w-4 h-4" />
        </button>
      ))}
    </div>
  );
}
