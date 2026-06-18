export function Spinner({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center py-16 ${className}`}>
      <div className="w-5 h-5 border-2 border-fg/30 border-t-fg rounded-full animate-spin" />
    </div>
  );
}
