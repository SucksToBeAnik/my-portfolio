"use client";

import { useEffect, useState } from "react";

function relativeLabel(time: number): string | null {
  if (Number.isNaN(time)) return null;
  const days = Math.floor((Date.now() - time) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? "s" : ""} ago`;
  const years = Math.floor(days / 365);
  return `${years} year${years > 1 ? "s" : ""} ago`;
}

/**
 * "3 days ago" measured against the *visitor's* clock rather than the clock at
 * render time. The pages using this are cached until an admin write, so a label
 * baked into the HTML would keep aging with the cache entry; the effect
 * re-derives it on mount. suppressHydrationWarning because the server text is
 * correct for whenever the page was rendered, which is legitimately not now.
 */
export function RelativeDate({ date, className }: { date: string | Date; className?: string }) {
  const time = new Date(date).getTime();
  const [label, setLabel] = useState(() => relativeLabel(time));

  useEffect(() => setLabel(relativeLabel(time)), [time]);

  if (label === null) return null;

  return (
    <time dateTime={new Date(time).toISOString()} className={className} suppressHydrationWarning>
      {label}
    </time>
  );
}
