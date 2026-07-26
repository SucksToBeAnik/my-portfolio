"use client";

import { play, type SoundName, setEnabled as setCuelumeEnabled, sounds } from "cuelume";
import { createContext, useContext, useEffect, useState } from "react";

// Sound marks events, not every contact with the page. Two rules cover the
// whole site:
//
//   [data-sound="chime"]  → chime    you moved between sections from the nav
//   button[type=submit]   → success  you committed something
//
// Everything else is silent — every other link, opening a menu, toggling a
// filter, an editor toolbar, a modal's cancel — because operating the UI isn't
// an event. Chiming on every `a[href]` is what made this annoying: a page full
// of links turned into an instrument.
//
// Any element can override with `data-sound="<name>"` (see `sounds` for the
// list); that's how reactions, deletes, and the preferences toggles opt into
// success without being submits. `data-nosound` mutes a subtree.
const COMMIT = 'button[type="submit"]';
const SOUNDED = `[data-sound], ${COMMIT}`;
const COMMIT_SOUND: SoundName = "success";
// Both sounds run past 300ms with their tails, so unthrottled double-clicks
// would stack them on top of each other.
const MIN_INTERVAL_MS = 120;

const SoundContext = createContext<{
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
} | null>(null);

function isSoundName(value: string | null): value is SoundName {
  return value !== null && (sounds as readonly string[]).includes(value);
}

function soundFor(target: EventTarget | null): SoundName | null {
  if (!(target instanceof Element)) return null;
  const el = target.closest(SOUNDED);
  if (!el) return null;
  if (el.closest("[data-nosound]")) return null;
  if (el instanceof HTMLButtonElement && el.disabled) return null;
  const override = el.getAttribute("data-sound");
  if (isSoundName(override)) return override;
  return COMMIT_SOUND;
}

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabledState] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const on = localStorage.getItem("sound") !== "off";
    setCuelumeEnabled(on);
    setEnabledState(on);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("sound", enabled ? "on" : "off");
  }, [enabled, mounted]);

  useEffect(() => {
    if (!mounted) return;

    // Press only, no release sound: a struck bell has no release, and two
    // chimes per click reads as a double-click. cuelume itself no-ops while
    // disabled, so the listener can stay attached.
    let lastPlayedAt = -Infinity;
    function onPointerDown(e: PointerEvent) {
      if (e.button !== 0) return;
      const sound = soundFor(e.target);
      if (!sound) return;
      const at = performance.now();
      if (at - lastPlayedAt < MIN_INTERVAL_MS) return;
      lastPlayedAt = at;
      play(sound);
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [mounted]);

  const setEnabled = (next: boolean) => {
    setCuelumeEnabled(next);
    // Turning it on is otherwise silent — the press that flipped the switch was
    // muted at the time it happened.
    if (next && !enabled) play(COMMIT_SOUND);
    setEnabledState(next);
  };

  return <SoundContext.Provider value={{ enabled, setEnabled }}>{children}</SoundContext.Provider>;
}

export function useSound() {
  const ctx = useContext(SoundContext);
  if (!ctx) throw new Error("useSound must be used within SoundProvider");
  return ctx;
}
