"use client";

import { usePathname } from "next/navigation";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return <div className="flex flex-col flex-1 min-h-0">{children}</div>;
  }

  return (
    <div key={pathname} className="animate-fade-up flex flex-col flex-1 min-h-0">
      {children}
    </div>
  );
}
