import { generateText, stepCountIs } from "ai";
import { model } from "@/lib/ai";
import { getGeneratePrompt } from "@/lib/ai-prompts";

export async function POST(req: Request) {
  const { type, title, existing } = await req.json();

  const prompt = getGeneratePrompt(type, title, existing);

  const { text } = await generateText({
    model,
    prompt,
    system:
      "You write natural, human-sounding HTML content. Write like a real person talking to a colleague. Vary sentence length. Never use em-dashes or AI clichés (delve, leverage, testament, tapestry, robust). Use contractions. If existing content is provided, rewrite it in a more natural voice. Use only <p>, <h2>, <h3>, <ul>, <li>, <strong>, <em> tags. Return ONLY the HTML, no markdown fences or extra text.",
    stopWhen: stepCountIs(3),
  });

  const cleaned = text
    .replace(/```html?/gi, "")
    .replace(/```/g, "")
    .trim();

  return Response.json({ html: cleaned });
}
