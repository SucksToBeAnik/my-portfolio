# Improvements Tracker

Findings from a full performance / UX / code-quality audit (2026-07-19). This is a
low-traffic personal site, so only obvious, worthwhile improvements are listed — no
micro-optimizations. Work items one at a time; check them off as they land.

Items marked **[verified]** were confirmed by reading the code directly (not just flagged
by an audit pass). Line numbers are as of commit `af6152a`.

---

## P0 — Security & correctness bugs

### 1. Mutating server actions don't check auth — [x] DONE (2026-07-19) **[verified]**
> Fixed: `requireAdmin()` added to `src/lib/auth.ts`; called first in every mutating
> action across all 12 files, plus the admin-only external lookups (`searchBooks`,
> `lookupIMDb`, `searchIMDb`) since they burn third-party API quota. Verified end-to-end
> against a prod build: unauthenticated action POST → `Error: Unauthorized` (masked
> digest to client, no data); public actions (search index, hearts, subscribe) untouched.
Middleware only guards `/admin/*` page routes, but server actions are POST endpoints
dispatched by action ID to *whatever route the caller is on*. `QuickAdd` is mounted in the
root layout, so its actions (`createBook`, `createSite`, `createMedia`, `createStack`,
`createTil`, `createGalleryItem`) are reachable from `/` — and none of them, nor any other
mutating action, verifies a session. Anyone can create/update/delete content.

- Affected: every mutating action in `src/actions/` — `projects.ts:41-86`,
  `microblogs.ts:36-116`, `books.ts:25-61`, `media.ts:59-91`, `gallery.ts:21-72`,
  `cvs.ts:23-68`, `life-events.ts:29-65`, `publications.ts:21-57`, `sites.ts:18-51`,
  `stacks.ts:22-54`, `tils.ts:30-64`, `site-config.ts:13-28`
- The correct pattern already exists once: `notifySubscribers` in
  `src/actions/microblogs.ts:90` checks `await auth()`.
- **Fix:** add a shared `requireAdmin()` helper (in `src/lib/auth.ts`) that throws when
  `(await auth())?.user` is missing; call it first in every mutating action.

### 2. `/sites` page: anonymous visitors trigger DB writes + it's fully client-rendered — [x] DONE (2026-07-19) **[verified]**
> Fixed: `sites` table gained `title`/`logo`/`image` columns; `src/lib/microlink.ts`
> (server-only) fetches metadata once per site — on create in `createSite`, plus a
> one-time backfill in the page for pre-existing rows. The page is now a static/ISR
> server component (`revalidate = 3600`, proper `<title>`/description) with a small
> `SitesIndex` client island for tag filtering; `LinkPreview` accepts preloaded metadata
> so visitors make zero Microlink calls and zero DB writes. `saveSiteDescription` is
> deleted; `createSiteFromUrl` collapsed into `createSite`. Verified against a prod
> build: `/sites` HTML contains server-rendered titles, no spinner.
> 2026-07-20 follow-up: `/stacks` gained hover link previews and got the same treatment —
> `stacks.previewImage` column (og-image via `fetchSiteMeta` in `createStack` + page
> backfill; `""` = fetched, no image), preview preloads the curated name/description/logo,
> so visitors make zero Microlink calls there too.
Was: a fully client-rendered page (blank spinner, no SSR/SEO) where every visitor's
browser called the rate-limited Microlink API once per site and invoked a mutating server
action (`saveSiteDescription`) during anonymous reads.

### 3. `maxOrder` computed wrong in three create actions — [x] DONE (2026-07-19) **[verified]**
> Fixed alongside item 1 (same functions): `createMedia`, `createGalleryItem`,
> `createStack` now use `sql`max(...)`` like the other create actions.
`src/actions/media.ts:61-65`, `src/actions/gallery.ts:23-27`, `src/actions/stacks.ts:24-28`
do `select({ max: table.sortOrder }).limit(1)` with no aggregate and no `ORDER BY` — that
returns the *first row's* sortOrder, not the max, so new items get colliding sort orders.

