import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Toaster } from "sonner";
import {
  SquaresFour,
  FolderOpen,
  Heart,
  BookOpenText,
  Quotes,
  Wrench,
  Link as LinkIcon,
} from "@phosphor-icons/react/dist/ssr";
import { AdminBreadcrumb } from "@/components/AdminBreadcrumb";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: SquaresFour },
  { href: "/admin/projects", label: "Projects", icon: FolderOpen },
  { href: "/admin/life-events", label: "Life Events", icon: Heart },
  { href: "/admin/books", label: "Books", icon: BookOpenText },
  { href: "/admin/microblogs", label: "Microblog", icon: Quotes },
  { href: "/admin/stacks", label: "Stacks", icon: Wrench },
  { href: "/admin/sites", label: "Sites", icon: LinkIcon },
];

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

        <main className="flex-1 min-w-0 overflow-y-auto px-4 py-5 pb-24 md:p-6">
          {/* Mobile admin nav */}
          <div className="md:hidden mb-6">
            <AdminBreadcrumb />
          </div>

          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden flex items-center justify-around px-2 py-2 bg-bg/95 backdrop-blur-xl border-t border-hairline overflow-x-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] text-fg/50 hover:text-fg transition-colors shrink-0"
            >
              <Icon weight="thin" className="w-4 h-4" />
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>

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
