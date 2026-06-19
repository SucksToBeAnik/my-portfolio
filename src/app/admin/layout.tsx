import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Toaster } from "sonner";
import { AdminBreadcrumb } from "@/components/AdminBreadcrumb";
import { AdminNav } from "@/components/AdminNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/");

  return (
    <main className="flex flex-col flex-1 min-h-0">
      <div className="flex h-full bg-bg text-fg flex-1">
        <aside className="hidden md:flex flex-col w-56 border-r border-hairline bg-bg/50 shrink-0 p-4">
          <AdminBreadcrumb />
          <AdminNav variant="sidebar" />
        </aside>

        <main className="flex-1 min-w-0 overflow-y-auto px-4 py-5 pb-24 md:p-6">
          {/* Mobile admin nav */}
          <div className="md:hidden mb-6">
            <AdminBreadcrumb />
          </div>

          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <AdminNav variant="bottom" />

      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: "var(--bg)",
            color: "var(--fg)",
            border: "1px solid var(--hairline)",
            borderRadius: "12px",
            fontSize: "13px",
            fontFamily: "var(--font-sans), sans-serif",
          },
        }}
      />
      </main>
  );
}
