"use client";

interface TagPickerProps {
  value: string;
  onChange: (value: string) => void;
  tags: string[];
  compact?: boolean;
}

export function TagPicker({ value, onChange, tags, compact = false }: TagPickerProps) {
  const selected = value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  function toggle(tag: string) {
    const next = selected.includes(tag)
      ? selected.filter((t) => t !== tag)
      : [...selected, tag];
    onChange(next.join(", "));
  }

  if (compact) {
    return (
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
        {tags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => toggle(tag)}
            className={`px-2.5 py-1 rounded-lg text-[10px] whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
              selected.includes(tag)
                ? "bg-fg text-bg"
                : "bg-hover-bg text-fg/60 hover:text-fg"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={() => toggle(tag)}
          className={`px-3 py-1.5 rounded-lg text-[11px] transition-colors cursor-pointer ${
            selected.includes(tag)
              ? "bg-fg text-bg"
              : "bg-hover-bg text-fg/60 hover:text-fg"
          }`}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}
