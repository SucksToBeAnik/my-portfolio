"use client";

import { Briefcase, House, Quotes, Wrench } from "@phosphor-icons/react";
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
    </>
  );
}
