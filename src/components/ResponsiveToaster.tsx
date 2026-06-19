"use client";

import { useEffect, useState } from "react";
import { Toaster } from "sonner";

export function ResponsiveToaster() {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <Toaster
      position={mobile ? "top-center" : "bottom-center"}
      toastOptions={{
        style: {
          background: "var(--bg)",
          color: "var(--fg)",
          border: "1px solid var(--hairline)",
          borderRadius: "12px",
          fontSize: "13px",
          fontFamily: "var(--font-sans), sans-serif",
        },
      }}
    />
  );
}
