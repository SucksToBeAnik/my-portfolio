import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
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
      <div className="w-full max-w-xs flex flex-col items-center text-center">
        <Image
          src="/logo.png"
          alt=""
          width={56}
          height={56}
          priority
          className="w-14 h-14 rounded-full object-cover bg-white border border-hairline mb-5"
        />
        <h1 className="font-heading text-2xl mb-1.5">Welcome back</h1>
        <p className="text-sm text-muted mb-7">Sign in to manage the site.</p>
        <div className="w-full">
          <LoginForm error={Boolean(error)} />
        </div>
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-1.5 text-xs text-muted hover:text-fg transition-colors"
        >
          <ArrowLeft weight="thin" className="w-3.5 h-3.5" />
          Back to the site
        </Link>
      </div>
    </div>
  );
}
