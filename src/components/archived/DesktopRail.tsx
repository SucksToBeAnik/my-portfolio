"use client";

/**
 * ARCHIVED — not mounted anywhere.
 *
 * The left vertical rail that used to replace the bottom pill at `lg` and up:
 * icon tiles with Dock-style magnification and a label pill on hover. Retired
 * when Life, Books and Watch moved out of the nav and onto the homepage as
 * explore tiles — four entries didn't justify a second nav layout, so the pill
 * now runs at every breakpoint (see `@/components/BottomNav`).
 *
 * Kept intact for reference. If it ever comes back, mount `<DesktopRail />`
 * alongside the pill and re-add the pill's `lg:hidden`.
 */

import {
  BookOpenText,
  Briefcase,
  Heart,
  House,
  Quotes,
  Television,
  Wrench,
} from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { PreferencesMenu } from "@/components/PreferencesMenu";

const navItems = [
  { href: "/", label: "Home", icon: House },
  { href: "/projects", label: "Projects", icon: Briefcase },
  { href: "/posts", label: "Posts", icon: Quotes },
  { href: "/life", label: "Life", icon: Heart },
  { href: "/books", label: "Books", icon: BookOpenText },
  { href: "/media", label: "Watch", icon: Television },
  { href: "/stacks", label: "Stacks", icon: Wrench },
];

type RailEntry =
  | { kind: "tile"; item: (typeof navItems)[number] }
  | { kind: "divider" }
  | { kind: "prefs" };

// Dock-style magnification: the hovered tile scales up the most, its two
// neighbours less. Tiles grow by real size so the rest of the column reflows
// (and stays left-anchored via the container's items-start).
const RAIL_BASE = 44;
function railScale(distance: number) {
  if (distance <= 0) return 1.32;
  if (distance === 1) return 1.14;
  return 1;
}

// An icon tile that reveals its label as a pill on hover.
function RailItem({
  href,
  onClick,
  label,
  active,
  scale = 1,
  onMouseEnter,
  children,
}: {
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  label: string;
  active?: boolean;
  scale?: number;
  onMouseEnter?: () => void;
  children: React.ReactNode;
}) {
  const cls = `group/rail relative flex items-center justify-center rounded-2xl transition-all duration-200 ease-out ${
    active
      ? "bg-nav-active-bg text-nav-active-text"
      : "bg-nav-bg text-nav-text hover:bg-hover-bg hover:text-nav-text-hover"
  }`;
  const px = RAIL_BASE * scale;
  const style = { width: `${px}px`, height: `${px}px` };
  const icon = (
    <span
      className="flex items-center justify-center transition-transform duration-200 ease-out"
      style={{ transform: `scale(${scale})` }}
    >
      {children}
    </span>
  );
  const labelPill = (
    <span className="pointer-events-none absolute left-full ml-3 px-2.5 py-1 rounded-lg text-[11px] font-heading uppercase tracking-wider whitespace-nowrap bg-nav-popup-bg border border-nav-border text-nav-text-hover shadow-lg opacity-0 -translate-x-1 transition-all duration-150 group-hover/rail:opacity-100 group-hover/rail:translate-x-0">
      {label}
    </span>
  );
  if (href) {
    return (
      <Link
        href={href}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        aria-label={label}
        className={cls}
        style={style}
      >
        {icon}
        {labelPill}
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      aria-label={label}
      className={`${cls} cursor-pointer`}
      style={style}
    >
      {icon}
      {labelPill}
    </button>
  );
}

export function DesktopRail() {
  const pathname = usePathname();
  const [hoveredRail, setHoveredRail] = useState<number | null>(null);
  const [railPrefsOpen, setRailPrefsOpen] = useState(false);

  // Reset the rail magnification on navigation: clicking a tile that leaves for
  // a page without the nav (e.g. /admin) unmounts the rail before onMouseLeave
  // can fire, so the hovered index would otherwise persist and re-render the
  // tile pre-scaled on return.
  useEffect(() => {
    setHoveredRail(null);
  }, [pathname]);

  // Magnification is suspended while the preferences popover is open: the
  // popover is anchored to its tile, so letting that tile resize under an
  // open menu would slide the menu around.
  const sc = (pos: number) =>
    hoveredRail === null || railPrefsOpen ? 1 : railScale(Math.abs(pos - hoveredRail));

  // Three groups — home, sections, preferences — separated by hairlines.
  // Dividers take a position in the same sequence as the tiles so the
  // magnification still reads spatially as the cursor travels the rail.
  const entries: RailEntry[] = [
    { kind: "tile", item: navItems[0] },
    { kind: "divider" },
    ...navItems.slice(1).map((item) => ({ kind: "tile" as const, item })),
    { kind: "divider" },
    { kind: "prefs" },
  ];

  return (
    <nav
      className="hidden lg:flex fixed left-4 top-1/2 -translate-y-1/2 z-50 flex-col items-start gap-2"
      onMouseLeave={() => setHoveredRail(null)}
    >
      {entries.map((entry, i) => {
        if (entry.kind === "divider") {
          return (
            <div
              key={`divider-${i}`}
              className="my-1 h-px w-6 self-center bg-nav-border"
              onMouseEnter={() => setHoveredRail(i)}
            />
          );
        }

        if (entry.kind === "prefs") {
          return (
            <div
              key="prefs"
              className={`flex items-center justify-center rounded-2xl transition-all duration-200 ease-out shrink-0 ${
                railPrefsOpen
                  ? "bg-hover-bg text-nav-text-hover"
                  : "bg-nav-bg text-nav-text hover:bg-hover-bg hover:text-nav-text-hover"
              }`}
              style={{
                width: `${RAIL_BASE * sc(i)}px`,
                height: `${RAIL_BASE * sc(i)}px`,
              }}
              onMouseEnter={() => setHoveredRail(i)}
            >
              <PreferencesMenu
                open={railPrefsOpen}
                onOpenChange={setRailPrefsOpen}
                placement="right"
                fill
              />
            </div>
          );
        }

        const { item } = entry;
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <RailItem
            key={item.href}
            href={item.href}
            label={item.label}
            active={active}
            scale={sc(i)}
            onMouseEnter={() => setHoveredRail(i)}
          >
            <Icon weight={active ? "fill" : "thin"} className="w-5 h-5 shrink-0" />
          </RailItem>
        );
      })}
    </nav>
  );
}
