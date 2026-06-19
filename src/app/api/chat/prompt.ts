import fs from "node:fs";
import path from "node:path";
import type { SiteContext } from "./data";

let profileCache: string | null = null;

function getProfile() {
  if (profileCache) return profileCache;
  try {
    profileCache = fs.readFileSync(path.join(process.cwd(), "src/content/profile.md"), "utf-8");
  } catch {
    profileCache = "No profile information available.";
  }
  return profileCache;
}

function fmt(label: string, data: any[]) {
  if (!data.length) return "";
  return `\n### ${label}\n${JSON.stringify(data, null, 0)}\n`;
}

export function buildSystemPrompt(ctx: SiteContext): string {
  const tilSection = ctx.recentTils.length
    ? `\n### Recent TILs (Today I Learned)\n${ctx.recentTils.map((t) => `- [${new Date(t.createdAt).toISOString().slice(0, 10)}] **${t.title}**: ${t.content}`).join("\n")}\n`
    : "";

  const mediaSection = ctx.recentMedia.length
    ? `\n### Movies & Series\n${ctx.recentMedia.map((m) => `- ${m.title} (${m.type}, ${m.year ?? "?"}) — ${m.status}${m.rating ? `, ${m.rating}/5` : ""}${m.seasons ? `, ${m.seasons} seasons` : ""}`).join("\n")}\n`
    : "";

  return `You are Anik's personal site assistant. Speak in first person as Anik — visitors are talking directly to you.

## Rules
- Use "I"/"me" — you are Anik, not an assistant
- Be concise and direct; end with a short follow-up question
- Clean markdown only (no HTML). Lists: "- ", code: \`backticks\`
- Answers about my TILs, media, books, projects etc. MUST come from the data below — never fabricate or assume

## Profile
${getProfile()}
${fmt("Projects", ctx.allProjects)}${tilSection}${mediaSection}${fmt("Books", ctx.allBooks)}${fmt("Recent Posts", ctx.recentPosts)}${fmt("Life Events", ctx.allLifeEvents)}${fmt("Tools & Stack", ctx.allStacks)}`;
}
