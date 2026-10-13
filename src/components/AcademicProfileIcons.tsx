import type { Icon } from "@phosphor-icons/react";
import {
  Article,
  BookOpenText,
  Database,
  GraduationCap,
  IdentificationBadge,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { LinkPreview } from "@/components/LinkPreview";
import type { AcademicProfileKey } from "@/lib/home-settings";
import type { SiteMeta } from "@/lib/microlink";

// Phosphor has no logos for these sites, so each gets the nearest generic glyph;
// the hover preview and label say which site it is.
const ICONS: Record<AcademicProfileKey, Icon> = {
  profile_scholar: GraduationCap,
  profile_orcid: IdentificationBadge,
  profile_openreview: Article,
  profile_semantic_scholar: BookOpenText,
  profile_dblp: Database,
};

export interface AcademicProfile {
  key: AcademicProfileKey;
  label: string;
  url: string;
  meta: SiteMeta | null;
}

/** Scholarly profiles, sized and styled to sit in the social icon row. */
export function AcademicProfileIcons({ profiles }: { profiles: AcademicProfile[] }) {
  return profiles.map((p) => {
    const ProfileIcon = ICONS[p.key];
    return (
      <LinkPreview
        key={p.key}
        url={p.url}
        position="bottom"
        preload={p.meta ?? { title: p.label, description: null, image: null, logo: null }}
        persistPreview
      >
        <Link
          href={p.url}
          target="_blank"
          className="flex items-center gap-1.5 hover:text-fg transition-colors"
          aria-label={p.label}
          title={p.label}
        >
          <ProfileIcon weight="light" className="w-5 h-5" />
        </Link>
      </LinkPreview>
    );
  });
}
