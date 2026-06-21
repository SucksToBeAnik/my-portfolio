"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const prev = useRef(pathname + searchParams.toString());

  useEffect(() => {
    const current = pathname + searchParams.toString();
    if (current === prev.current) return;
    prev.current = current;

    // Navigation completed — finish bar
    setVisible(true);
    setWidth(100);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setVisible(false);
      setWidth(0);
    }, 300);
  }, [pathname, searchParams]);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 z-[999] h-[2px] bg-fg transition-all duration-300 ease-out pointer-events-none"
      style={{ width: `${width}%` }}
    />
  );
}
