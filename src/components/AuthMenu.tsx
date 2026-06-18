"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import { UserCircle } from "@phosphor-icons/react";

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
        className="flex items-center justify-center w-7 h-7 rounded-full text-nav-text hover:text-nav-text-hover hover:bg-nav-hover-bg transition-colors cursor-pointer"
        aria-label="User menu"
      >
        {isLoggedIn ? (
          <span className="w-full h-full rounded-full bg-white text-black flex items-center justify-center text-[10px] font-medium">
            A
          </span>
        ) : (
          <UserCircle weight="thin" className="w-5 h-5" />
        )}
      </button>

      {open && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-56 bg-[#0d1117] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
          {isLoggedIn ? (
            <div className="p-2 space-y-0.5">
              <p className="px-3 py-2 text-xs text-white/50">
                {session?.user?.email}
              </p>
              <Link
                href="/admin/dashboard"
                onClick={() => setOpen(false)}
                className="block w-full px-3 py-2 text-sm text-left text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                Admin Dashboard
              </Link>
              <button
                type="button"
                onClick={() => signOut()}
                className="block w-full px-3 py-2 text-sm text-left text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="p-4 space-y-3">
              <div className="space-y-2">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>
              {error && (
                <p className="text-xs text-red-400">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 text-sm font-medium bg-white text-black rounded-lg hover:bg-white/90 disabled:opacity-50 transition-colors"
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
