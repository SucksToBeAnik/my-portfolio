"use client";

import { useEffect, useRef } from "react";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  headerActions?: React.ReactNode;
}

export function Drawer({ open, onClose, title, children, headerActions }: DrawerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-bg/60 z-40"
          onClick={onClose}
        />
      )}

      <div
        ref={ref}
        className={`fixed bottom-0 left-0 right-0 z-50 bg-bg border-t border-hairline rounded-t-2xl shadow-2xl transition-transform duration-300 ease-out max-h-[85vh] flex flex-col ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ pointerEvents: open ? "auto" : "none" }}
      >
        <div className="flex items-center justify-between shrink-0 px-5 py-3 border-b border-hairline">
          <h2 className="text-sm font-heading text-fg">{title}</h2>
          {headerActions}
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {children}
        </div>
      </div>
    </>
  );
}
