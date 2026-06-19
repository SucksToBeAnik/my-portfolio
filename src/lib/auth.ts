import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { env } from "@/lib/env"

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string
        const password = credentials?.password as string

        if (email === env.ADMIN_EMAIL && password === env.ADMIN_PASSWORD) {
          return { id: "1", email, name: "Admin" }
        }

        return null
      },
    }),
  ],
  pages: {
    signIn: "/admin",
  },
})
