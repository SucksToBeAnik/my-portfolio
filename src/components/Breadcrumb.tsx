import { House } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

export function Breadcrumb({ crumbs }: { crumbs: { label: string; href?: string }[] }) {
  return (
    <div className="flex items-center gap-1.5 text-xs font-heading text-muted mb-4">
      <Link href="/" className="hover:text-fg transition-colors">
        <House weight="thin" className="w-3.5 h-3.5" />
      </Link>
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <span className="text-fg/20">/</span>
          {crumb.href ? (
            <Link href={crumb.href} className="hover:text-fg transition-colors">
              {crumb.label}
            </Link>
          ) : (
            <span className="text-fg/60">{crumb.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}
