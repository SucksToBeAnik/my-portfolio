import { env } from "@/lib/env";

/**
 * Thin wrapper around the Buttondown API (https://docs.buttondown.com/api).
 * Subscribers and the new-post broadcast both live in Buttondown; we only ever
 * POST — no subscriber data is stored locally.
 */
const API = "https://api.buttondown.com/v1";

function authHeaders() {
  return {
    Authorization: `Token ${env.BUTTONDOWN_API_KEY}`,
    "X-Buttondown-Live-Dangerously": "true",
    "Content-Type": "application/json",
  };
}

/** Whether an API key is configured — callers degrade gracefully if not. */
export function buttondownConfigured(): boolean {
  return Boolean(env.BUTTONDOWN_API_KEY);
}

export type SubscribeResult = "subscribed" | "already" | "error";

/** Add an email to the Buttondown list. Confirmation email is handled by
 *  Buttondown per the account's double-opt-in setting. */
export async function addSubscriber(email: string): Promise<SubscribeResult> {
  if (!buttondownConfigured()) return "error";
  try {
    const res = await fetch(`${API}/subscribers`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ email_address: email }),
    });
    if (res.ok) return "subscribed";
    const text = await res.text().catch(() => "");
    // Buttondown answers 400 when the address is already on the list.
    if (res.status === 400 && /already|exists|subscribed/i.test(text)) return "already";
    console.error("Buttondown subscribe failed:", res.status, text);
    return "error";
  } catch (err) {
    console.error("Buttondown subscribe error:", err);
    return "error";
  }
}

/** Create and send an email to all subscribers. `body` is Markdown. */
export async function sendBroadcast(subject: string, body: string): Promise<boolean> {
  if (!buttondownConfigured()) return false;
  try {
    const res = await fetch(`${API}/emails`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ subject, body, status: "about_to_send" }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("Buttondown send failed:", res.status, text);
    }
    return res.ok;
  } catch (err) {
    console.error("Buttondown send error:", err);
    return false;
  }
}
