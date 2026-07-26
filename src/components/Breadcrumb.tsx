import { House } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import type { ReactNode } from "react";

interface Crumb {
  label?: string;
  icon?: ReactNode;
  href?: string;
}

// Icon-only crumbs are the whole tap target, so they get negative margins to
// claw back padding — a comfortable hit area without disturbing the trail's
// spacing. Icons are `regular` weight, not `thin`: hairline strokes wash out
// against the near-white light background.
const ICON_LINK =
  "-m-1.5 p-1.5 rounded-md hover:text-fg hover:bg-hover-bg transition-colors flex items-center gap-1.5";

export function Breadcrumb({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <div className="flex items-center gap-1.5 text-xs font-heading text-fg/60">
      <Link href="/" aria-label="Home" className={ICON_LINK}>
        <House weight="regular" className="w-4 h-4" />
      </Link>
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <span className="text-fg/25">/</span>
          {crumb.href ? (
            <Link href={crumb.href} className={`${ICON_LINK} uppercase tracking-wider`}>
              {crumb.icon}
              {crumb.label && <span>{crumb.label}</span>}
            </Link>
          ) : (
            <span className="text-fg/70 uppercase tracking-wider flex items-center gap-1.5">
              {crumb.icon}
              {crumb.label && <span>{crumb.label}</span>}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}
