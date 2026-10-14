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

function fmt(label: string, data: unknown[]) {
  if (!data.length) return "";
  return `\n### ${label}\n${JSON.stringify(data, null, 0)}\n`;
}

export function buildSystemPrompt(ctx: SiteContext, isAdmin = false): string {
  const tilSection = ctx.recentTils.length
    ? `\n### Recent TILs (Today I Learned)\n${ctx.recentTils.map((t) => `- [${new Date(t.createdAt).toISOString().slice(0, 10)}] **${t.title}**: ${t.content}`).join("\n")}\n`
    : "";

  const mediaSection = ctx.recentMedia.length
    ? `\n### Movies & Series\n${ctx.recentMedia.map((m) => `- ${m.title} (${m.type}, ${m.year ?? "?"}) — ${m.status}${m.rating ? `, ${m.rating}/5` : ""}${m.seasons ? `, ${m.seasons} seasons` : ""}`).join("\n")}\n`
    : "";

  const sitesSection = ctx.allSites.length
    ? `\n### Saved Sites\n${ctx.allSites.map((s) => `- ${s.url}${s.tags ? ` [${s.tags}]` : ""}${s.description ? ` — ${s.description}` : ""}`).join("\n")}\n`
    : "";

  const gallerySection = ctx.allGallery.length
    ? `\n### Gallery Photos\n${ctx.allGallery.map((g) => `- ${g.title}${g.takenAt ? ` (${new Date(g.takenAt).toISOString().slice(0, 10)})` : ""}`).join("\n")}\n`
    : "";

  const cvSection = ctx.showcasedCv
    ? `\n### CV / Resume\n- "${ctx.showcasedCv.title}": ${ctx.showcasedCv.fileUrl}\n`
    : "";

  // The two home-page intros frame the same person for different audiences.
  const introSection = [
    ctx.intros.academia && `#### For academic visitors\n${ctx.intros.academia}`,
    ctx.intros.industry && `#### For industry visitors\n${ctx.intros.industry}`,
  ]
    .filter(Boolean)
    .join("\n\n");
  const aboutSection = introSection ? `\n### Home Page Intro\n${introSection}\n` : "";

  const workingOnSection = ctx.workingOn
    ? `\n### Currently Working On\n- ${ctx.workingOn.what}${ctx.workingOn.url ? ` (${ctx.workingOn.url})` : ""}\n`
    : "";

  const profilesSection = ctx.academicProfiles.length
    ? `\n### Academic Profiles\n${ctx.academicProfiles.map((p) => `- ${p.name}: ${p.url}`).join("\n")}\n`
    : "";

  const data = `${aboutSection}${workingOnSection}${fmt("Projects", ctx.allProjects)}${fmt("Research Interests", ctx.researchInterests)}${fmt("Publications", ctx.allPublications)}${tilSection}${mediaSection}${fmt("Books", ctx.allBooks)}${fmt("Recent Posts", ctx.recentPosts)}${fmt("Life Events", ctx.allLifeEvents)}${fmt("Tools & Stack", ctx.allStacks)}${sitesSection}${gallerySection}${cvSection}${profilesSection}`;

  if (isAdmin) {
    return `You are a personal site assistant for Anik (the site owner). The person asking IS Anik — respond as a helpful assistant, not impersonating him.

## Rules
- Be direct and efficient; use lists and structure liberally
- Answer strictly from the data below — never fabricate
- When listing items (sites, tools, movies etc.), include the URL or key detail so Anik can act on it
- If asked to find something, search across ALL data sections thoroughly

## Site Data
${getProfile()}
${data}`;
  }

  return `You are Anik's personal site assistant. Speak in first person as Anik — visitors are talking directly to you.

## Rules
- Use "I"/"me" — you are Anik, not an assistant
- Be concise and direct; end with a short follow-up question
- Clean markdown only (no HTML). Lists: "- ", code: \`backticks\`
- Links to pages on this site ("page" fields) are relative paths — write them as markdown links, e.g. [title](/posts/12)
- Answers about my TILs, media, books, projects etc. MUST come from the data below — never fabricate or assume

## Profile
${getProfile()}
${data}`;
}
