"use client";

import {
  BookOpenText,
  ChatCircleDots,
  Heart,
  House,
  Lightbulb,
  MagnifyingGlass,
  Moon,
  Briefcase,
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
  { href: "/life", label: "Life", icon: Heart },
  { href: "/books", label: "Books", icon: BookOpenText },
  { href: "/til", label: "TIL", icon: Lightbulb },
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

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [chatOpen, setChatOpen] = useState(false);
  const chatOpenRef = useRef(false);
  useEffect(() => { chatOpenRef.current = chatOpen; }, [chatOpen]);
  const [panelTwo, setPanelTwo] = useState(false);

  useEffect(() => {
    if (pathname !== "/") {
      setPanelTwo(false);
      return;
    }

    let removeScroll: (() => void) | null = null;

    function attach(container: HTMLElement) {
      if (removeScroll) return; // already attached
      let timer: ReturnType<typeof setTimeout>;
      function onScroll() {
        clearTimeout(timer);
        timer = setTimeout(() => {
          setPanelTwo(container.scrollTop > container.clientHeight / 2);
        }, 50);
      }
      container.addEventListener("scroll", onScroll, { passive: true });
      removeScroll = () => {
        clearTimeout(timer);
        container.removeEventListener("scroll", onScroll);
      };
    }

    const existing = document.getElementById("snap-container");
    if (existing) {
      attach(existing as HTMLElement);
      return () => removeScroll?.();
    }

    // Container not in DOM yet (page still loading) — watch for it
    const observer = new MutationObserver(() => {
      const el = document.getElementById("snap-container");
      if (!el) return;
      observer.disconnect();
      attach(el as HTMLElement);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      removeScroll?.();
    };
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

  if (pathname.startsWith("/admin")) {
    return <ChatPopup open={chatOpen} onClose={() => setChatOpen(false)} />;
  }

  return (
    <>
      <ChatPopup open={chatOpen} onClose={() => setChatOpen(false)} />
      <nav className="fixed bottom-0 left-0 right-0 flex justify-center pb-4 pointer-events-none z-50">
        <div className="flex items-center justify-center w-full max-w-[700px] mx-4 px-1.5 py-1.5 bg-nav-bg backdrop-blur-xl rounded-full border border-nav-border pointer-events-auto">
          <div className="flex items-center gap-0 sm:gap-0.5">
            <NavItem
              href={navItems[0].href}
              label={navItems[0].label}
              icon={navItems[0].icon}
              isActive={pathname === navItems[0].href && !panelTwo}
              onClick={pathname === "/" ? (e) => {
                e.preventDefault();
                setPanelTwo(false);
                document.getElementById("snap-container")?.scrollTo({ top: 0, behavior: "smooth" });
              } : undefined}
            />
            <button
              type="button"
              onClick={() => {
                if (pathname === "/") {
                  setPanelTwo(true);
                  const container = document.getElementById("snap-container");
                  container?.scrollTo({ top: container.clientHeight, behavior: "smooth" });
                } else {
                  setPanelTwo(true);
                  router.push("/?showcase=1");
                }
              }}
              className="relative flex items-center gap-1.5 px-1.5 sm:px-2.5 py-1.5 rounded-full text-xs text-nav-text hover:text-nav-text-hover hover:scale-110 transition-all duration-200 cursor-pointer shrink-0"
            >
              <Briefcase weight={panelTwo ? "fill" : "thin"} className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Work</span>
            </button>
            {navItems.slice(1).map((item) => (
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
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("opensearch"))}
              className="flex items-center gap-1 px-1.5 py-1.5 text-[10px] text-nav-text/30 hover:text-nav-text-hover transition-colors cursor-pointer"
              aria-label="Search"
            >
              <MagnifyingGlass weight="thin" className="w-4 h-4 sm:hidden" />
              <span className="hidden sm:inline">⌘K</span>
            </button>
            <button
              type="button"
              onClick={() => setChatOpen((p) => !p)}
              className="flex items-center gap-1 px-1.5 py-1.5 text-[10px] text-nav-text/30 hover:text-nav-text-hover transition-colors cursor-pointer"
              aria-label="Ask"
            >
              <ChatCircleDots weight={chatOpen ? "fill" : "thin"} className="w-4 h-4 sm:hidden shrink-0" />
              <span className="hidden sm:inline">⌘/</span>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
