"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { siteConfig } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

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
  revalidatePath("/");
}

export async function updateWorkingOn(formData: FormData) {
  await requireAdmin();
  const value = formData.get("working_on") as string;
  const url = formData.get("working_on_url") as string;
  await setConfig("working_on", value);
  await setConfig("working_on_url", url ?? "");
}
