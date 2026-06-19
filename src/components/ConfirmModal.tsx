"use client";

import { useEffect } from "react";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
}

export function ConfirmModal({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = "Delete",
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-bg/90" onClick={onCancel} />
      <div className="relative bg-bg border border-hairline rounded-xl shadow-2xl p-5 max-w-sm w-full space-y-4">
        <h3 className="text-sm font-heading text-fg">{title}</h3>
        <p className="text-xs text-fg/60">{message}</p>
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-xs font-medium bg-hover-bg text-fg/60 rounded-lg hover:bg-hover-bg transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-3 py-1.5 text-xs font-medium bg-red-500/80 text-white rounded-lg hover:bg-red-500 transition-all"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
