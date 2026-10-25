import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { env } from "@/lib/env";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    GitHub({
      clientId: env.AUTH_GITHUB_ID,
      clientSecret: env.AUTH_GITHUB_SECRET,
    }),
  ],
  session: { maxAge: 60 * 60 * 24 * 7 },
  callbacks: {
    // Any GitHub account can complete OAuth; only the owner's gets a session.
    // Matched on the numeric account id, which survives username changes and
    // can't be claimed by someone registering a freed-up username.
    signIn({ profile }) {
      return profile?.id != null && String(profile.id) === env.ADMIN_GITHUB_ID;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});

/**
 * Guard for server actions. Middleware only protects /admin page routes —
 * actions are POST endpoints reachable from any route they're imported into,
 * so every mutating action must call this first.
 */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
}
