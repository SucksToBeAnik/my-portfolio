"use client";

import {
  BookOpenText,
  Briefcase,
  Heart,
  House,
  Quotes,
  Television,
  Wrench,
} from "@phosphor-icons/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Fragment, useEffect, useRef, useState } from "react";
import { PreferencesMenu } from "@/components/PreferencesMenu";

const ChatPopup = dynamic(() => import("@/components/ChatPopup").then((m) => m.ChatPopup), {
  ssr: false,
});

const navItems = [
  { href: "/", label: "Home", icon: House },
  { href: "/projects", label: "Projects", icon: Briefcase },
  { href: "/posts", label: "Posts", icon: Quotes },
  { href: "/life", label: "Life", icon: Heart },
  { href: "/books", label: "Books", icon: BookOpenText },
  { href: "/media", label: "Watch", icon: Television },
  { href: "/stacks", label: "Stacks", icon: Wrench },
];

const subTabs: Record<string, { label: string; href: string }[]> = {};

type RailEntry =
  | { kind: "tile"; item: (typeof navItems)[number] }
  | { kind: "divider" }
  | { kind: "prefs" };

function NavItem({
  href,
  label,
  icon: Icon,
  isActive,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  isActive: boolean;
  onClick?: (e: React.MouseEvent) => void;
}) {
  const tabs = subTabs[href];
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  if (!tabs) {
    return (
      <Link
        href={href}
        onClick={onClick}
        className="relative flex items-center gap-1.5 px-1.5 sm:px-2.5 py-1.5 rounded-full text-xs text-nav-text hover:text-nav-text-hover hover:scale-110 transition-all duration-200 shrink-0"
      >
        <Icon weight={isActive ? "fill" : "thin"} className="w-4 h-4 shrink-0" />
        <span className="hidden sm:inline">{label}</span>
      </Link>
    );
  }

  return (
    <div
      ref={wrapperRef}
      className="relative"
      onMouseEnter={() => {
        if (closeTimer.current) clearTimeout(closeTimer.current);
        setOpen(true);
      }}
      onMouseLeave={() => {
        closeTimer.current = setTimeout(() => setOpen(false), 120);
      }}
    >
      {open && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 flex flex-col items-stretch bg-nav-popup-bg backdrop-blur-xl border border-nav-border rounded-2xl px-1.5 py-1.5 shadow-xl min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.href}
              type="button"
              onClick={() => {
                setOpen(false);
                router.push(tab.href);
              }}
              className="px-3 py-1.5 text-xs text-nav-text hover:text-nav-text-hover hover:bg-white/5 rounded-xl transition-colors cursor-pointer text-left whitespace-nowrap"
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
      <Link
        href={href}
        className="relative flex items-center gap-1.5 px-1.5 sm:px-2.5 py-1.5 rounded-full text-xs text-nav-text hover:text-nav-text-hover hover:scale-110 transition-all duration-200 shrink-0 select-none"
      >
        <Icon weight={isActive ? "fill" : "thin"} className="w-4 h-4 shrink-0" />
        <span className="hidden sm:inline">{label}</span>
      </Link>
    </div>
  );
}

// Dock-style magnification: the hovered tile scales up the most, its two
// neighbours less. Tiles grow by real size so the rest of the column reflows
// (and stays left-anchored via the container's items-start).
const RAIL_BASE = 44;
function railScale(distance: number) {
  if (distance <= 0) return 1.32;
  if (distance === 1) return 1.14;
  return 1;
}

// Left rail (desktop): an icon tile that reveals its label as a pill on hover.
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

export function BottomNav() {
  const pathname = usePathname();
  const [chatOpen, setChatOpen] = useState(false);
  const chatOpenRef = useRef(false);
  useEffect(() => {
    chatOpenRef.current = chatOpen;
  }, [chatOpen]);
  const [hoveredRail, setHoveredRail] = useState<number | null>(null);
  // The mobile pill and the desktop rail are both mounted at all times (only
  // hidden by breakpoint), so they need separate open state — sharing one would
  // let the hidden copy's outside-click handler close the visible popover.
  const [pillPrefsOpen, setPillPrefsOpen] = useState(false);
  const [railPrefsOpen, setRailPrefsOpen] = useState(false);

  // Reset the rail magnification on navigation: clicking a tile that leaves for
  // a page without the nav (e.g. /admin) unmounts the rail before onMouseLeave
  // can fire, so the hovered index would otherwise persist and re-render the
  // tile pre-scaled on return.
  useEffect(() => {
    setHoveredRail(null);
  }, [pathname]);

  useEffect(() => {
    const handler = () => {
      window.dispatchEvent(new CustomEvent("closesearch"));
      window.dispatchEvent(new CustomEvent("closequickadd"));
      setChatOpen(true);
    };
    window.addEventListener("openchat", handler);
    return () => window.removeEventListener("openchat", handler);
  }, []);

  useEffect(() => {
    const handler = () => setChatOpen(false);
    window.addEventListener("closechat", handler);
    return () => window.removeEventListener("closechat", handler);
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "/" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        const willOpen = !chatOpenRef.current;
        if (willOpen) {
          window.dispatchEvent(new CustomEvent("closesearch"));
          window.dispatchEvent(new CustomEvent("closequickadd"));
        }
        setChatOpen(willOpen);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Detail pages (/posts/[id], /projects/[id], /books/[id], /media/[id], /til/[id])
  // hide the nav pill so the content has room to breathe; chat stays mounted for
  // the shortcut.
  const isDetailPage = /^\/(posts|projects|books|media|til)\/[^/]+$/.test(pathname);

  if (pathname.startsWith("/admin") || isDetailPage) {
    return <ChatPopup open={chatOpen} onClose={() => setChatOpen(false)} />;
  }

  return (
    <>
      <ChatPopup open={chatOpen} onClose={() => setChatOpen(false)} />
      <nav className="fixed bottom-0 left-0 right-0 flex justify-center pb-4 pointer-events-none z-50 lg:hidden">
        {/* Width comes from the tiles, not the viewport — the pill should read as
            a floating object, so it hugs its contents and stays centred. */}
        <div className="flex items-center justify-center max-w-[calc(100%-2rem)] px-1.5 py-1.5 bg-nav-bg backdrop-blur-xl rounded-full border border-nav-border pointer-events-auto">
          <div className="flex items-center gap-0 sm:gap-0.5">
            {navItems.map((item, i) => (
              <Fragment key={item.href}>
                {/* Home is its own group, so it gets the same hairline that
                    separates the sections from preferences. */}
                {i === 1 && <div className="w-px h-4 mx-1 sm:mx-2 bg-nav-border" />}
                <NavItem
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  isActive={pathname === item.href}
                />
              </Fragment>
            ))}
          </div>

          <div className="flex items-center shrink-0 ml-1">
            <div className="w-px h-4 mx-2 bg-nav-border" />
            <PreferencesMenu open={pillPrefsOpen} onOpenChange={setPillPrefsOpen} />
          </div>
        </div>
      </nav>

      {/* Left rail (desktop) — icon tiles, hover reveals the label + Dock-style magnify */}
      {(() => {
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
      })()}
    </>
  );
}