- **Fix:** use the correct pattern from `src/actions/projects.ts:44`:
  `select({ max: sql<number>`max(${table.sortOrder})` })`.

### 4. `deleteBook` leaves the public `/books` page stale — [x] DONE (2026-07-19)
> Fixed alongside item 1: `deleteBook` now also revalidates `/books`.

---

## P1 — High-impact performance (public bundle & rendering)

> All five done 2026-07-19. Measured route JS (uncompressed, prod build):
> `/` 818→725 KB, `/posts/[id]` 1008→720 KB, `/projects/[id]` 1029→747 KB,
> `/sites` 824→729 KB, `/books` 806→711 KB.

### 5. `lowlight` (~35 highlight.js languages) ships to public post/project pages — [x] DONE (2026-07-19) **[verified]**
> Fixed: `CodeBlock` is no longer `"use client"` (highlighting runs server-side on public
> pages; the admin editors still compile it into their client tree, which already bundles
> lowlight); new tiny `CopyButton` client component. Verified: hljs spans present in SSR
> HTML, zero public chunks contain the highlighter. −~285 KB on post/project pages.
`src/components/post-editor/CodeBlock.tsx` is `"use client"` and imports
`lowlight` + `hast-util-to-jsx-runtime`, running `lowlight.highlight()` in render. It's
rendered by `PostPreview` (a server component) on `/posts/[id]` and `/projects/[id]`, so
the whole highlighter is bundled and re-executed in the browser even though the highlighted
markup is already in the SSR HTML. The only real interactivity is the copy button.

- **Fix:** make `CodeBlock` a server component (highlight server-side) and extract a tiny
  `"use client"` `CopyButton`. The editor keeps its own lowlight instance — this only
  changes the public reader path.

### 6. Phosphor icon barrel imports likely inflate every route — [x] DONE (2026-07-19)
> Fixed: `experimental.optimizePackageImports: ["@phosphor-icons/react"]` in
> `next.config.ts` (part of the ~95 KB/route drop measured above).
Many client components import from the `@phosphor-icons/react` barrel (`BottomNav`,
`AuthMenu`, `QuickAdd`, `SearchModal`, `ChatPopup`, `HeartButton`, `ShareButton`,
`StarRating`, `ProjectLink`, `FilterPopover`, …) while others already use the tree-shaken
`@phosphor-icons/react/dist/ssr` subpath (`Timeline`, `Breadcrumb`, `SectionHeader`,
`BackButton`, `UserEmail`). `next.config.ts` sets no `optimizePackageImports`.

- **Fix:** add `experimental: { optimizePackageImports: ["@phosphor-icons/react"] }` to
  `next.config.ts` (one line), or standardize on the `/dist/ssr` subpath.
- **Verify with a before/after build** — if Next 16 already optimizes this package by
  default the change is a no-op, close the item.

### 7. `QuickAdd` (admin-only) ships to every anonymous visitor — [x] DONE (2026-07-19) **[verified]**
> Fixed: new `QuickAddGate` (checks `useSession`, then `next/dynamic`-imports QuickAdd,
> `ssr: false`); the session gate inside QuickAdd itself was removed.
Mounted unconditionally in `src/app/layout.tsx:101`; it renders `null` without a session
(`QuickAdd.tsx:388`) but its full module graph (`BookSearch`, `TagPicker`, `StarRating`,
six server-action client refs) is in every public page's bundle.

- **Fix:** wrap in a small client gate that checks `useSession()` and only then
  `next/dynamic`-imports the real QuickAdd, so anonymous visitors download nothing.

### 8. `SearchModal` is eagerly bundled globally — [x] DONE (2026-07-19)
> Fixed: `SearchOverlay` keeps only the keydown listener; the modal is
> `next/dynamic`-imported and first mounted on the first ⌘K.
`SearchOverlay` (root layout) statically imports `SearchModal`
(`src/components/SearchOverlay.tsx:4`), which returns `null` until ⌘K. The whole search UI
is in every route's initial JS.

