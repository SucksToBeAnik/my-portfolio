"use server";

import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { siteConfig } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import {
  HOME_SETTING_KEYS,
  type HomeSettings,
  homeSettingsSchema,
  toHomeSettings,
} from "@/lib/home-settings";
import { revalidateHome } from "@/lib/revalidate-home";

export async function getConfig(key: string) {
  const row = await db.select().from(siteConfig).where(eq(siteConfig.key, key)).limit(1);
  return row[0]?.value ?? null;
}

export async function setConfig(key: string, value: string) {
  await requireAdmin();
  const existing = await db.select().from(siteConfig).where(eq(siteConfig.key, key)).limit(1);
  if (existing[0]) {
    await db.update(siteConfig).set({ value }).where(eq(siteConfig.key, key));
  } else {
    await db.insert(siteConfig).values({ key, value });
  }
  revalidateHome();
}

export async function updateWorkingOn(formData: FormData) {
  await requireAdmin();
  const value = formData.get("working_on") as string;
  const url = formData.get("working_on_url") as string;
  await setConfig("working_on", value);
  await setConfig("working_on_url", url ?? "");
}

async function getHomeSettingRows() {
  return db.select().from(siteConfig).where(inArray(siteConfig.key, HOME_SETTING_KEYS));
}

export async function getHomeSettings(): Promise<HomeSettings> {
  return toHomeSettings(await getHomeSettingRows());
}

/** Stored values keyed by setting, for prefilling the admin form. */
export async function getHomeSettingValues(): Promise<Record<string, string>> {
  await requireAdmin();
  const rows = await getHomeSettingRows();
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function updateHomeSettings(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  const parsed = homeSettingsSchema.safeParse(
    Object.fromEntries(HOME_SETTING_KEYS.map((k) => [k, formData.get(k) ?? ""])),
  );
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid settings" };
  }
  for (const [key, value] of Object.entries(parsed.data)) {
    await setConfig(key, String(value));
  }
  return { ok: true };
}
