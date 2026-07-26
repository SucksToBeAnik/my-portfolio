"use client";

import { Briefcase, ChatCircleDots, House, Quotes, Wrench } from "@phosphor-icons/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Fragment, useEffect, useRef, useState } from "react";
import { PreferencesMenu } from "@/components/PreferencesMenu";

const ChatPopup = dynamic(() => import("@/components/ChatPopup").then((m) => m.ChatPopup), {
  ssr: false,
});

// Life, Books and Watch deliberately aren't here — they're reached from the
// homepage's explore tiles instead, which keeps the pill down to the sections
// that earn a permanent entry. The retired desktop rail that carried all seven
// lives in `@/components/archived/DesktopRail`.
const navItems = [
  { href: "/", label: "Home", icon: House },
  { href: "/projects", label: "Projects", icon: Briefcase },
  { href: "/posts", label: "Posts", icon: Quotes },
  { href: "/stacks", label: "Stacks", icon: Wrench },
];

const subTabs: Record<string, { label: string; href: string }[]> = {};

// Shared trigger for every pill entry: just the icon, with the name revealed as
// a tooltip above it on hover. Labels used to sit inline at `sm` and up, but with
// Life/Books/Watch gone the pill is short enough that icons alone read cleanly —
// and a uniform tile width keeps it from shifting as entries come and go.
function NavIcon({
  icon: Icon,
  label,
  active,
  hint,
}: {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  /** Optional keyboard shortcut shown alongside the tooltip label. */
  hint?: string;
}) {
  return (
    <>
      <span className="flex items-center justify-center transition-transform duration-200 ease-out group-hover/nav:scale-110">
        <Icon
          weight={active ? "fill" : "thin"}
          className={`w-4 h-4 shrink-0 ${active ? "text-nav-active-icon" : ""}`}
        />
      </span>
      <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 flex -translate-x-1/2 translate-y-1 items-center gap-1.5 whitespace-nowrap rounded-lg border border-nav-border bg-nav-popup-bg px-2 py-1 font-heading text-[10px] uppercase tracking-wider text-nav-text-hover opacity-0 shadow-lg transition-all duration-150 group-hover/nav:translate-y-0 group-hover/nav:opacity-100">
        {label}
        {hint && <kbd className="text-nav-text">{hint}</kbd>}
      </span>
    </>
  );
}

const TRIGGER =
  "group/nav relative flex items-center justify-center w-8 h-8 rounded-full text-nav-text hover:text-nav-text-hover transition-colors duration-200 shrink-0";

function NavItem({
  href,
  label,
  icon,
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
      <Link href={href} onClick={onClick} aria-label={label} className={TRIGGER}>
        <NavIcon icon={icon} label={label} active={isActive} />
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
      <Link href={href} aria-label={label} className={`${TRIGGER} select-none`}>
        <NavIcon icon={icon} label={label} active={isActive} />
      </Link>
    </div>
  );
}

// Ask lives in the pill rather than the homepage hero: it answers questions about
// any page you happen to be on, so it belongs with the persistent controls.
function AskItem() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent("openchat"))}
      aria-label="Ask me anything"
      className={`${TRIGGER} cursor-pointer`}
    >
      <NavIcon icon={ChatCircleDots} label="Ask Me" hint="⌘/" />
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
  const [pillPrefsOpen, setPillPrefsOpen] = useState(false);

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
      <nav className="fixed bottom-0 left-0 right-0 flex justify-center pb-4 pointer-events-none z-50">
        {/* Width comes from the tiles, not the viewport — the pill should read as
            a floating object, so it hugs its contents and stays centred. */}
        <div className="flex items-center justify-center max-w-[calc(100%-2rem)] px-1.5 py-1.5 bg-nav-bg backdrop-blur-xl rounded-full border border-nav-border pointer-events-auto">
          <div className="flex items-center gap-1">
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
            {/* Ask closes the section group — it's an action, not a page, so it
                sits behind its own hairline just like preferences. */}
            {/* <div className="w-px h-4 mx-1 sm:mx-2 bg-nav-border" /> */}
            <AskItem />
          </div>

          <div className="flex items-center shrink-0 ml-1">
            <div className="w-px h-4 mx-2 bg-nav-border" />
            <PreferencesMenu open={pillPrefsOpen} onOpenChange={setPillPrefsOpen} />
          </div>
        </div>
      </nav>
    </>
  );
}
