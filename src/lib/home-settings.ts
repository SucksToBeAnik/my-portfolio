import { z } from "zod";
import { FALLBACK_MODE, MODES, type Mode } from "@/lib/mode";

// Per-audience home page settings, stored as rows in `site_config`.

export type AcademicProfileKey = (typeof ACADEMIC_PROFILES)[number]["key"];

export const ACADEMIC_PROFILES = [
  { key: "profile_scholar", label: "Google Scholar" },
  { key: "profile_orcid", label: "ORCID" },
  { key: "profile_openreview", label: "OpenReview" },
  { key: "profile_semantic_scholar", label: "Semantic Scholar" },
  { key: "profile_dblp", label: "DBLP" },
] as const;

export const INTRO_KEYS: Record<Mode, string> = {
  academia: "intro_academia",
  industry: "intro_industry",
};

export const HOME_SETTING_KEYS = [
  "default_mode",
  ...Object.values(INTRO_KEYS),
  ...ACADEMIC_PROFILES.map((p) => p.key),
];

const optionalUrl = z
  .string()
  .trim()
  .refine((v) => v === "" || z.url().safeParse(v).success, "Must be a URL");

export const homeSettingsSchema = z.object({
  default_mode: z.enum(MODES),
  intro_academia: z.string().trim(),
  intro_industry: z.string().trim(),
  ...Object.fromEntries(ACADEMIC_PROFILES.map((p) => [p.key, optionalUrl])),
});

export interface HomeSettings {
  defaultMode: Mode;
  /** Markdown; empty means "use the built-in intro". */
  intros: Record<Mode, string>;
  profiles: { key: AcademicProfileKey; label: string; url: string }[];
}

export function toHomeSettings(rows: { key: string; value: string }[]): HomeSettings {
  const get = (key: string) => rows.find((r) => r.key === key)?.value.trim() ?? "";
  return {
    defaultMode: MODES.find((m) => m === get("default_mode")) ?? FALLBACK_MODE,
    intros: { academia: get(INTRO_KEYS.academia), industry: get(INTRO_KEYS.industry) },
    profiles: ACADEMIC_PROFILES.map((p) => ({
      key: p.key,
      label: p.label,
      url: get(p.key),
    })).filter((p) => p.url),
  };
}
