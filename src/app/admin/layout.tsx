import { redirect } from "next/navigation";
import { AdminBreadcrumb } from "@/components/AdminBreadcrumb";
import { AdminNav } from "@/components/AdminNav";
import { ResponsiveToaster } from "@/components/ResponsiveToaster";
import { auth } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/");

  return (
    <div className="-mx-6 -mt-12 -mb-32 h-screen flex flex-col pt-12 pb-32">
      <div className="flex flex-1 min-h-0 bg-bg text-fg">
        <aside className="hidden md:flex flex-col w-56 border-r border-hairline bg-bg/50 shrink-0 p-4">
          <AdminBreadcrumb />
          <AdminNav variant="sidebar" />
        </aside>

        <main className="flex-1 min-w-0 min-h-0 overflow-y-auto px-4 pb-24 md:px-6">
          {/* Mobile admin nav */}
          <div className="md:hidden pt-5 mb-6">
            <AdminBreadcrumb />
          </div>

          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <AdminNav variant="bottom" />

      <ResponsiveToaster />
    </div>
  );
}
