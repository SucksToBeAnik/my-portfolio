import { NotePencil } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

// Rows are separated by space and a rounded hover wash rather than dividers.
export function HomeListRow({
  title,
  meta,
  href,
  external,
  imageUrl,
}: {
  title: string;
  meta?: string;
  href?: string;
  external?: boolean;
  /** Small square thumbnail before the title; an empty tile keeps rows aligned. */
  imageUrl?: string | null;
}) {
  const inner = (
    <>
      {imageUrl !== undefined && (
        <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-hover-bg">
          {imageUrl ? (
            // Plain <img> (not next/image) so animated GIFs keep playing.
            <img src={imageUrl} alt="" loading="lazy" className="size-full object-cover" />
          ) : (
            <NotePencil weight="light" className="size-4 text-muted" />
          )}
        </div>
      )}
      <h3 className="min-w-0 flex-1 truncate text-sm transition-colors group-hover:text-fg/80">
        {title}
      </h3>
      {meta && (
        <span className="shrink-0 font-heading text-[11px] uppercase tracking-wider text-muted">
          {meta}
        </span>
      )}
    </>
  );

  const cls = `group -mx-2 flex items-center gap-3 rounded-xl px-2 py-2 ${href ? "transition-colors hover:bg-hover-bg" : ""}`;

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
