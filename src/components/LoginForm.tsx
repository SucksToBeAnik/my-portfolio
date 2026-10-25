import { GithubLogo } from "@phosphor-icons/react/dist/ssr";
import { signIn } from "@/lib/auth";

export function LoginForm({ error }: { error?: boolean }) {
  return (
    <form
      action={async () => {
        "use server";
        await signIn("github", { redirectTo: "/admin/dashboard" });
      }}
      className="space-y-3"
    >
      {error && <p className="text-xs text-red-400">That account isn't allowed to sign in.</p>}
      <button
        type="submit"
        className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium bg-nav-active-bg text-nav-active-text rounded-lg hover:opacity-90 transition-all cursor-pointer"
      >
        <GithubLogo weight="thin" className="w-4 h-4" />
        Continue with GitHub
      </button>
    </form>
  );
}
