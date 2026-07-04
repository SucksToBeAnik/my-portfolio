"use client";

import { GithubLogo, Globe } from "@phosphor-icons/react";
import { LinkPreview } from "@/components/LinkPreview";

const iconMap: Record<string, typeof Globe> = {
  Website: Globe,
  GitHub: GithubLogo,
};

export function ProjectLink({ url, label }: { url: string; label: string }) {
  const Icon = iconMap[label];
  return (
    <LinkPreview url={url} position="bottom">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-hover-bg text-fg/70 hover:text-fg hover:bg-fg/10 transition-colors"
      >
        {Icon && <Icon weight="thin" className="w-3.5 h-3.5" />}
        {label}
      </a>
    </LinkPreview>
  );
}
