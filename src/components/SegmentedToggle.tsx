"use client";

import type { Icon } from "@phosphor-icons/react";

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  icon: Icon;
};

// Two or more icon states shown side by side, the current one filled. Reads as
// a state picker rather than a mystery switch: you can see which mode you're in
// and which one you'd be moving to.
//
// Real radio inputs under visually-hidden labels, not buttons — arrow-key
// navigation and the announced group come for free that way.
export function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  const name = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div
      role="radiogroup"
      aria-label={label}
      data-sound="success"
      className="flex items-center gap-0.5 p-0.5 rounded-full bg-nav-hover-bg shrink-0"
    >
      {options.map((option) => {
        const OptionIcon = option.icon;
        const active = option.value === value;
        return (
          <label
            key={option.value}
            title={option.label}
            className={`flex items-center justify-center w-7 h-7 rounded-full transition-colors duration-200 cursor-pointer has-[:focus-visible]:ring-1 has-[:focus-visible]:ring-nav-text ${
              active
                ? "bg-nav-active-bg text-nav-active-text"
                : "text-nav-text hover:text-nav-text-hover"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={active}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            <span className="sr-only">{option.label}</span>
            <OptionIcon weight={active ? "regular" : "thin"} className="w-4 h-4 shrink-0" />
          </label>
        );
      })}
    </div>
  );
}
