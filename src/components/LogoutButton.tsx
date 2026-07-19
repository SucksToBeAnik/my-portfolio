"use client";

import { SignOut } from "@phosphor-icons/react";
import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      aria-label="Logout"
      title="Logout"
      className="flex items-center justify-center w-7 h-7 rounded-lg text-fg/60 transition-all hover:scale-105 cursor-pointer bg-hover-bg"
    >
      <SignOut weight="thin" className="w-4 h-4" />
    </button>
  );
}
