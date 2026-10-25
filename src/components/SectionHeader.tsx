import Link from "next/link";
import type { ReactNode } from "react";

export function SectionHeader({
  label,
  href,
  linkLabel,
  bordered,
  aside,
}: {
  label: string;
  href?: string;
  linkLabel?: string;
  /** Hairline under the header, for list sections. Boxed sections (cards) skip
      it; their containers already frame them. */
  bordered?: boolean;
  /** Small extra on the right, e.g. a legend. */
  aside?: ReactNode;
}) {
  return (
    <div
      className={`mb-4 flex items-baseline justify-between gap-4 ${bordered ? "border-b border-hairline/50 pb-2.5" : ""}`}
    >
      <h2 className="text-xs font-heading uppercase tracking-wider text-muted">{label}</h2>
      {aside}
      {href && (
        <Link
          href={href}
          className="text-xs font-heading uppercase tracking-wider text-muted hover:text-fg transition-colors"
        >
          {linkLabel ?? "See all"}
        </Link>
      )}
    </div>
  );
}
