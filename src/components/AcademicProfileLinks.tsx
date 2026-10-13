/** Scholarly profiles as text links — there are no icons for these worth using. */
export function AcademicProfileLinks({ profiles }: { profiles: { label: string; url: string }[] }) {
  if (profiles.length === 0) return null;

  return (
    <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
      {profiles.map((p) => (
        <li key={p.label}>
          <a
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-fg/20 underline-offset-4 transition-colors hover:text-fg hover:decoration-fg"
          >
            {p.label}
          </a>
        </li>
      ))}
    </ul>
  );
}
