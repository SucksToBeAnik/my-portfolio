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
} from "@phosphor-icons/react";
import { useTheme } from "@/lib/ThemeProvider";
import { AuthMenu } from "@/components/AuthMenu";
import { ChatPopup } from "@/components/ChatPopup";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Home", icon: House },
  { href: "/projects", label: "Projects", icon: FolderOpen },
  { href: "/life", label: "Life", icon: Heart },
  { href: "/books", label: "Books", icon: BookOpenText },
  { href: "/microblog", label: "Microblog", icon: Quotes },
  { href: "/tools", label: "Tools", icon: Wrench },
];

export function BottomNav() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [chatOpen, setChatOpen] = useState(false);

  if (pathname.startsWith("/admin")) return null;

  return (
    <>
      <ChatPopup open={chatOpen} onClose={() => setChatOpen(false)} />
      <nav className="fixed bottom-0 left-0 right-0 flex justify-center pb-4 pointer-events-none z-50">
        <div className="flex items-center justify-center w-full max-w-[680px] mx-4 px-2 py-2 bg-nav-bg backdrop-blur-xl rounded-full border border-nav-border pointer-events-auto overflow-visible">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-nav-text hover:text-nav-text-hover hover:scale-110 transition-all duration-200"
              >
                <Icon weight={isActive ? "fill" : "thin"} className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setChatOpen((p) => !p)}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-nav-text hover:text-nav-text-hover hover:scale-110 transition-all duration-200 cursor-pointer"
          >
            <ChatCircleDots weight={chatOpen ? "fill" : "thin"} className="w-4 h-4" />
            <span>Ask</span>
          </button>
          <div className="w-px h-5 mx-3 bg-nav-border" />

          <AuthMenu />

          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm text-nav-text hover:text-nav-text-hover hover:scale-110 transition-all duration-200 cursor-pointer"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <SunDim weight="thin" className="w-4 h-4" />
            ) : (
              <Moon weight="thin" className="w-4 h-4" />
            )}
          </button>
        </div>
      </nav>
    </>
  );
}
