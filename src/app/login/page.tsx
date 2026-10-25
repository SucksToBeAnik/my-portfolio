import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

// Nothing on the site links here — the only way in is typing the URL, or being
// bounced here by the middleware after asking for an /admin route while signed
// out. Preferences shows the admin rows only once a session exists.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session) redirect("/admin/dashboard");
  // next-auth bounces a rejected GitHub account back here with ?error=…
  const { error } = await searchParams;

  // The negative margins cancel PageShell's own top and bottom padding so this
  // box is exactly the viewport height and the form lands on the true centre —
  // otherwise the shell's pb-32 (room for the nav pill) pushes it visibly high.
  return (
    <div className="flex-1 flex items-center justify-center -mt-6 md:-mt-12 -mb-32">
      <div className="w-full max-w-xs">
        <h1 className="font-heading text-sm uppercase tracking-wider text-nav-text mb-5">
          Sign in
        </h1>
        <LoginForm error={Boolean(error)} />
      </div>
    </div>
  );
}
