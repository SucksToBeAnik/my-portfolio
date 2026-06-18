"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import { UserCircle, Envelope, Lock, SquaresFour, SignOut } from "@phosphor-icons/react";

export function AuthMenu() {
  const { data: session, status } = useSession();
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

  return (
    <div ref={menuRef} className="relative flex">
      <button
        type="button"
        onClick={toggle}
        className="flex items-center justify-center w-7 h-7 rounded-full text-nav-text hover:text-nav-text-hover hover:scale-110 transition-all duration-200 cursor-pointer"
        aria-label="User menu"
      >
        {isLoggedIn ? (
          <span className="w-full h-full rounded-full bg-nav-active-bg text-nav-active-text flex items-center justify-center text-[10px] font-medium">
            A
          </span>
        ) : (
          <UserCircle weight="thin" className="w-5 h-5" />
        )}
      </button>

      {open && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-56 bg-nav-bg backdrop-blur-xl border border-nav-border rounded-xl shadow-2xl overflow-hidden z-50">
          {isLoggedIn ? (
            <div className="p-2 space-y-0.5">
              <p className="px-3 py-2 text-[11px] text-nav-text">
                {session?.user?.email}
              </p>
              <Link
                href="/admin/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-left text-nav-text hover:text-nav-text-hover hover:bg-nav-hover-bg rounded-lg transition-colors"
              >
                <SquaresFour weight="thin" className="w-3.5 h-3.5" />
                Admin Dashboard
              </Link>
              <button
                type="button"
                onClick={() => signOut()}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-left text-nav-text hover:text-nav-text-hover hover:bg-nav-hover-bg rounded-lg transition-colors"
              >
                <SignOut weight="thin" className="w-3.5 h-3.5" />
                Logout
              </button>
            </div>
          ) : (
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
              {error && (
                <p className="text-[11px] text-red-400">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-1.5 text-xs font-medium bg-nav-active-bg text-nav-active-text rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
