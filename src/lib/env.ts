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
  ADMIN_EMAIL: str({
    desc: "Admin login email",
  }),
  ADMIN_PASSWORD: str({
    desc: "Admin login password",
  }),
  OMDB_API_KEY: str({
    desc: "OMDb API key for IMDb metadata lookup",
    default: "",
  }),
  BUTTONDOWN_API_KEY: str({
    desc: "Buttondown API key for email subscribers + new-post broadcasts",
    default: "",
  }),
});
