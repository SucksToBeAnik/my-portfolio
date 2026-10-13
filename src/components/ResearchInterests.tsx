export function ResearchInterests({ interests }: { interests: string[] }) {
  if (interests.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-heading uppercase tracking-wider text-muted">
        Research interests
      </p>
      <ul className="flex flex-wrap gap-1.5">
        {interests.map((interest) => (
          <li
            key={interest}
            className="rounded-full border border-hairline bg-fg/[0.03] px-2.5 py-1 text-xs text-fg/75"
          >
            {interest}
          </li>
        ))}
      </ul>
    </div>
  );
}
