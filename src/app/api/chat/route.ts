import { streamText, stepCountIs } from "ai"
import { model } from "@/lib/ai"
import { db } from "@/db"
import { projects, books, microblogs, lifeEvents, tools as toolsTable } from "@/db/schema"
import { eq, like, or, and, sql } from "drizzle-orm"
import { cookies } from "next/headers"
import fs from "fs"
import path from "path"

let profileCache: string | null = null

function getProfile() {
  if (profileCache) return profileCache
  try {
    profileCache = fs.readFileSync(path.join(process.cwd(), "src/content/profile.md"), "utf-8")
  } catch {
    profileCache = "No profile information available."
  }
  return profileCache
}

const agentTools = {
  getProfile: {
    description: "Read my personal profile information — bio, skills, experience, and background.",
    parameters: { type: "object", properties: {}, required: [] },
    execute: async () => getProfile(),
  },
  searchEntities: {
    description: "Search across all content on the site (projects, books, microblogs, life events, tools). Use this when answering questions about specific topics or finding relevant content.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "The search query to match against titles and descriptions" },
        type: { type: "string", enum: ["project", "book", "microblog", "lifeEvent", "tool"], description: "Optional: filter to a specific content type" },
      },
      required: ["query"],
    },
    execute: async ({ query, type }: { query: string; type?: string }) => {
      const likeQuery = `%${query}%`
      const queries: Promise<any[]>[] = []

      if (!type || type === "project") {
        queries.push(
          db
            .select({ id: projects.id, title: projects.title, description: projects.description, _type: sql`'project'`.as("type") })
            .from(projects)
            .where(or(like(projects.title, likeQuery), like(projects.description, likeQuery)))
            .limit(5),
        )
      }
      if (!type || type === "book") {
        queries.push(
          db
            .select({ id: books.id, title: books.title, author: books.author, _type: sql`'book'`.as("type") })
            .from(books)
            .where(or(like(books.title, likeQuery), like(books.author, likeQuery)))
            .limit(5),
        )
      }
      if (!type || type === "microblog") {
        queries.push(
          db
            .select({ id: microblogs.id, title: microblogs.title, _type: sql`'microblog'`.as("type") })
            .from(microblogs)
            .where(and(eq(microblogs.published, true), or(like(microblogs.title, likeQuery), like(microblogs.content, likeQuery))))
            .limit(5),
        )
      }
      if (!type || type === "lifeEvent") {
        queries.push(
          db
            .select({ id: lifeEvents.id, title: lifeEvents.title, description: lifeEvents.description, _type: sql`'lifeEvent'`.as("type") })
            .from(lifeEvents)
            .where(or(like(lifeEvents.title, likeQuery), like(lifeEvents.description, likeQuery)))
            .limit(5),
        )
      }
      if (!type || type === "tool") {
        queries.push(
          db
            .select({ id: toolsTable.id, name: toolsTable.name, description: toolsTable.description, _type: sql`'tool'`.as("type") })
            .from(toolsTable)
            .where(or(like(toolsTable.name, likeQuery), like(toolsTable.description, likeQuery)))
            .limit(5),
        )
      }

      const results = (await Promise.all(queries)).flat()
      return results.length > 0 ? JSON.stringify(results) : "No results found."
    },
  },
  getEntityDetail: {
    description: "Get full details of a specific content item by its type and ID.",
    parameters: {
      type: "object",
      properties: {
        type: { type: "string", enum: ["project", "book", "microblog", "lifeEvent", "tool"], description: "The content type" },
        id: { type: "number", description: "The item's ID number" },
      },
      required: ["type", "id"],
    },
    execute: async ({ type, id }: { type: string; id: number }) => {
      let result: any
      switch (type) {
        case "project":
          result = (await db.select().from(projects).where(eq(projects.id, id)).limit(1))[0]
          break
        case "book":
          result = (await db.select().from(books).where(eq(books.id, id)).limit(1))[0]
          break
        case "microblog":
          result = (await db.select().from(microblogs).where(eq(microblogs.id, id)).limit(1))[0]
          break
        case "lifeEvent":
          result = (await db.select().from(lifeEvents).where(eq(lifeEvents.id, id)).limit(1))[0]
          break
        case "tool":
          result = (await db.select().from(toolsTable).where(eq(toolsTable.id, id)).limit(1))[0]
          break
      }
      return result ? JSON.stringify(result) : "Item not found."
    },
  },
}

export async function POST(req: Request) {
  const { messages } = await req.json()

  const cookieStore = await cookies()
  const remainingRaw = cookieStore.get("query_remaining")?.value
  let remaining = remainingRaw ? parseInt(remainingRaw, 10) : 50
  if (isNaN(remaining)) remaining = 50

  if (remaining <= 0) {
    return Response.json(
      { error: "You've used all your daily questions. Come back tomorrow!" },
      { status: 429 },
    )
  }

  const systemPrompt = `You answer questions about the website owner. Be concise and direct — no fluff. After answering, ask a relevant follow-up question to keep the conversation going.

Rules:
- Keep answers short and to the point
- Always end with a follow-up question
- Use clean markdown (proper blank lines between sections, never HTML)
- Lists use "- " syntax, inline code uses \`backticks\`

Profile:
${getProfile()}

Use the tools to find relevant information. When asked about projects, books, life events, etc., use searchEntities. For specific details about an item, use getEntityDetail.`

  try {
    const result = streamText({
      model,
      system: systemPrompt,
      messages,
      tools: agentTools as any,
      stopWhen: stepCountIs(5),
    })

    const aiResponse = result.toTextStreamResponse()
    return aiResponse
  } catch (err) {
    console.error("Chat error:", err)
    return Response.json({ error: "Sorry, something went wrong. Please try again." }, { status: 500 })
  }
}