- **Fix:** `next/dynamic` the modal and mount it on first open (keep the keydown listener
  in the tiny `SearchOverlay` shell).

### 9. `SessionProvider` wraps the whole public site — [x] DONE (2026-07-19, amended)
> Resolution: passing `session` from the layout is NOT viable — `auth()` reads cookies and
> would force every page dynamic, killing ISR. The provider must stay (the nav `AuthMenu`
> login uses `useSession` on every page). Applied instead: `refetchOnWindowFocus={false}`
> so visitors make at most one session fetch per load, with a comment in the layout
> explaining the constraint. Don't revisit unless AuthMenu moves off `useSession`.
`src/app/layout.tsx:94` mounts next-auth's `SessionProvider` with no `session` prop, so
every visitor's browser fetches `/api/auth/session` on every page load, and the next-auth
client ships in the shared bundle — for a site with exactly one logged-in user (you).

- **Fix (simple):** `const session = await auth()` in the root layout and pass it to
  `<SessionProvider session={session}>` — kills the client fetch. (Verify it doesn't force
  public pages dynamic; if it does, scope the provider to the admin layout + the QuickAdd
  gate instead.)

---

## P2 — Medium: data fetching & images

### 10. `generateMetadata` + page double-fetch on every detail route — [ ] **[verified: no React.cache anywhere]**
`books/[id]`, `media/[id]`, `posts/[id]`, `projects/[id]`, `til/[id]` each query the same
row twice per render (metadata + page). **Fix:** wrap each per-id fetch in `React.cache()`.

### 11. Sequential query waterfalls on post/project detail pages — [ ]
`src/app/posts/[id]/page.tsx:85-107` and `src/app/projects/[id]/page.tsx:85-106` await
`heartCounts`, `prev`, and `next` in three sequential Turso round-trips.
**Fix:** one `Promise.all` for the three queries after the post loads.

### 12. `/books` list fetches full review HTML for the grid — [ ]
`src/app/books/page.tsx:24` does `db.select().from(books)` but the grid only uses
title/author/cover/status/category/rating. **Fix:** select only those columns.

### 13. Unoptimized full-size images on public grids — [ ]
- `src/app/media/page.tsx:62` — raw `<img>`, no dimensions, full-size posters in a grid.
- `src/components/GalleryDisplay.tsx:36-41`, `src/components/ClickableImage.tsx:20` — no
  reserved aspect ratio → masonry layout shift as images load.
- `src/components/SelectedProjects.tsx:35` — plain `<img>` is *intentional* (animated GIF
  covers), but GIFs are served at original size.
- **Fix:** use `next/image` (or explicit dimensions) for posters/gallery; for Cloudinary
  assets add a URL-transform helper in `src/lib/cloudinary.ts` (`f_auto,q_auto,w_…`) —
  `f_auto` keeps GIFs animated (serves animated WebP/AVIF).

### 14. Sitemap gaps — [ ] **[verified]**
`src/app/sitemap.ts`:
- Missing `/projects`, `/projects/[id]`, and `/posts` entries entirely — the flagship
  content isn't in the sitemap.
- Uses `process.env.VERCEL_URL` directly (violates the env rule in `docs/rules.md`, and
  VERCEL_URL is the deployment-hash domain, not the canonical one). `siteUrl()` from
  `src/lib/seo.ts` already exists — use it.
- Built once per deploy with no `revalidate`; add `export const revalidate = 3600` to
  match the rest of the site.

### 15. PostEditor / ProjectEditor are ~95% duplicated (655 + 743 lines) — [ ] **[verified sizes]**
Identical Tiptap setup, autosave/debounce, upload handlers, bubble menu, dialogs — only the
extra project fields and action pair differ. Every editor fix currently lands twice.
**Fix:** extract a shared `useContentEditor` hook + editor shell; pass per-type
fields/actions as props. (Biggest single code-quality win; do it in its own session.)

