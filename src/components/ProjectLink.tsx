"use client";

import { LinkPreview } from "@/components/LinkPreview";
import { Globe, GithubLogo } from "@phosphor-icons/react";

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
        className="flex items-center gap-1 hover:text-fg transition-colors"
      >
        {Icon && <Icon weight="thin" className="w-3.5 h-3.5" />}
        {label}
      </a>
    </LinkPreview>
  );
}
