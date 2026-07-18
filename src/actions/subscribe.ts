"use server";

import { z } from "zod";
import { addSubscriber } from "@/lib/buttondown";

const emailSchema = z.string().trim().email();

export type SubscribeStatus = "subscribed" | "already" | "invalid" | "error";

/** Public action: add a visitor's email to the Buttondown list. */
export async function subscribe(email: string): Promise<{ ok: boolean; status: SubscribeStatus }> {
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) return { ok: false, status: "invalid" };

  const result = await addSubscriber(parsed.data);
  if (result === "subscribed") return { ok: true, status: "subscribed" };
  if (result === "already") return { ok: true, status: "already" };
  return { ok: false, status: "error" };
}
