import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

export function SectionHeader({
  label,
  href,
  linkLabel,
}: {
  label: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex items-baseline justify-between mb-4">
      <h2 className="text-xs font-heading uppercase tracking-wider text-muted">{label}</h2>
      {href && (
        <Link
          href={href}
          className="group inline-flex items-center gap-1 text-xs text-muted hover:text-fg transition-colors"
        >
          {linkLabel ?? "See all"}
          <ArrowRight
            weight="thin"
            className="w-3 h-3 -translate-x-0.5 group-hover:translate-x-0 transition-transform"
          />
        </Link>
      )}
    </div>
  );
}
