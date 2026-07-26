import Link from "next/link";

export function SectionHeader({
  label,
  href,
  linkLabel,
  bordered,
}: {
  label: string;
  href?: string;
  linkLabel?: string;
  /** Hairline under the header, matching the list rows below it. */
  bordered?: boolean;
}) {
  return (
    <div
      className={
        bordered
          ? "flex items-baseline justify-between border-b border-hairline/50 pb-2.5"
          : "flex items-baseline justify-between mb-4"
      }
    >
      <h2 className="text-xs font-heading uppercase tracking-wider text-muted">{label}</h2>
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
