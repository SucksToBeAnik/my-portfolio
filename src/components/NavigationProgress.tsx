"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function NavigationProgress() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const prev = useRef(pathname);

  useEffect(() => {
    if (pathname === prev.current) return;
    prev.current = pathname;

    // Navigation completed — finish bar
    setVisible(true);
    setWidth(100);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setVisible(false);
      setWidth(0);
    }, 300);
  }, [pathname]);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 z-[999] h-[2px] bg-fg transition-all duration-300 ease-out pointer-events-none"
      style={{ width: `${width}%` }}
    />
  );
}
