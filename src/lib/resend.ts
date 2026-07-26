import "server-only";
import { env } from "@/lib/env";

/** Where the homepage contact form delivers. */
export const CONTACT_INBOX = "anik.islam1494@gmail.com";

/**
 * Resend's REST API over plain `fetch` — one endpoint, one header, so the SDK
 * would only add a dependency. Mirrors `@/lib/buttondown`: returns a status
 * rather than throwing, so callers can map it to a message.
 *
 * `onboarding@resend.dev` is Resend's shared sender, which is allowed to deliver
 * to the address that owns the API key without any domain verification. Swap it
 * for an address on a verified domain once one exists.
 */
const FROM = "Portfolio <onboarding@resend.dev>";

export async function sendEmail(args: {
  subject: string;
  text: string;
  replyTo?: string;
}): Promise<"sent" | "unconfigured" | "error"> {
  if (!env.RESEND_API_KEY) return "unconfigured";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [CONTACT_INBOX],
        subject: args.subject,
        text: args.text,
        ...(args.replyTo ? { reply_to: args.replyTo } : {}),
      }),
    });

    if (!res.ok) {
      console.error("resend: send failed", res.status, await res.text());
      return "error";
    }
    return "sent";
  } catch (err) {
    console.error("resend: send threw", err);
    return "error";
  }
}
