import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { microblogs } from "@/db/schema";
import { siteUrl, stripMarkdown, truncate } from "@/lib/seo";

// Rebuilt hourly alongside the rest of the content.
export const revalidate = 3600;

const SITE_TITLE = "Al Jami Islam Anik — Writing";
const SITE_DESC = "Posts from suckstobeanik — software engineering, projects, and notes.";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const posts = await db
    .select({
      id: microblogs.id,
      title: microblogs.title,
      content: microblogs.content,
      publishedAt: microblogs.publishedAt,
    })
    .from(microblogs)
    .where(eq(microblogs.published, true))
    .orderBy(desc(microblogs.publishedAt))
    .limit(50);

  const lastBuild = posts[0]?.publishedAt ?? new Date();

  const items = posts
    .map((post) => {
      const link = siteUrl(`/posts/${post.id}`);
      const pubDate = (post.publishedAt ?? new Date()).toUTCString();
      const description = truncate(stripMarkdown(post.content), 400);
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(description)}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${siteUrl("/posts")}</link>
    <description>${escapeXml(SITE_DESC)}</description>
    <language>en</language>
    <lastBuildDate>${lastBuild.toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl("/rss.xml")}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
