import Link from "next/link";

export type ShelfBook = {
  id: number;
  title: string;
  author: string;
  coverUrl: string | null;
};

function ShelfBook({ book }: { book: ShelfBook }) {
  return (
    <Link
      href={`/books/${book.id}`}
      aria-label={book.title}
      className="group relative block w-[84px] shrink-0 [perspective:900px] sm:w-[96px]"
    >
      {/* contact shadows — kept OUTSIDE the lifting cover so they stay on the
          shelf surface. A tight dark core at the point of contact + a softer,
          wider ambient shadow. Both react as the book lifts on hover. */}
      <div
        aria-hidden
        className="absolute -bottom-[6px] left-1/2 h-2 w-[80%] -translate-x-1/2 rounded-[50%] bg-black/40 blur-[6px] transition-all duration-300 group-hover:h-2.5 group-hover:w-[62%] group-hover:opacity-70"
      />
      <div
        aria-hidden
        className="absolute -bottom-[2px] left-1/2 h-1 w-[70%] -translate-x-1/2 rounded-[50%] bg-black/55 blur-[2px] transition-all duration-300 group-hover:opacity-0"
      />

      {/* the cover — this is the only part that lifts + tilts on hover */}
      <div className="relative aspect-[2/3] origin-bottom overflow-hidden rounded-[2px] shadow-[0_5px_12px_rgba(0,0,0,0.4)] transition-transform duration-300 ease-out will-change-transform group-hover:[transform:translateY(-12px)_rotateY(-9deg)]">
        {book.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.coverUrl}
            alt={book.title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-neutral-800 p-2 text-center font-heading text-[10px] leading-snug text-white/70">
            {book.title}
          </div>
        )}
        {/* spine shade on the left + soft top-lit sheen */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-black/40 via-black/10 to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/15" />
      </div>
    </Link>
  );
}

export function Bookshelf({ label, books }: { label: string; books: ShelfBook[] }) {
  return (
    <section className="space-y-4">
      <h2 className="flex items-baseline gap-2 font-heading text-xs uppercase tracking-[0.2em]">
        {label}
        <span className="font-sans text-[10px] tracking-normal text-fg/30">{books.length}</span>
      </h2>

      <div className="relative">
        {/* THE SHELF — painted first so the books paint ON TOP of it and read
            as resting on the surface (rather than being clipped behind it).
            A light, thin top plane (lit from above) folds down into a darker
            front face; the whole plank floats on a soft drop shadow. The
            `shelf-grain` overlay breaks up the flat fill so it reads as a matte
            material rather than smooth plastic. */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0"
          style={{ filter: "drop-shadow(0 14px 16px rgba(0,0,0,0.45))" }}
        >
          {/* top surface: the plane the books stand on, receding slightly up.
              The fold into the front face is carried by the color/gradient
              change alone — no hard line — so the edge reads soft, not outlined. */}
          <div
            className="shelf-grain relative h-[18px]"
            style={{
              background: "linear-gradient(180deg, var(--shelf-top) 0%, var(--shelf-top-2) 100%)",
              clipPath: "polygon(18px 0, calc(100% - 18px) 0, 100% 100%, 0 100%)",
            }}
          />
          {/* front face — a dark bottom inset gives the plank visible thickness
              and depth under the edge rather than reading as a flat strip. */}
          <div
            className="shelf-grain relative h-[13px] rounded-b-[9px]"
            style={{
              background: "linear-gradient(180deg, var(--shelf-front-1), var(--shelf-front-2))",
              boxShadow:
                "inset 0 1px 0 var(--shelf-edge), inset 0 -2px 3px -1px rgba(0,0,0,0.55)",
            }}
          />
          {/* vertical dividers across the top surface — hairline grooves (dark
              cut + light lip) so the shelf reads as boards butted together. */}
          {["33.33%", "66.66%"].map((left) => (
            <span
              key={left}
              aria-hidden
              className="absolute top-0 h-[18px] w-px"
              style={{
                left,
                background: "var(--shelf-seam)",
                boxShadow: "1px 0 0 var(--shelf-seam-lip)",
              }}
            />
          ))}
        </div>

        {/* THE BOOKS — pb pushes their bases down onto the top surface, so a
            sliver of the lit shelf shows in front of them and their contact
            shadows fall on a lit plane. */}
        <div className="no-scrollbar relative flex items-end gap-5 overflow-x-auto px-6 pb-[22px] pt-10">
          {books.map((book) => (
            <ShelfBook key={book.id} book={book} />
          ))}
        </div>
      </div>
    </section>
  );
}
