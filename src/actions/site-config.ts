"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { siteConfig } from "@/db/schema";

export async function getConfig(key: string) {
  const row = await db.select().from(siteConfig).where(eq(siteConfig.key, key)).limit(1);
  return row[0]?.value ?? null;
}

export async function setConfig(key: string, value: string) {
  const existing = await db.select().from(siteConfig).where(eq(siteConfig.key, key)).limit(1);
  if (existing[0]) {
    await db.update(siteConfig).set({ value }).where(eq(siteConfig.key, key));
  } else {
    await db.insert(siteConfig).values({ key, value });
  }
  revalidatePath("/");
}

export async function updateWorkingOn(formData: FormData) {
  const value = formData.get("working_on") as string;
  await setConfig("working_on", value);
}