---

## P3 — Low: polish & hygiene

### 16. Admin dashboard: 12 sequential DB round-trips — [ ]
`src/app/admin/dashboard/page.tsx:28-51` awaits 10 counts + 2 config lookups one-by-one.
**Fix:** one `Promise.all`.

### 17. Three reorder actions update rows in sequential loops — [ ]
`projects.ts:78-86`, `microblogs.ts:105-116`, `life-events.ts:55-65` use `for … await`;
the other five reorders already use `Promise.all`. Make them consistent.

### 18. No DB indexes; hearts is queried on every public page — [ ]
`src/db/schema.ts` has none. Worth adding: composite `hearts(entity_type, entity_id)`;
optionally `microblogs(published)` and `sites(url)`. Skip the rest — id lookups use the PK.

### 19. Dead / duplicated code — [ ]
- `adminUsers` table (`src/db/schema.ts:3-11`) is unused — auth compares against env vars.
- `src/actions/public.ts` duplicates getters from `microblogs.ts` / `books.ts`.
- Heart helpers overlap: `heart-counts.ts` vs `hearts.ts:getHeartsForEntities`;
  `getHeartCount` vs `getHeartData`. Collapse into one parameterized function.

### 20. No `loading.tsx` in the public tree — [ ]
On-demand ISR renders of not-yet-generated detail pages block with a blank screen.
Add a lightweight `loading.tsx` for `posts/[id]`, `projects/[id]`, `books/[id]`, etc.

### 21. Small fixes, batch together — [ ]
- `src/app/page.tsx:91-92` — two single-row `siteConfig` queries → one `inArray` query.
- `src/actions/site-config.ts:23-28` — `formData.get(...) as string` unvalidated (zod it);
  two sequential `setConfig` calls → `Promise.all`.
- `src/components/PostToc.tsx:32-66` — wrap scroll-spy `computeActive` in a rAF guard.
- `src/app/admin/projects/page.tsx:54` — `handleDragEnd(result: any)` → `DropResult`;
  `src/app/admin/books/page.tsx:102,130` — `data as any` in mutations.
- `next.config.ts` — `images.remotePatterns` allows `**` (any host proxied through the
  image optimizer); restrict to the hosts actually used (Cloudinary, covers, IMDb).
- `getMediaPublic` selects ~13 columns for `generateStaticParams` which needs only ids.

---

## Checked and fine — don't re-audit

- All public routes are static/ISR (`revalidate = 3600`) with `generateStaticParams` on
  detail routes; no stray `force-dynamic`/`cookies()`/`headers()`. Confirmed via build.
- Home and `/life` already parallelize their queries with `Promise.all`.
- `@tiptap/*` and `leaflet` never reach public bundles (admin-only; leaflet lazy-loaded).
- `exifr` is dynamically imported (`QuickAdd.tsx:355`); `ChatPopup` is `dynamic({ ssr:false })`.
- `PostPreview` (react-markdown + remark) is a server component — no client cost.
- `BookCover3D` / `MediaCase3D` / `PageTransition` are pure CSS — no per-frame JS.
- Theme is read from localStorage in a pre-hydration inline script — no flash/mismatch.
- Editor autosave is debounced (1300 ms) with a saving guard — no per-keystroke writes.
- Admin pages gate rendering via `auth()` + `redirect` in `src/app/admin/layout.tsx`
  (pages are safe; the *actions* are the gap — item 1).

## Suggested order of work

1. Item 1 (auth on actions) — security, one shared helper touched into 12 files.
2. Items 3 + 4 (correctness one-liners) — quick session.
3. Item 2 (`/sites` rework) — self-contained page rewrite.
4. Items 5–9 (bundle wins) — measure with `pnpm build` before/after each.
5. Items 10–14 — data fetching + images.
6. Item 15 (editor consolidation) — the big refactor, own session.
7. P3 batch whenever convenient.
