"use client";

import { useState, useTransition } from "react";
import { Heart } from "@phosphor-icons/react";
import { toggleHeart } from "@/actions/hearts";

interface HeartButtonProps {
  entityType: string;
  entityId: number;
  initialCount: number;
  initialHearted: boolean;
}

export function HeartButton({ entityType, entityId, initialCount, initialHearted }: HeartButtonProps) {
  const [hearted, setHearted] = useState(initialHearted);
  const [count, setCount] = useState(initialCount);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      setHearted((p) => !p);
      setCount((p) => (hearted ? p - 1 : p + 1));
      await toggleHeart(entityType, entityId);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-hover-bg transition-all cursor-pointer disabled:opacity-50 hover:scale-105"
    >
      <Heart
        weight={hearted ? "fill" : "thin"}
        className={`w-4 h-4 ${hearted ? "text-red-400" : ""}`}
      />
      <span className="tabular-nums">{count}</span>
    </button>
  );
}
