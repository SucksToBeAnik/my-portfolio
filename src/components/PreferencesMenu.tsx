"use client";

import {
  Moon,
  SignOut,
  SlidersHorizontal,
  SpeakerHigh,
  SpeakerSlash,
  SunDim,
} from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
import { type SegmentedOption, SegmentedToggle } from "@/components/SegmentedToggle";
import { useSound } from "@/lib/SoundProvider";
import { useTheme } from "@/lib/ThemeProvider";

const themeOptions: readonly SegmentedOption<"light" | "dark">[] = [
  { value: "light", label: "Light", icon: SunDim },
  { value: "dark", label: "Dark", icon: Moon },
];

const soundOptions: readonly SegmentedOption<"on" | "off">[] = [
  { value: "on", label: "Sound on", icon: SpeakerHigh },
  { value: "off", label: "Sound off", icon: SpeakerSlash },
];

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-3 py-2">
      <span className="text-xs text-nav-text">{label}</span>
      {children}
    </div>
  );
}

// The account rows sit in the same popover as the preferences, but only once
// you're signed in — a public visitor has no reason to see that an admin exists.
// Signing in happens at /login, which nothing on the site links to.
function AccountRows() {
  return (
    <>
      <div className="mx-3 my-1 h-px bg-nav-border" />
      <Link
        href="/admin/dashboard"
        className="flex items-center gap-2.5 px-3 py-2 text-xs text-nav-text hover:text-nav-text-hover transition-colors"
      >
        <Image
          src="/logo.png"
          alt=""
          width={16}
          height={16}
          className="w-4 h-4 rounded-full object-cover shrink-0"
        />
        Dashboard
      </Link>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-nav-text hover:text-nav-text-hover transition-colors cursor-pointer text-left"
      >
        <SignOut weight="thin" className="w-4 h-4 shrink-0" />
        Sign out
      </button>
    </>
  );
}

// `fill` makes the trigger occupy its whole container (so an entire nav tile is
// clickable) and defers the hover treatment to that tile. The compact default is
// used inline in the mobile pill.
export function PreferencesMenu({
  open,
  onOpenChange,
  placement = "up",
  fill = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  placement?: "up" | "right";
  fill?: boolean;
}) {
  const { theme, setTheme } = useTheme();
  const { enabled, setEnabled } = useSound();
  const { status } = useSession();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onOpenChange(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onOpenChange]);

  const triggerCls = fill
    ? "group/prefs flex items-center justify-center w-full h-full rounded-2xl text-nav-text hover:text-nav-text-hover transition-colors cursor-pointer"
    : "flex items-center justify-center w-7 h-7 rounded-full text-nav-text hover:text-nav-text-hover hover:scale-110 transition-all duration-200 cursor-pointer";

  return (
    <div ref={menuRef} className={`relative flex ${fill ? "w-full h-full" : ""}`}>
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-label="Preferences"
        aria-expanded={open}
        className={triggerCls}
      >
        <SlidersHorizontal
          weight="thin"
          className={fill ? "w-5 h-5 shrink-0" : "w-4 h-4 shrink-0"}
        />
        {fill && !open && (
          <span className="pointer-events-none absolute left-full ml-3 px-2.5 py-1 rounded-lg text-[11px] font-heading uppercase tracking-wider whitespace-nowrap bg-nav-popup-bg border border-nav-border text-nav-text-hover shadow-lg opacity-0 -translate-x-1 transition-all duration-150 group-hover/prefs:opacity-100 group-hover/prefs:translate-x-0">
            Preferences
          </span>
        )}
      </button>

      {open && (
        <div
          className={`absolute w-56 py-1.5 bg-nav-popup-bg backdrop-blur-xl border border-nav-border rounded-2xl shadow-2xl overflow-hidden z-[100] ${
            placement === "right"
              ? "left-full bottom-0 ml-3"
              : "bottom-full right-0 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 mb-3"
          }`}
        >
          <Row label="Theme">
            <SegmentedToggle
              label="Theme"
              options={themeOptions}
              value={theme}
              onChange={setTheme}
            />
          </Row>
          <Row label="Sound">
            <SegmentedToggle
              label="Sound"
              options={soundOptions}
              value={enabled ? "on" : "off"}
              onChange={(next) => setEnabled(next === "on")}
            />
          </Row>
          {status === "authenticated" && <AccountRows />}
        </div>
      )}
    </div>
  );
}
