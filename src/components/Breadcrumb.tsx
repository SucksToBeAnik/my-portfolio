import type { ReactNode } from "react";
import { House } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

interface Crumb {
  label?: string;
  icon?: ReactNode;
  href?: string;
}

export function Breadcrumb({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <div className="flex items-center gap-1.5 text-xs font-heading text-muted">
      <Link href="/" className="hover:text-fg transition-colors">
        <House weight="thin" className="w-3.5 h-3.5" />
      </Link>
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <span className="text-fg/20">/</span>
          {crumb.href ? (
            <Link href={crumb.href} className="hover:text-fg transition-colors uppercase tracking-wider flex items-center gap-1.5">
              {crumb.icon}
              {crumb.label && <span>{crumb.label}</span>}
            </Link>
          ) : (
            <span className="text-fg/60 uppercase tracking-wider flex items-center gap-1.5">
              {crumb.icon}
              {crumb.label && <span>{crumb.label}</span>}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}
