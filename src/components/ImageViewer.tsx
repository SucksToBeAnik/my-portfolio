"use client";

import { useCallback, useEffect, useState } from "react";

export function ImageViewer({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setOpen(true));
  }, []);

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    },
    [close],
  );

  function close() {
    setOpen(false);
    setTimeout(onClose, 200);
  }

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [handleKey]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center cursor-pointer transition-all duration-200"
      style={{
        background: open ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0)",
        backdropFilter: open ? "blur(4px)" : "none",
      }}
      onClick={close}
    >
      <div
        className="max-w-[90vw] max-h-[90vh] transition-all duration-200"
        style={{ transform: open ? "scale(1)" : "scale(0.95)", opacity: open ? 1 : 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt={alt}
          className="max-w-full max-h-[90vh] object-contain shadow-2xl"
        />
      </div>
    </div>
  );
}
