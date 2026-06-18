export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg flex flex-col transition-colors duration-300">
      <main className="w-full max-w-[680px] mx-auto px-6 pt-16 pb-32 flex flex-col flex-1 min-h-0">
        {children}
      </main>
    </div>
  );
}
