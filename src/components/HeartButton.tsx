"use client";

import { Heart } from "@phosphor-icons/react";
import { useEffect, useState, useTransition } from "react";
import { getHeartCount, toggleHeart } from "@/actions/hearts";

interface HeartButtonProps {
  entityType: string;
  entityId: number;
  initialCount: number;
  initialHearted?: boolean;
}

export function HeartButton({ entityType, entityId, initialCount, initialHearted }: HeartButtonProps) {
  const [hearted, setHearted] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [heartedLoaded, setHeartedLoaded] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (initialHearted !== undefined) return;
    // Fallback for pages that don't batch-load hearted state
    const visitorId =
      document.cookie
        .split("; ")
        .find((c) => c.startsWith("visitor_id="))
        ?.split("=")[1] ?? null;
    getHeartCount(entityType, entityId, visitorId).then((data) => {
      setCount(data.count);
      setHearted(data.hearted);
      setHeartedLoaded(true);
    });
  }, [entityType, entityId, initialHearted]);

  useEffect(() => {
    if (initialHearted === undefined) return;
    setHearted(initialHearted);
    setHeartedLoaded(true);
  }, [initialHearted]);

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
      disabled={pending || !heartedLoaded}
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
