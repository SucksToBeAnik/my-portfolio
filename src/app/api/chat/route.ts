import { streamText } from "ai";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { model } from "@/lib/ai";
import { loadContext } from "./data";
import { buildSystemPrompt } from "./prompt";

export async function POST(req: Request) {
  const [session, { messages }] = await Promise.all([auth(), req.json()]);
  const isAdmin = !!session?.user;

  if (!isAdmin) {
    const cookieStore = await cookies();
    const remainingRaw = cookieStore.get("query_remaining")?.value;
    let remaining = remainingRaw ? parseInt(remainingRaw, 10) : 50;
    if (Number.isNaN(remaining)) remaining = 50;

    if (remaining <= 0) {
      return Response.json(
        { error: "You've used all your daily questions. Come back tomorrow!" },
        { status: 429 },
      );
    }
  }

  try {
    const ctx = await loadContext();
    const system = buildSystemPrompt(ctx, isAdmin);

    const result = streamText({ model, system, messages });
    return result.toTextStreamResponse();
  } catch (err) {
    console.error("Chat error:", err);
    return Response.json(
      { error: "Sorry, something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
