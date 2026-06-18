import { createGroq } from "@ai-sdk/groq"
import { env } from "@/lib/env"

const groq = createGroq({
  apiKey: env.GROQ_API_KEY,
})

export const model = groq("openai/gpt-oss-120b")
