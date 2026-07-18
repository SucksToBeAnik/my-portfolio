import { PageTransition } from "@/components/PageTransition";

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg flex flex-col transition-colors duration-300 overflow-x-clip">
      <main className="w-full max-w-[700px] mx-auto px-6 pt-12 pb-32 flex flex-col flex-1 min-h-0">
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
}
