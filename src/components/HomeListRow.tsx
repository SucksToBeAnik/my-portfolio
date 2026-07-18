import Link from "next/link";

export function HomeListRow({
  title,
  meta,
  href,
  external,
}: {
  title: string;
  meta?: string;
  href?: string;
  external?: boolean;
}) {
  const inner = (
    <>
      <h3 className="truncate text-sm transition-colors group-hover:text-fg/80">{title}</h3>
      {meta && (
        <span className="shrink-0 font-heading text-[11px] uppercase tracking-wider text-muted">
          {meta}
        </span>
      )}
    </>
  );

  const cls = "group flex items-center justify-between gap-3 border-b border-hairline/50 py-2.5";

  if (!href) {
    return <div className={cls}>{inner}</div>;
  }

  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
      {inner}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  );
}
