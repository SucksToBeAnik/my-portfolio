import type { Icon } from "@phosphor-icons/react";
import { ArrowUpRight, FolderSimple, NotePencil, Scroll } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { RELATED_KIND_LABELS, type RelatedItem, type RelatedKind } from "@/lib/research";

const ICONS: Record<RelatedKind, Icon> = {
  publication: Scroll,
  post: NotePencil,
  project: FolderSimple,
};

export function RelatedLink({ item }: { item: RelatedItem }) {
  const KindIcon = ICONS[item.kind];
  const inner = (
    <>
      <KindIcon weight="light" className="h-3.5 w-3.5 shrink-0 text-muted" />
      <span className="min-w-0 flex-1 truncate">{item.title}</span>
      <span className="shrink-0 font-heading text-[10px] uppercase tracking-wider text-muted">
        {RELATED_KIND_LABELS[item.kind]}
      </span>
      {item.external && item.href && (
        <ArrowUpRight weight="light" className="h-3 w-3 shrink-0 text-muted" />
      )}
    </>
  );
  const cls = "flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-fg/80";
  const linkCls = `${cls} transition-colors hover:bg-hover-bg hover:text-fg`;

  if (!item.href) return <div className={cls}>{inner}</div>;
  return item.external ? (
    <a href={item.href} target="_blank" rel="noopener noreferrer" className={linkCls}>
      {inner}
    </a>
  ) : (
    <Link href={item.href} className={linkCls}>
      {inner}
    </Link>
  );
}
