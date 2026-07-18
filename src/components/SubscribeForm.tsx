"use client";

import { type FormEvent, useState, useTransition } from "react";
import { subscribe } from "@/actions/subscribe";

export function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    startTransition(async () => {
      const res = await subscribe(email);
      switch (res.status) {
        case "subscribed":
          setMsg({ text: "You're in — check your inbox to confirm.", ok: true });
          setEmail("");
          break;
        case "already":
          setMsg({ text: "You're already subscribed.", ok: true });
          break;
        case "invalid":
          setMsg({ text: "That email doesn't look right.", ok: false });
          break;
        default:
          setMsg({ text: "Something went wrong — try again later.", ok: false });
      }
    });
  }

  return (
    <div className="rounded-2xl bg-fg/[0.04] p-5 sm:p-6">
      <h2 className="font-heading text-sm uppercase tracking-wide">Subscribe</h2>
      <p className="mt-1.5 text-sm text-muted">
        Get an email when I publish something new. No spam, unsubscribe anytime.
      </p>
      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          aria-label="Email address"
          className="flex-1 rounded-full border border-hairline bg-bg/40 px-4 py-2.5 text-sm text-fg placeholder:text-muted/60 focus:border-fg/30 focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-full bg-fg px-5 py-2.5 text-sm font-medium text-bg transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "…" : "Subscribe"}
        </button>
      </form>
      {msg && (
        <p className={`mt-2.5 text-xs ${msg.ok ? "text-muted" : "text-red-400"}`}>{msg.text}</p>
      )}
    </div>
  );
}
