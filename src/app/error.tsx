"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
      <p className="text-sm text-fg/50">Something went wrong</p>
      <button
        type="button"
        onClick={reset}
        className="px-3 py-1.5 text-xs font-medium bg-fg text-bg rounded-lg hover:opacity-90 transition-all cursor-pointer"
      >
        Try again
      </button>
    </div>
  );
}
