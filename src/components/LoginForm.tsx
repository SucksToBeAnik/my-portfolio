import { WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { GitHubSignInButton } from "@/components/GitHubSignInButton";
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
      {error && (
        <p className="flex items-start gap-2 px-3 py-2.5 text-xs text-fg border border-hairline rounded-lg">
          <WarningCircle weight="thin" className="w-4 h-4 shrink-0" />
          That GitHub account doesn't have access. Sign in with the one that owns this site.
        </p>
      )}
      <GitHubSignInButton />
    </form>
  );
}
