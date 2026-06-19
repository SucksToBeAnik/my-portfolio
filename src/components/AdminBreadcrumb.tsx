"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { House } from "@phosphor-icons/react";

const labels: Record<string, string> = {
  dashboard: "Dashboard",
  projects: "Projects",
  "life-events": "Life Events",
  books: "Books",
  microblogs: "Microblog",
  stacks: "Stacks",
  sites: "Sites",
};

export function AdminBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const slug = segments.length > 1 ? segments[1] : null;
  const pageLabel = slug ? (labels[slug] || slug) : null;

  return (
    <div className="flex items-center gap-1.5 text-xs font-heading text-muted mb-4 shrink-0">
      <Link href="/" className="hover:text-fg transition-colors shrink-0">
        <House weight="thin" className="w-3.5 h-3.5" />
      </Link>
      <span className="text-fg/20 shrink-0">/</span>
      <span className="text-fg/60 shrink-0">admin</span>
      {pageLabel && (
        <>
          <span className="text-fg/20 shrink-0">/</span>
          <span className="text-fg/60 shrink-0">{pageLabel}</span>
        </>
      )}
    </div>
  );
}
