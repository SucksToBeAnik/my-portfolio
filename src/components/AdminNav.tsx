"use client";

import {
  BookOpenText,
  Certificate,
  FileText,
  FilmStrip,
  FolderOpen,
  Globe,
  Heart,
  Image,
  Lightbulb,
  Quotes,
  SquaresFour,
  Wrench,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: SquaresFour },
  { href: "/admin/projects", label: "Projects", icon: FolderOpen },
  { href: "/admin/publications", label: "Publications", icon: Certificate },
  { href: "/admin/life-events", label: "Life Events", icon: Heart },
  { href: "/admin/books", label: "Books", icon: BookOpenText },
  { href: "/admin/microblogs", label: "Microblog", icon: Quotes },
  { href: "/admin/stacks", label: "Stacks", icon: Wrench },
  { href: "/admin/sites", label: "Sites", icon: Globe },
  { href: "/admin/media", label: "Media", icon: FilmStrip },
  { href: "/admin/gallery", label: "Gallery", icon: Image },
  { href: "/admin/tils", label: "TIL", icon: Lightbulb },
  { href: "/admin/cvs", label: "CVs", icon: FileText },
];

export function AdminNav({ variant }: { variant?: "sidebar" | "bottom" }) {
  const pathname = usePathname();

  return (
    <>
      {(!variant || variant === "sidebar") && (
        <nav className="hidden md:flex flex-col gap-1 flex-1 min-h-0 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors shrink-0 ${
                  isActive ? "text-fg bg-hover-bg" : "text-fg/60 hover:text-fg hover:bg-hover-bg"
                }`}
              >
                <Icon weight={isActive ? "fill" : "thin"} className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}

      {(!variant || variant === "bottom") && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden flex items-center justify-around px-2 py-2 bg-bg/95 backdrop-blur-xl border-t border-hairline overflow-x-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] transition-colors shrink-0 ${
                  isActive ? "text-fg" : "text-fg/50 hover:text-fg"
                }`}
              >
                <Icon weight={isActive ? "fill" : "thin"} className="w-4 h-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </>
  );
}
