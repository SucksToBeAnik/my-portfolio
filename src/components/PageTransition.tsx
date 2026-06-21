"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const isHome = pathname === "/";

  // Prevent html from ever scrolling on the home page — the snap container
  // handles all scrolling internally. Without this, a tiny height rounding
  // error can briefly make html scrollable, flashing the scrollbar.
  useEffect(() => {
    const html = document.documentElement;
    if (isHome) {
      html.style.overflowY = "hidden";
    } else {
      html.style.overflowY = "";
    }
  }, [isHome]);

  if (isAdmin || isHome) {
    return <div className="flex flex-col flex-1 min-h-0">{children}</div>;
  }

  return (
    <div key={pathname} className="animate-fade-up flex flex-col flex-1 min-h-0">
      {children}
    </div>
  );
}
