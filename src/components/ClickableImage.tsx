"use client";

import { useState } from "react";
import { ImageViewer } from "@/components/ImageViewer";

export function ClickableImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        <img src={src} alt={alt} className="object-cover w-full h-full" />
      </button>
      {open && (
        <ImageViewer src={src} alt={alt} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
