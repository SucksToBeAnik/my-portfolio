"use client";

import { Envelope, Lock, UserCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";

export function AuthMenu({
  placement = "up",
  fill = false,
}: {
  placement?: "up" | "right";
  fill?: boolean;
}) {
  const { status } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isLoggedIn = status === "authenticated";

  const toggle = useCallback(() => setOpen((v) => !v), []);

  useEffect(() => {
    if (!open) {
      setEmail("");
      setPassword("");
      setError("");
    }
  }, [open]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [open]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (res?.error) {
        setError("Invalid email or password");
      } else {
        setOpen(false);
        router.refresh();
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  // `fill` makes the trigger occupy its whole container (so the entire nav
  // tile is clickable) and defers the hover treatment to that tile — no
  // self-scaling. The compact default is used inline in the mobile pill.
  const triggerCls = fill
    ? "flex items-center justify-center w-full h-full rounded-2xl text-nav-text hover:text-nav-text-hover transition-colors cursor-pointer"
    : "flex items-center justify-center w-7 h-7 rounded-full text-nav-text hover:text-nav-text-hover hover:scale-110 transition-all duration-200 cursor-pointer";

  if (isLoggedIn) {
    return (
      <Link href="/admin/dashboard" aria-label="Admin dashboard" className={triggerCls}>
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-nav-active-bg text-nav-active-text text-[10px] font-medium">
          A
        </span>
      </Link>
    );
  }

  return (
    <div ref={menuRef} className={`relative flex ${fill ? "w-full h-full" : ""}`}>
      <button type="button" onClick={toggle} className={triggerCls} aria-label="User menu">
        <UserCircle weight="thin" className="w-5 h-5" />
      </button>

      {open && (
        <div
          className={`absolute w-56 bg-bg/95 backdrop-blur-xl border border-hairline rounded-xl shadow-2xl overflow-hidden z-[100] ${
            placement === "right"
              ? "left-full bottom-0 ml-3"
              : "bottom-full right-0 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 mb-3"
          }`}
        >
          <form onSubmit={handleLogin} className="p-3 space-y-2.5">
            <div className="relative">
              <Envelope
                weight="thin"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-nav-text pointer-events-none"
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-7 pr-2.5 py-1.5 text-xs bg-nav-hover-bg border border-nav-border rounded-lg text-fg placeholder-nav-text/50 focus:outline-none focus:border-nav-text transition-colors"
              />
            </div>
            <div className="relative">
              <Lock
                weight="thin"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-nav-text pointer-events-none"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-7 pr-2.5 py-1.5 text-xs bg-nav-hover-bg border border-nav-border rounded-lg text-fg placeholder-nav-text/50 focus:outline-none focus:border-nav-text transition-colors"
              />
            </div>
            {error && <p className="text-[11px] text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-1.5 text-xs font-medium bg-nav-active-bg text-nav-active-text rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
