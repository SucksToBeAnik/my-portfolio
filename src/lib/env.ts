import { cleanEnv, str } from "envalid";

export const env = cleanEnv(process.env, {
  TURSO_DATABASE_URL: str({
    docs: "https://docs.turso.tech/sdk/ts/quickstart",
    example: "libsql://your-db.turso.io",
  }),
  TURSO_AUTH_TOKEN: str({
    docs: "https://docs.turso.tech/sdk/ts/quickstart",
  }),
  AUTH_SECRET: str({
    docs: "https://authjs.dev/reference/core/errors#missingsecret",
    desc: "NextAuth.js encryption secret",
  }),
  GROQ_API_KEY: str({
    desc: "Groq API key for AI chat",
  }),
  AUTH_GITHUB_ID: str({
    docs: "https://authjs.dev/getting-started/providers/github",
    desc: "GitHub OAuth app client ID for admin sign-in",
  }),
  AUTH_GITHUB_SECRET: str({
    docs: "https://authjs.dev/getting-started/providers/github",
    desc: "GitHub OAuth app client secret",
  }),
  ADMIN_GITHUB_ID: str({
    docs: "https://api.github.com/users/<username>",
    desc: "Numeric GitHub account id allowed to sign in (the `id` field, not the username)",
  }),
  VERCEL_ENV: str({
    desc: "Set by Vercel (production / preview / development). Unset locally.",
    default: "",
  }),
  OMDB_API_KEY: str({
    desc: "OMDb API key for IMDb metadata lookup",
    default: "",
  }),
  BUTTONDOWN_API_KEY: str({
    desc: "Buttondown API key for email subscribers + new-post broadcasts",
    default: "",
  }),
  RESEND_API_KEY: str({
    desc: "Resend API key for the homepage contact form. Unset disables the form.",
    default: "",
  }),
});
