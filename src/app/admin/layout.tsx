import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { QueryProvider } from "@/lib/QueryProvider";
import { Toaster } from "sonner";
import {
  SquaresFour,
  FolderOpen,
  Heart,
  BookOpenText,
  Quotes,
  Wrench,
} from "@phosphor-icons/react/dist/ssr";
import { AdminBreadcrumb } from "@/components/AdminBreadcrumb";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: SquaresFour },
  { href: "/admin/projects", label: "Projects", icon: FolderOpen },
  { href: "/admin/life-events", label: "Life Events", icon: Heart },
  { href: "/admin/books", label: "Books", icon: BookOpenText },
  { href: "/admin/microblogs", label: "Microblog", icon: Quotes },
  { href: "/admin/tools", label: "Tools", icon: Wrench },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/");

  return (
    <QueryProvider>
    <main className="flex flex-col flex-1 min-h-0">
      <div className="flex h-full bg-bg text-fg flex-1">
        <aside className="hidden md:flex flex-col w-56 border-r border-hairline bg-bg/50 shrink-0 p-4">
          <AdminBreadcrumb />

          <nav className="flex flex-col gap-1 flex-1 min-h-0 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-fg/60 hover:text-fg hover:bg-hover-bg transition-colors shrink-0"
                >
                  <Icon weight="thin" className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 min-w-0 overflow-y-auto p-6">{children}</main>
      </div>
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
    </QueryProvider>
  );
}
