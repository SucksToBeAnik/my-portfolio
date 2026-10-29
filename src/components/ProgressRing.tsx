const RADIUS = 6;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Small circular meter; `value` is 0–1. Drawn in the current text colour. */
export function ProgressRing({ value, className }: { value: number; className?: string }) {
  const filled = Math.min(1, Math.max(0, value)) * CIRCUMFERENCE;

  return (
    <svg viewBox="0 0 16 16" className={`w-3.5 h-3.5 -rotate-90 ${className ?? ""}`} aria-hidden>
      <circle
        cx="8"
        cy="8"
        r={RADIUS}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        opacity={0.15}
      />
      <circle
        cx="8"
        cy="8"
        r={RADIUS}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${CIRCUMFERENCE}`}
        opacity={filled > 0 ? 0.7 : 0}
      />
    </svg>
  );
}
