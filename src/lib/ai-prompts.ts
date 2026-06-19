export function getGeneratePrompt(type: string, title?: string, existing?: string): string {
  const styleRules =
    "Style rules: Write naturally like a human would speak to a colleague. Vary sentence length (mix short and long). Never use em-dashes. Avoid AI clichés like 'delve', 'leverage', 'testament', 'tapestry', 'robust', 'landscape', 'furthermore', 'moreover'. Use contractions (don't, it's, I've). Keep it organic no perfectly symmetrical structures or robotic patterns."

  const context = existing
    ? `Here is the existing content to rewrite and improve while keeping the same topic. Make it read more naturally and authentically:\n\n${existing}\n\n`
    : ""

  switch (type) {
    case "project":
      return `${context}${styleRules}\n\nWrite a project description in HTML.${title ? ` The project is called "${title}".` : ""} Explain what it does, the tech behind it, and what makes it interesting. Aim for 3-4 short paragraphs. Use only <p>, <h3>, <ul>, <li>, <strong>, <em> tags. Return ONLY the HTML.`

    case "lifeEvent":
      return `${context}${styleRules}\n\nWrite a short life event description in HTML.${title ? ` The event is "${title}".` : ""} Describe the context and why it mattered. Aim for 2-3 sentences. Use only <p> tags. Return ONLY the HTML.`

    case "microblog":
      return `${context}${styleRules}\n\nWrite a microblog post in HTML.${title ? ` The topic is "${title}".` : ""} Share a thought, insight, or observation. Aim for 2-3 short paragraphs. Use only <p> tags. Return ONLY the HTML.`

    case "book":
      return `${context}${styleRules}\n\nWrite a book review in HTML.${title ? ` The book is "${title}".` : ""} What is it about and what are the key takeaways? Aim for 3-4 sentences. Use only <p>, <strong>, <em> tags. Return ONLY the HTML.`

    default:
      return `${context}${styleRules}\n\nWrite HTML content${title ? ` about "${title}"` : ""}. Use only <p> tags. Return ONLY the HTML.`
  }
}