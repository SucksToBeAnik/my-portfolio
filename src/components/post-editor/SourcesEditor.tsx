"use client";

import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd";
import { CircleNotch, DotsSixVertical, Plus, X } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";
import { lookupSource } from "@/actions/microblogs";
import { type Source, sourceHost } from "@/lib/sources";

/** A source as the editor holds it: every field a string, plus a stable key for dragging. */
export interface EditableSource {
  key: string;
  url: string;
  title: string;
  publisher: string;
  author: string;
  year: string;
  note: string;
  icon: string;
}

// Keys for loaded rows come from their position so the server render and the
// hydrating client agree; rows added later get a random one.
export function toEditable(s: Source, i: number): EditableSource {
  return {
    key: `loaded-${i}`,
    url: s.url,
    title: s.title,
    publisher: s.publisher ?? "",
    author: s.author ?? "",
    year: s.year ?? "",
    note: s.note ?? "",
    icon: s.icon ?? "",
  };
}

function isUrl(v: string) {
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** The saveable form: drops half-filled rows and empty fields. */
export function toSources(list: EditableSource[]): Source[] | null {
  const out = list
    .filter((s) => isUrl(s.url.trim()) && s.title.trim())
    .map((s) => ({
      url: s.url.trim(),
      title: s.title.trim(),
      publisher: s.publisher.trim() || null,
      author: s.author.trim() || null,
      year: s.year.trim() || null,
      note: s.note.trim() || null,
      icon: s.icon || null,
    }));
  return out.length > 0 ? out : null;
}

// No width here: block inputs add w-full, and the inline row sizes its own.
const bare = "min-w-0 bg-transparent placeholder-fg/25 focus:outline-none focus:placeholder-fg/40";

/**
 * The "Sources" block under the post body. Paste a link and its title, site,
 * author and year are looked up; everything stays editable inline, rows drag
 * to reorder, and an optional note becomes the handwritten aside on the post.
 */
export function SourcesEditor({
  value,
  onChange,
}: {
  value: EditableSource[];
  onChange: (next: EditableSource[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const [looking, setLooking] = useState(false);

  async function add() {
    const url = draft.trim();
    if (!url) return;
    if (!isUrl(url)) {
      toast.error("That doesn't look like a link");
      return;
    }
    if (value.some((s) => s.url.trim() === url)) {
      toast.error("Already in the sources");
      return;
    }
    setLooking(true);
    const meta = await lookupSource(url).catch(() => null);
    setLooking(false);
    setDraft("");
    onChange([
      ...value,
      {
        key: crypto.randomUUID(),
        url,
        title: meta?.title ?? "",
        publisher: meta?.publisher ?? sourceHost(url),
        author: meta?.author ?? "",
        year: meta?.year ?? "",
        note: "",
        icon: meta?.icon ?? "",
      },
    ]);
    if (!meta?.title) toast("Couldn't read the page title — add one by hand");
  }

  function update(key: string, patch: Partial<EditableSource>) {
    onChange(value.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  }

  function handleDragEnd(result: DropResult) {
    if (!result.destination) return;
    const next = Array.from(value);
    const [moved] = next.splice(result.source.index, 1);
    next.splice(result.destination.index, 0, moved);
    onChange(next);
  }

  return (
    <section className="mt-16 border-t border-hairline pt-6">
      <h2 className="text-xs font-heading uppercase tracking-wider text-muted">Sources</h2>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="sources">
          {(provided) => (
            <ol ref={provided.innerRef} {...provided.droppableProps} className="mt-4 space-y-1">
              {value.map((s, index) => (
                <Draggable key={s.key} draggableId={s.key} index={index}>
                  {(provided, snapshot) => (
                    <li
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`group flex gap-2 rounded-xl px-2 py-2.5 transition-colors ${snapshot.isDragging ? "bg-hover-bg shadow-lg" : "hover:bg-hover-bg/50"}`}
                    >
                      <div
                        {...provided.dragHandleProps}
                        className="flex h-6 shrink-0 cursor-grab items-center gap-1 text-fg/30 active:cursor-grabbing"
                      >
                        <DotsSixVertical weight="thin" className="h-4 w-4" />
                        <span className="w-4 font-mono text-[11px] tabular-nums text-muted">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <input
                          value={s.title}
                          onChange={(e) => update(s.key, { title: e.target.value })}
                          placeholder="Title (required)"
                          aria-label="Title"
                          className={`${bare} w-full text-sm font-medium text-fg`}
                        />
                        <input
                          value={s.url}
                          onChange={(e) => update(s.key, { url: e.target.value })}
                          placeholder="https://"
                          aria-label="Link"
                          className={`${bare} w-full font-mono text-[11px] ${isUrl(s.url.trim()) ? "text-muted" : "text-red-400"}`}
                        />
                        {/* Same order the post prints them in: Author, Title (Venue Year). */}
                        <div className="flex items-baseline gap-2 text-xs text-muted">
                          <input
                            value={s.author}
                            onChange={(e) => update(s.key, { author: e.target.value })}
                            placeholder="Author"
                            aria-label="Author"
                            className={`${bare} flex-[3]`}
                          />
                          <span aria-hidden className="text-fg/20">
                            ·
                          </span>
                          <input
                            value={s.publisher}
                            onChange={(e) => update(s.key, { publisher: e.target.value })}
                            placeholder="Venue / site"
                            aria-label="Venue or site"
                            className={`${bare} flex-[2]`}
                          />
                          <span aria-hidden className="text-fg/20">
                            ·
                          </span>
                          <input
                            value={s.year}
                            onChange={(e) => update(s.key, { year: e.target.value })}
                            placeholder="Year"
                            aria-label="Year"
                            inputMode="numeric"
                            maxLength={4}
                            className={`${bare} w-10 shrink-0 tabular-nums`}
                          />
                        </div>
                        <input
                          value={s.note}
                          onChange={(e) => update(s.key, { note: e.target.value })}
                          placeholder="why it's here (optional)"
                          aria-label="Note"
                          maxLength={160}
                          className={`${bare} w-full font-hand text-[17px] text-muted`}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => onChange(value.filter((o) => o.key !== s.key))}
                        aria-label="Remove source"
                        className="h-7 shrink-0 rounded-lg p-1.5 text-fg/30 transition-colors hover:bg-hover-bg hover:text-fg sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                      >
                        <X weight="light" className="h-4 w-4" />
                      </button>
                    </li>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </ol>
          )}
        </Droppable>
      </DragDropContext>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
        className="mt-2 flex items-center gap-2 rounded-xl border border-dashed border-hairline px-3 py-2 focus-within:border-fg/30"
      >
        {looking ? (
          <CircleNotch weight="light" className="h-4 w-4 shrink-0 animate-spin text-muted" />
        ) : (
          <Plus weight="light" className="h-4 w-4 shrink-0 text-muted" />
        )}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={looking}
          placeholder="Paste a link and press Enter"
          aria-label="Add a source"
          className={`${bare} w-full text-xs text-fg`}
        />
      </form>
    </section>
  );
}
