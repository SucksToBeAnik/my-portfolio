"use client";

import {
  BookOpenText,
  ChatCircleDots,
  FolderOpen,
  Heart,
  House,
  MagnifyingGlass,
  Moon,
  Quotes,
  SunDim,
  Wrench,
} from "@phosphor-icons/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthMenu } from "@/components/AuthMenu";
import { useTheme } from "@/lib/ThemeProvider";

const ChatPopup = dynamic(() => import("@/components/ChatPopup").then((m) => m.ChatPopup), {
  ssr: false,
});

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
  useEffect(() => {
    const handler = () => setChatOpen(true);
    window.addEventListener("openchat", handler);
    return () => window.removeEventListener("openchat", handler);
  }, []);

  if (pathname.startsWith("/admin")) return null;

  return (
    <>
      <ChatPopup open={chatOpen} onClose={() => setChatOpen(false)} />
      <nav className="fixed bottom-0 left-0 right-0 flex justify-center pb-4 pointer-events-none z-50">
        <div className="flex items-center justify-center w-full max-w-[700px] mx-4 px-1.5 py-1.5 bg-nav-bg backdrop-blur-xl rounded-full border border-nav-border pointer-events-auto">
          <div className="flex items-center gap-0 sm:gap-0.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
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
