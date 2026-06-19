import { createOpenAI } from "@ai-sdk/openai"
import { env } from "@/lib/env"

const groq = createOpenAI({
  apiKey: env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
})

export const model = groq("openai/gpt-oss-120b")
