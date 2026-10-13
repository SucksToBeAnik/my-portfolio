"use client";

import { Fragment, useState } from "react";
import type { Author } from "@/lib/publications";

// Bylines past this length collapse to the first few names, my own, and the
// last (usually the senior author), with the rest behind a "+N" toggle.
const COLLAPSE_AFTER = 8;
const LEAD = 3;

function visibleIndices(authors: Author[]): number[] | null {
  if (authors.length <= COLLAPSE_AFTER) return null;
  const keep = new Set([...Array(LEAD).keys(), authors.length - 1]);
  authors.forEach((a, i) => {
    if (a.self) keep.add(i);
  });
  // A "+1 more" toggle is no shorter than the name it hides — show it instead.
  for (const i of [...keep]) {
    if (!keep.has(i + 1) && keep.has(i + 2)) keep.add(i + 1);
  }
  return [...keep].sort((a, b) => a - b);
}

function Name({ author }: { author: Author }) {
  if (author.ellipsis) return <span>…</span>;
  return (
    <span className={author.self ? "font-medium text-fg" : undefined}>
      {author.name}
      {author.marks && <sup className="ml-px text-[0.7em]">{author.marks}</sup>}
    </span>
  );
}

export function AuthorList({ authors }: { authors: Author[] }) {
  const [expanded, setExpanded] = useState(false);
  if (authors.length === 0) return null;

  const visible = expanded ? null : visibleIndices(authors);

  if (!visible) {
    return (
      <p className="text-xs leading-relaxed text-muted">
        {authors.map((a, i) => (
          <Fragment key={`${a.name}-${i}`}>
            {i > 0 && ", "}
            <Name author={a} />
          </Fragment>
        ))}
      </p>
    );
  }

  return (
    <p className="text-xs leading-relaxed text-muted">
      {visible.map((idx, pos) => {
        const hidden = pos > 0 ? idx - visible[pos - 1] - 1 : 0;
        return (
          <Fragment key={idx}>
            {pos > 0 && ", "}
            {hidden > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => setExpanded(true)}
                  className="cursor-pointer underline decoration-dotted underline-offset-2 hover:text-fg"
                  aria-label={`Show ${hidden} more authors`}
                >
                  +{hidden} more
                </button>
                {", "}
              </>
            )}
            <Name author={authors[idx]} />
          </Fragment>
        );
      })}
    </p>
  );
}
