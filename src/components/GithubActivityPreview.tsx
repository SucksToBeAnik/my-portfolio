"use client";

import { GitBranch } from "@phosphor-icons/react";
import { useState } from "react";
import { LinkPreview } from "@/components/LinkPreview";
import type { GithubActivity } from "@/lib/github";

const GITHUB_URL = "https://github.com/SucksToBeAnik";

export function GithubActivityPreview() {
  const [activities, setActivities] = useState<GithubActivity[]>([]);
  const [activityIndex, setActivityIndex] = useState(0);
  const [requested, setRequested] = useState(false);

  function loadActivities() {
    if (requested) return;
    setRequested(true);
    fetch("/api/github-activity")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { activities?: GithubActivity[] } | null) => {
        if (data?.activities?.length) setActivities(data.activities);
      })
      .catch(() => undefined);
  }

  function showNextActivity() {
    loadActivities();
    if (activities.length > 1) setActivityIndex((index) => (index + 1) % activities.length);
  }

  const activity = activities[activityIndex];

  return (
    <LinkPreview
      url={GITHUB_URL}
      position="bottom"
      previewClassName="w-64"
      previewContent={
        <div className="px-3 py-2.5">
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] bg-hover-bg text-fg/65">
              <GitBranch weight="duotone" className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-xs font-medium leading-relaxed text-fg/80">
                Recently{" "}
                <span className="font-semibold text-fg">
                  {activity?.label.toLocaleLowerCase() ?? "active"}
                </span>{" "}
                on GitHub.
              </p>
            </div>
          </div>
        </div>
      }
    >
      <button
        type="button"
        onMouseEnter={loadActivities}
        onFocus={loadActivities}
        onClick={showNextActivity}
        className="cursor-pointer font-semibold text-fg transition-opacity hover:opacity-70"
        aria-label="Show another recent GitHub activity"
      >
        software engineer
      </button>
    </LinkPreview>
  );
}
