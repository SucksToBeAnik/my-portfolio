"use client";

import { GithubLogo } from "@phosphor-icons/react";
import { useFormStatus } from "react-dom";

// The OAuth hop to github.com takes a beat; without a pending state the button
// looks dead and invites a second click.
export function GitHubSignInButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium bg-nav-active-bg text-nav-active-text rounded-full hover:opacity-90 disabled:opacity-60 transition-opacity cursor-pointer disabled:cursor-default"
    >
      {pending ? (
        <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
      ) : (
        <GithubLogo weight="fill" className="w-4 h-4" />
      )}
      {pending ? "Redirecting to GitHub…" : "Continue with GitHub"}
    </button>
  );
}
