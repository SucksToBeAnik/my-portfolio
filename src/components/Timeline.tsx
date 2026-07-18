"use client";

import { Briefcase, GraduationCap, MapPin, MapTrifold, Star } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useRef, useState } from "react";
import { LifeImage } from "@/components/LifeImage";
import { LinkPreview } from "@/components/LinkPreview";

export interface LifeEvent {
  id: number;
  title: string;
  startDate: string;
  endDate: string | null;
  description: string | null;
  imageUrl: string | null;
  url: string | null;
  type: string;
  current: boolean | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
}

const typeIcons: Record<string, React.ReactNode> = {
  education: <GraduationCap weight="fill" className="w-4 h-4" />,
  work: <Briefcase weight="fill" className="w-4 h-4" />,
  travel: <MapPin weight="fill" className="w-4 h-4" />,
  milestone: <Star weight="fill" className="w-4 h-4" />,
};

function parseYear(date: string): string | null {
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? null : String(d.getFullYear());
}

function monthLabel(date: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("en-US", { month: "short" });
}

function fullLabel(date: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

// Within a year group the big rail already shows the year, so the per-event
// label collapses to months. Cross-year ends fall back to the full label.
function eventDateLabel(event: LifeEvent, groupYear: string): string {
  const start = monthLabel(event.startDate);
  if (event.current) return `${start} — Present`;
  if (event.endDate) {
    const end =
      parseYear(event.endDate) === groupYear ? monthLabel(event.endDate) : fullLabel(event.endDate);
    return end === start ? start : `${start} — ${end}`;
  }
  return start;
}

interface YearGroup {
  year: string;
  events: LifeEvent[];
}

// Group consecutive events by start-year, preserving the incoming (admin-sorted)
// order. A year that reappears merges back into its existing chapter.
function groupByYear(items: LifeEvent[]): YearGroup[] {
  const groups: YearGroup[] = [];
  const byYear = new Map<string, YearGroup>();
  for (const event of items) {
    const year = parseYear(event.startDate) ?? "—";
    let group = byYear.get(year);
    if (!group) {
      group = { year, events: [] };
      byYear.set(year, group);
      groups.push(group);
    }
    group.events.push(event);
  }
  return groups;
}

function Reveal({ children, index }: { children: React.ReactNode; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            observer.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-500 ease-out ${
        shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
      }`}
      style={{ transitionDelay: shown ? `${Math.min(index, 4) * 60}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}

function EventCard({ event, groupYear }: { event: LifeEvent; groupYear: string }) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-hairline bg-fg/[0.02] transition-all duration-300 hover:border-fg/20 hover:bg-fg/[0.04]">
      <div className="flex flex-col md:flex-row md:items-stretch">
        {event.imageUrl && (
          <div className="relative h-44 w-full shrink-0 md:h-auto md:w-32 md:self-stretch">
            <LifeImage
              src={event.imageUrl}
              alt={event.title}
              className="absolute inset-0 h-full w-full"
            />
          </div>
        )}
        <div className="min-w-0 flex-1 p-4 md:p-5">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 font-heading text-[10px] uppercase tracking-[0.2em] text-muted transition-colors group-hover:text-fg">
              <span className="[&>svg]:h-3.5 [&>svg]:w-3.5">
                {typeIcons[event.type] || (
                  <span className="block h-1.5 w-1.5 rounded-full bg-current" />
                )}
              </span>
              {event.type}
            </span>
            <div className="flex shrink-0 items-center gap-2">
              {event.location && (
                <a
                  href={`https://www.google.com/maps?q=${encodeURIComponent(event.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={event.location}
                  aria-label={`Location: ${event.location}`}
                  className="text-muted no-underline transition-colors hover:text-fg"
                >
                  <MapTrifold className="h-3.5 w-3.5" />
                </a>
              )}
              <span className="whitespace-nowrap font-heading text-[10px] uppercase tracking-[0.15em] text-muted">
                {eventDateLabel(event, groupYear)}
              </span>
            </div>
          </div>
          <h2 className="font-heading text-base leading-snug">
            {event.url ? (
              <LinkPreview url={event.url}>
                <a
                  href={event.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="no-underline"
                >
                  {event.title}
                </a>
              </LinkPreview>
            ) : (
              event.title
            )}
          </h2>
          {event.description && (
            <div
              className="prose-content mt-2 text-xs text-fg/80"
              dangerouslySetInnerHTML={{ __html: event.description }}
            />
          )}
        </div>
      </div>
    </article>
  );
}

export function Timeline({ items }: { items: LifeEvent[] }) {
  const groups = groupByYear(items);
  const [activeYear, setActiveYear] = useState(groups[0]?.year ?? "");
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const year = entry.target.getAttribute("data-year");
            if (year) setActiveYear(year);
          }
        }
      },
      // Thin trigger band near the top: whichever chapter crosses it is "active".
      { rootMargin: "-15% 0px -80% 0px", threshold: 0 },
    );
    for (const node of sectionRefs.current.values()) observer.observe(node);
    return () => observer.disconnect();
  }, []);

  if (items.length === 0) {
    return <p className="text-sm text-muted">Nothing here yet.</p>;
  }

  return (
    <div className="space-y-12 md:space-y-16">
      {groups.map((group) => {
        const active = group.year === activeYear;
        return (
          <section
            key={group.year}
            data-year={group.year}
            ref={(node) => {
              if (node) sectionRefs.current.set(group.year, node);
              else sectionRefs.current.delete(group.year);
            }}
            className="grid grid-cols-[2.75rem_1fr] gap-4 md:grid-cols-[4.5rem_1fr] md:gap-8"
          >
            <div className="relative">
              <div
                className={`sticky top-8 select-none font-heading leading-[0.8] tabular-nums tracking-tighter transition-opacity duration-500 ${
                  active ? "opacity-100" : "opacity-15"
                }`}
              >
                <span className="block text-3xl md:text-5xl">{group.year.slice(0, 2)}</span>
                <span className="block text-3xl text-muted md:text-5xl">
                  {group.year.slice(2) || " "}
                </span>
              </div>
            </div>

            <div className="min-w-0 space-y-4 md:space-y-5">
              {group.events.map((event, i) => (
                <Reveal key={event.id} index={i}>
                  <EventCard event={event} groupYear={group.year} />
                </Reveal>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
