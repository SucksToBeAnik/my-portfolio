// The home page is rendered once per audience. Visitors land on the admin's
// chosen default unless a shared link (`/?for=academia`) or a cookie from one
// says otherwise; see src/proxy.ts.

export const MODES = ["academia", "industry"] as const;
export type Mode = (typeof MODES)[number];

export const MODE_COOKIE = "mode";
export const MODE_PARAM = "for";
export const FALLBACK_MODE: Mode = "academia";

export function parseMode(value: string | null | undefined): Mode | null {
  return MODES.find((m) => m === value) ?? null;
}
