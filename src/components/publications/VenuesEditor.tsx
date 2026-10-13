"use client";

import { Plus, X } from "@phosphor-icons/react";
import {
  VENUE_STATUS_LABELS,
  VENUE_STATUSES,
  VENUE_TYPE_LABELS,
  VENUE_TYPES,
  type Venue,
  type VenueStatus,
  type VenueType,
} from "@/lib/publications";

const blankVenue: Venue = {
  type: "conference",
  status: "published",
  name: "",
  year: String(new Date().getFullYear()),
  track: "",
  note: "",
  url: "",
};

export function VenuesEditor({
  venues,
  onChange,
  inputCls,
}: {
  venues: Venue[];
  onChange: (venues: Venue[]) => void;
  inputCls: string;
}) {
  const set = (i: number, patch: Partial<Venue>) =>
    onChange(venues.map((v, j) => (j === i ? { ...v, ...patch } : v)));

  return (
    <div className="space-y-2">
      {venues.map((v, i) => (
        <div key={i} className="relative space-y-2 rounded-xl border border-hairline p-3">
          <button
            type="button"
            onClick={() => onChange(venues.filter((_, j) => j !== i))}
            className="absolute top-2 right-2 rounded-md p-1 text-fg/40 hover:bg-hover-bg hover:text-fg"
            aria-label="Remove venue"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <div className="grid grid-cols-2 gap-2 pr-7">
            <select
              value={v.type}
              onChange={(e) => set(i, { type: e.target.value as VenueType })}
              className={inputCls}
            >
              {VENUE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {VENUE_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
            <select
              value={v.status}
              onChange={(e) => set(i, { status: e.target.value as VenueStatus })}
              className={inputCls}
            >
              {VENUE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {VENUE_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-[1fr_5rem] gap-2">
            <input
              value={v.name}
              onChange={(e) => set(i, { name: e.target.value })}
              placeholder={
                v.status === "under_review"
                  ? "Venue (leave blank if anonymous)"
                  : "NeurIPS, ICML, Nature…"
              }
              className={inputCls}
            />
            <input
              value={v.year}
              onChange={(e) => set(i, { year: e.target.value })}
              placeholder="Year"
              inputMode="numeric"
              className={inputCls}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              value={v.track}
              onChange={(e) => set(i, { track: e.target.value })}
              placeholder="Track / workshop name"
              className={inputCls}
            />
            <input
              value={v.note}
              onChange={(e) => set(i, { note: e.target.value })}
              placeholder="Spotlight, Oral…"
              className={inputCls}
            />
          </div>
          <input
            value={v.url}
            onChange={(e) => set(i, { url: e.target.value })}
            placeholder="Venue page URL (OpenReview, proceedings…)"
            className={inputCls}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...venues, { ...blankVenue }])}
        className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-fg/60 hover:bg-hover-bg hover:text-fg"
      >
        <Plus className="h-3.5 w-3.5" /> Add venue
      </button>
    </div>
  );
}
