"use client";

import { Envelope, Lock } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { z } from "zod";

const credentialsSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const parsed = credentialsSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      const res = await signIn("credentials", {
        ...parsed.data,
        redirect: false,
      });
      if (res?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/admin/dashboard");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleLogin} className="space-y-3">
      <div className="relative">
        <Envelope
          weight="thin"
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-nav-text pointer-events-none"
        />
        <input
          type="email"
          placeholder="Email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm bg-nav-hover-bg border border-nav-border rounded-lg text-fg placeholder-nav-text/50 focus:outline-none focus:border-nav-text transition-colors"
        />
      </div>
      <div className="relative">
        <Lock
          weight="thin"
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-nav-text pointer-events-none"
        />
        <input
          type="password"
          placeholder="Password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm bg-nav-hover-bg border border-nav-border rounded-lg text-fg placeholder-nav-text/50 focus:outline-none focus:border-nav-text transition-colors"
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 text-sm font-medium bg-nav-active-bg text-nav-active-text rounded-lg hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer"
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
