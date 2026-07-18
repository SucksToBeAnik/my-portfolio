"use client";

import {
  BookOpenText,
  Briefcase,
  Heart,
  House,
  Moon,
  Quotes,
  SunDim,
  Television,
  Wrench,
} from "@phosphor-icons/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AuthMenu } from "@/components/AuthMenu";
import { useTheme } from "@/lib/ThemeProvider";

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
  const cls = `group/rail relative flex items-center justify-center rounded-2xl backdrop-blur-xl transition-all duration-200 ease-out ${
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
    <span className="pointer-events-none absolute left-full ml-3 px-2.5 py-1 rounded-lg text-[11px] font-heading uppercase tracking-wider whitespace-nowrap bg-nav-popup-bg backdrop-blur-xl border border-nav-border text-nav-text-hover shadow-lg opacity-0 -translate-x-1 transition-all duration-150 group-hover/rail:opacity-100 group-hover/rail:translate-x-0">
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
  const { theme, toggleTheme } = useTheme();
  const [chatOpen, setChatOpen] = useState(false);
  const chatOpenRef = useRef(false);
  useEffect(() => {
    chatOpenRef.current = chatOpen;
  }, [chatOpen]);
  const [hoveredRail, setHoveredRail] = useState<number | null>(null);

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
        <div className="flex items-center justify-center w-full max-w-[700px] mx-4 px-1.5 py-1.5 bg-nav-bg backdrop-blur-xl rounded-full border border-nav-border pointer-events-auto">
          <div className="flex items-center gap-0 sm:gap-0.5">
            {navItems.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                isActive={pathname === item.href}
              />
            ))}
          </div>

          <div className="flex items-center shrink-0 ml-1">
            <div className="w-px h-4 mx-2 bg-nav-border" />
            <AuthMenu />
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-sm text-nav-text hover:text-nav-text-hover hover:scale-110 transition-all duration-200 cursor-pointer"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <SunDim weight="thin" className="w-4 h-4 shrink-0" />
              ) : (
                <Moon weight="thin" className="w-4 h-4 shrink-0" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Left rail (desktop) — icon tiles, hover reveals the label + Dock-style magnify */}
      {(() => {
        const sc = (pos: number) =>
          hoveredRail === null ? 1 : railScale(Math.abs(pos - hoveredRail));
        // Nav tiles kept as one continuous position sequence so the
        // magnification reads spatially.
        const tiles = navItems.map((item) => ({
          key: item.href,
          href: item.href,
          label: item.label,
          active: pathname === item.href,
          onClick: undefined,
          icon: item.icon,
        }));
        const dividerPos = tiles.length;
        const themePos = dividerPos + 1;
        const authPos = dividerPos + 2;
        return (
          <nav
            className="hidden lg:flex fixed left-4 top-1/2 -translate-y-1/2 z-50 flex-col items-start gap-2"
            onMouseLeave={() => setHoveredRail(null)}
          >
            {tiles.map((t, i) => {
              const Icon = t.icon;
              return (
                <RailItem
                  key={t.key}
                  href={t.href}
                  label={t.label}
                  active={t.active}
                  onClick={t.onClick}
                  scale={sc(i)}
                  onMouseEnter={() => setHoveredRail(i)}
                >
                  <Icon weight={t.active ? "fill" : "thin"} className="w-5 h-5 shrink-0" />
                </RailItem>
              );
            })}

            <div
              className="my-1 h-px w-6 self-center bg-nav-border"
              onMouseEnter={() => setHoveredRail(dividerPos)}
            />

            <RailItem
              label={theme === "dark" ? "Light" : "Dark"}
              onClick={toggleTheme}
              scale={sc(themePos)}
              onMouseEnter={() => setHoveredRail(themePos)}
            >
              {theme === "dark" ? (
                <SunDim weight="thin" className="w-5 h-5 shrink-0" />
              ) : (
                <Moon weight="thin" className="w-5 h-5 shrink-0" />
              )}
            </RailItem>
            <div
              className="flex items-center justify-center rounded-2xl bg-nav-bg backdrop-blur-xl transition-all duration-200 ease-out shrink-0"
              style={{
                width: `${RAIL_BASE * sc(authPos)}px`,
                height: `${RAIL_BASE * sc(authPos)}px`,
              }}
              onMouseEnter={() => setHoveredRail(authPos)}
            >
              <AuthMenu placement="right" />
            </div>
          </nav>
        );
      })()}
    </>
  );
}
