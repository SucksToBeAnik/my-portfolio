import { cleanEnv, str } from "envalid"

export const env = cleanEnv(process.env, {
  TURSO_DATABASE_URL: str({
    docs: "https://docs.turso.tech/sdk/ts/quickstart",
    example: "libsql://your-db.turso.io",
  }),
  TURSO_AUTH_TOKEN: str({
    docs: "https://docs.turso.tech/sdk/ts/quickstart",
  }),
})
