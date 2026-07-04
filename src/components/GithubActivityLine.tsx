"use client";

import { GitBranch, LinkSimple } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { GithubActivity } from "@/lib/github";

export function GithubActivityLine({ activities }: { activities: GithubActivity[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (activities.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % activities.length);
    }, 4000);
    return () => clearInterval(id);
  }, [activities.length]);

  const activity = activities[index];
  if (!activity) return null;

  return (
    <p className="flex items-start gap-1.5 text-fg/80">
      <GitBranch weight="fill" className="w-3 h-3 mt-0.5 text-fg/40 shrink-0" />
      <span>
        Recently{" "}
        <Link
          key={index}
          href={activity.url}
          target="_blank"
          className="inline-flex items-center gap-0.5 font-medium text-fg origin-left transition-transform duration-200 hover:scale-105 animate-fade-up"
        >
          {activity.label}
          <LinkSimple weight="bold" className="w-3 h-3 text-muted/60" />
        </Link>
      </span>
    </p>
  );
}
