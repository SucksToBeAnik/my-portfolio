"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  FolderOpen,
  Heart,
  BookOpenText,
  Quotes,
  Wrench,
  ChatCircleDots,
  SunDim,
  Moon,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { useTheme } from "@/lib/ThemeProvider";
import { AuthMenu } from "@/components/AuthMenu";
import { ChatPopup } from "@/components/ChatPopup";
import { useState, useCallback, useEffect, useRef } from "react";

const navItems = [
  { href: "/", label: "Home", icon: House },
  { href: "/projects", label: "Projects", icon: FolderOpen },
  { href: "/life", label: "Life", icon: Heart },
  { href: "/books", label: "Books", icon: BookOpenText },
  { href: "/microblog", label: "Microblog", icon: Quotes },
  { href: "/utils", label: "Utils", icon: Wrench },
];

export function BottomNav() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [chatOpen, setChatOpen] = useState(false);
  const [utilsHover, setUtilsHover] = useState(false);

  useEffect(() => {
    const handler = () => setChatOpen(true);
    window.addEventListener("openchat", handler);
    return () => window.removeEventListener("openchat", handler);
  }, []);
  const utilsTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const isUtils = pathname === "/utils";

  function startUtilsHover() {
    clearTimeout(utilsTimeout.current);
    setUtilsHover(true);
  }

  function endUtilsHover() {
    utilsTimeout.current = setTimeout(() => setUtilsHover(false), 150);
  }

  if (pathname.startsWith("/admin")) return null;

  return (
    <>
      <ChatPopup open={chatOpen} onClose={() => setChatOpen(false)} />
      <nav className="fixed bottom-0 left-0 right-0 flex justify-center pb-4 pointer-events-none z-50">
        <div className="flex items-center justify-center w-full max-w-[700px] mx-4 px-1.5 py-1.5 bg-nav-bg backdrop-blur-xl rounded-full border border-nav-border pointer-events-auto">
          <div className="flex items-center  gap-0 sm:gap-0.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              if (item.href === "/utils") {
                return (
                  <div key={item.href} className="relative" onMouseEnter={startUtilsHover} onMouseLeave={endUtilsHover}>
                    <Link
                      href="/utils"
                      className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs text-nav-text hover:text-nav-text-hover hover:scale-110 transition-all duration-200 shrink-0"
                    >
                      <Icon weight={isActive || utilsHover ? "fill" : "thin"} className="w-4 h-4 shrink-0" />
                      <span className="hidden sm:inline">{item.label}</span>
                    </Link>
                    {utilsHover && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex gap-1 bg-bg/95 backdrop-blur-xl border border-hairline rounded-lg shadow-2xl p-1 z-[100] whitespace-nowrap"
                        onMouseEnter={startUtilsHover}
                        onMouseLeave={endUtilsHover}
                      >
                        <Link href="/utils?tab=stacks" className="px-2.5 py-1.5 text-xs text-fg/60 hover:text-fg hover:bg-hover-bg rounded-md transition-colors">Stacks</Link>
                        <Link href="/utils?tab=sites" className="px-2.5 py-1.5 text-xs text-fg/60 hover:text-fg hover:bg-hover-bg rounded-md transition-colors">Sites</Link>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs text-nav-text hover:text-nav-text-hover hover:scale-110 transition-all duration-200 shrink-0"
                >
                  <Icon weight={isActive ? "fill" : "thin"} className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => setChatOpen((p) => !p)}
              className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs text-nav-text hover:text-nav-text-hover hover:scale-110 transition-all duration-200 cursor-pointer shrink-0"
            >
              <ChatCircleDots weight={chatOpen ? "fill" : "thin"} className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Ask</span>
            </button>
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
          </div>
        </div>
      </nav>
    </>
  );
}
