"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { siteConfig } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { VISITOR_EMAILS_KEY } from "@/lib/visitor-email";

export async function setVisitorEmails(formData: FormData) {
  await requireAdmin();
  const value = formData.get("enabled") === "on" ? "on" : "off";
  await db
    .insert(siteConfig)
    .values({ key: VISITOR_EMAILS_KEY, value })
    .onConflictDoUpdate({ target: siteConfig.key, set: { value } });
  revalidatePath("/admin/visitors");
}
