"use server";

import { z } from "zod";
import { sendEmail } from "@/lib/resend";

const contactSchema = z.object({
  email: z.string().trim().email(),
  message: z.string().trim().min(1).max(2000),
});

export type ContactStatus = "sent" | "invalid" | "unconfigured" | "error";

/**
 * Public action behind the homepage's contact form. Unauthenticated by design,
 * so the message is length-capped and the sender's address only ever lands in
 * `reply_to` — never in `from`, which would let anyone spoof the sender.
 */
export async function sendContactMessage(input: {
  email: string;
  message: string;
}): Promise<{ ok: boolean; status: ContactStatus }> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) return { ok: false, status: "invalid" };

  const { email, message } = parsed.data;
  const result = await sendEmail({
    subject: `Portfolio message from ${email}`,
    text: `${message}\n\n---\nReply to: ${email}`,
    replyTo: email,
  });

  if (result === "sent") return { ok: true, status: "sent" };
  return { ok: false, status: result };
}
