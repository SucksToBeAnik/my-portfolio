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

### 12. `/books` list fetches full review HTML for the grid — [x] DONE (2026-07-27) **[verified]**
> Done alongside items 23–26. Worth recording the size: the review HTML across all 8 books
> totals **713 bytes**, so this was hygiene, not a payload win. Don't expect a measurable
> difference from column-narrowing on a table this small.

### 13. Unoptimized full-size images on public grids & post/project bodies — [ ]
- `src/app/media/page.tsx:62` — raw `<img>`, no dimensions, full-size posters in a grid.
- `src/components/post-editor/PostFigure.tsx` / `PostVideo.tsx` — `/posts/[id]` and
  `/projects/[id]` bodies render every inline image/video at the original Cloudinary
  upload URL (raw `<img loading="lazy">`, no `f_auto,q_auto,w_` transform, no reserved
  dimensions) — media-heavy posts ship multi-MB pages. Same URL-transform helper fix;
  images never render wider than ~920px (`wide`), so `w_1200` is a safe cap.
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

### 19. Dead / duplicated code — [ ] (partly done 2026-07-26)
- `adminUsers` table (`src/db/schema.ts:3-11`) is unused — auth compares against env vars.
- `src/actions/public.ts` duplicates getters from `microblogs.ts` / `books.ts`.
- Heart helpers overlap: `heart-counts.ts:getHeartsCounts` (used by `/til` + both detail
  routes) vs `hearts.ts:getHeartsForEntities` (now 0 refs — kept deliberately, it's the
  batched count+hearted query worth reaching for if hearts ever return to a list view).
  Collapse into one parameterized function.
  ~~`getHeartData`~~ deleted 2026-07-26; `GithubActivityLine.tsx` + `lib/github.ts` deleted
  too (the component was unreferenced and the lib was imported only by it).

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

## P2 (added 2026-07-26) — instant-feel caching & third-party image origins

Line numbers in this section are as of commit `e2c23a6` + the homepage change that follows it.

### 22. Cache public pages until an admin write, not on a timer — [x] DONE (2026-07-26) **[verified]**
> Done for `/`, `/posts`, `/projects`, `/posts/[id]`, `/projects/[id]`: `revalidate = 3600`
> → `revalidate = false`, so the HTML is served from cache indefinitely and only a
> `revalidatePath` from an admin action refreshes it. Verified first that every source
> feeding each page revalidates its path (projects/microblogs/publications/life-events/
> gallery incl. `toggleGalleryFeatured`/cvs/site-config all do, on create + update +
> delete + reorder; draft save/discard correctly only touch `/admin/*`).
>
> Three blockers had to be cleared first:
> - **Hearts removed from `/posts` and `/projects` list cards.** Each `HeartButton` was
>   firing its own `getHeartCount` server action on mount (no `initialHearted` prop), so a
>   20-card page made 20 POST round-trips to Turso after hydration with every button
>   `disabled` until its own request landed. Cards are now plain `<Link>`s — which also
>   removed the stretched-overlay-link hack (`absolute inset-0` link + `z-10` footer) that
>   only existed to keep the heart button clickable.
> - **Relative dates moved client-side.** `relativeDate` read `Date.now()` at render time,
>   so "3 days ago" would have frozen at build. New `src/components/RelativeDate.tsx`
>   (client): SSRs a label from `useState`'s lazy initializer so there's no flash, then
>   re-derives it in an effect on mount, with `suppressHydrationWarning`. Deduped two
>   identical copies (`posts/page.tsx` + `SelectedProjects.tsx`).
> - **`revalidatePath` removed from `toggleHeart`.** It called `revalidatePath("/microblog")`
>   and `("/project")` — not real routes, so no-ops for posts/projects — but for TILs
>   `entityType` is `"til"`, so `/til` and `/til/<id>` *were* being invalidated on every
>   heart click. `HeartButton` loads its own live count on mount anyway, so the baked count
>   is only ever a pre-hydration flash; busting the cache for it bought nothing.
>
> Also deleted as dead: `getHeartData` (0 refs), `GithubActivityLine.tsx` + `lib/github.ts`
> (component unreferenced; the lib was imported only by it).

### 23. Still on the 1-hour timer — same flip, needs the same audit — [~] PARTLY DONE (2026-07-27)
> Flipped to `revalidate = false`: **`/sites`, `/stacks`, `/books`, and `/books/[id]`**.
> Still on `3600`: `/life`, `/media`, `/til`, `/photos`.
>
> What the flip needed on each:
> - **`/books/[id]` had a revalidation hole** — it was on the timer and *nothing*
>   revalidated it; `revalidateBooks()` only named `/admin/books`, `/books` and `/`. Flipping
>   it without fixing that would have frozen every book detail page permanently.
>   `revalidateBooks(id?)` now takes the id, and update/delete pass it.
> - **`/sites` clock read** — `siteGroup` moved into `SitesIndex`. Note the pattern differs
>   from `RelativeDate`: a lazy `useState` initializer is fine for a text node, but the
>   buckets change DOM *structure*, so it takes a `renderedAt` prop (matching SSR at
>   hydration) and re-buckets in a `useEffect` on mount.
> - `/stacks`, `/books` had no clock reads; all their write paths already revalidated.

- `/til` bakes heart counts (`til/page.tsx:27`) — same situation as the detail pages, so
  harmless, but confirm before flipping.

### 24. Third-party image origins on `/stacks`, `/sites`, `/books` — [x] DONE (2026-07-27) **[measured]**
> Measured before, by fetching every image these pages load:
> `/sites` 29 logos / **216 KB** / **24 hosts** (into 20×20 slots), `/stacks` 8 / 62 KB /
> 8 hosts, `/books` 8 covers / 145 KB / 3 hosts. After: `/sites` 31 logos / **15 KB** /
> **1 host**, `/books` 8 covers / **72 KB** / 1 host — at a *higher* source resolution.
>
> **The obvious fix does not work here.** 9 of the 29 site logos are SVG and 5 are `.ico`:
> Next's optimizer 400s on SVG without `dangerouslyAllowSVG`, and sharp cannot decode ICO
> at all, so ~14/29 would have broken. Don't retry the `next/image` route on this data.
>
> What landed instead (step 1 + step 3 of the plan below):
> - `mirrorToCloudinary()` in `src/lib/cloudinary.ts` — Cloudinary fetches the remote URL
>   itself, so no bytes pass through us. Verified against the live account that the existing
>   *unsigned* `portfolio` preset accepts a remote URL and handles png, **ico and svg**
>   (15.4 KB ico → 0.7 KB delivered). Called from `createSite`/`updateSite`/`createStack`/
>   `updateStack`/`createBook`/`updateBook`, and stored in place — no schema change.
> - `cdnImage(url, width)` for delivery (`c_fit,w_,f_auto,q_auto`; `c_fit` never upscales,
>   so a 16px favicon stays 16px). Non-Cloudinary URLs pass through untouched.
> - `ReactDOM.preload` for above-the-fold images on all three pages (12 / 16 / 8).
> - Book covers take OpenLibrary's `-L` instead of `-M` before mirroring — `-M` is 180px and
>   was rendering soft in the 200×300 slot on `/books/[id]`.
> - One-time migration of 47 rows; originals saved to `metadata-backup.json` (delete it once
>   you're happy). **3 test assets** from the feasibility check are in the media library:
>   `f9lt00yjokzzwjppwmz7`, `ftxbmcslqrkkxdbo3ggx`, `n2mjhtn8fr0v2bqvzvkk` — delete manually.
>
> **Known limits.** There's no `CLOUDINARY_API_SECRET` in the env, so uploads are unsigned
> and nothing can be deleted programmatically — deleting a site/stack/book orphans its
> Cloudinary asset. At ~50 rows that's noise; add the secret if it ever matters.
> `remotePatterns: "**"` (item 21) is *now* tightenable for these three pages but was left
> alone: `/media` and `/life` still legitimately point at arbitrary hosts.
>
> Original finding follows.
The user-visible symptom: favicons, logos and book covers only start loading when someone
lands on the page, so rows and shelves pop in. Root cause is not lazy-loading alone — every
image is on a *different* third-party origin, so the browser pays DNS + TLS per host with no
HTTP/2 multiplexing, and `loading="lazy"` means the fetch doesn't even start until layout
runs. Related to item 13, but that one is about Cloudinary assets *we already own*; this is
about assets on hosts we don't control.

- `src/components/SitesIndex.tsx:40` — `www.google.com/s2/favicons` fallback per site.
- `src/components/SitesIndex.tsx:66-70` — raw `<img loading="lazy">`, arbitrary logo CDNs.
- `src/app/stacks/page.tsx:137` — same, for `stack.imageUrl`.
- `src/components/Bookshelf.tsx:33-41` — remote covers at `w-[84px]`, full-size downloads.
- `src/components/BookCover3D.tsx:23` — `/books/[id]` cover, 200×300, unoptimized.
- **Fix, in impact order:**
  1. **Persist them on our own CDN at write time.** Cloudinary's upload API accepts a
     remote URL as `file`, so it's one extra call in `createSite` / `createStack` / the book
     save path — no downloading bytes ourselves. Store the Cloudinary URL. Gets everything
     onto one origin, immutable, transformable (`w_40,f_auto,q_auto`), and immune to
     third-party link rot. Needs a backfill action for existing rows.
  2. **Request at rendered size** — a 20×20 favicon slot currently pulls a full-size PNG.
  3. **Preload the above-the-fold ones**: `ReactDOM.preload(url, { as: "image" })` in the
     server component for the first ~12 rows / first shelf row, so they're in the `<head>`
     of the *cached* HTML and download with the document. Keep `lazy` below the fold and for
     the horizontally-scrolled book overflow.
  4. Only if third-party origins survive step 1: `<link rel="preconnect">` for the one or
     two that remain.

### 25. `/sites` and `/stacks` do Microlink lookups + DB writes inside a cached render — [x] DONE (2026-07-27) **[verified]**
> Both pages are pure reads now. Repair moved to `refreshMetadata()` in
> `src/actions/maintenance.ts`, behind a **"Refresh metadata"** button on the admin
> dashboard (`maxDuration = 60` on that route, bounded concurrency of 4).
>
> The failure mode was live, not theoretical: **3 of 31 sites** have a Microlink lookup that
> fails every time (`ray.so`, `streamlinehq.com`, `makingsoftware.com`), so `/sites` was
> re-requesting them — 8s timeout each — on every single revalidation, forever. Those rows
> now get a *mirrored* favicon and keep `title = null` as the retry marker, so they cost
> nothing per render. `/stacks`' backfill turned out to already be a no-op loop (0 of 8 rows
> had a null `previewImage`).
>
> Also self-healing now: a stored og-image URL that 404s (cmux's had rotated) is re-derived
> from the page instead of being re-copied forever.
>
> Original finding follows.
`src/app/sites/page.tsx:26-38` and `src/app/stacks/page.tsx:43-55` back-fill metadata for
rows where it's null — inside the page render, `await`ing up to 8s of third-party calls
(`Promise.all` over every null row) and issuing `db.update()`s. On a cold cache that *is*
the page's TTFB, and a failed lookup silently retries on every revalidation forever. This
was a deliberate one-time-backfill compromise when item 2 landed; it has outlived that.
**Fix:** move it to an admin action + a "Refresh metadata" button (`createSite`/`createStack`
already fetch on create), leaving the public pages as pure reads. Unblocks item 23 for
`/stacks` and removes the last reason these pages can't be cached until a write.

### 26. `LinkPreview` popup images start loading on hover — [x] DONE (2026-07-27) **[verified]**
> Done, but **the fix as originally written would not have worked**: the popup rendered its
> image through `next/image`, so `new Image().src = data.image` would have warmed a URL the
> browser never requests (`/_next/image?url=…&w=…`). The popup now uses a plain `<img>` on
> a `cdnImage()` URL — which is also the right call for hover previews, since routing
> arbitrary hover URLs through the optimizer spends transformations on images most visitors
> never see — and `handleMouseEnter` warms exactly that URL before the 400 ms timer.
> Broken/rotated og-images now hide their frame via `onError` instead of showing a broken box.
>
> `src/lib/microlink-cache.ts` **stays**. The tail of this item assumed only `/sites` and
> `/stacks` use `LinkPreview`, but the homepage, `Timeline`, `ProjectLink` and media
> `SourceLink` all use it *without* preloaded metadata and depend on that client fetch.
>
> Original finding follows.
`src/components/LinkPreview.tsx:115` renders the og-image only once the popup is visible, so
there's a visible blank box on first hover. Preloading all ~30 og-images upfront is the wrong
trade (heavy, and most are never hovered). **Fix:** in `handleMouseEnter`, kick off
`new Image().src = data.image` immediately — *before* the existing 400 ms popup timer
(`LinkPreview.tsx:77`) — so it's warm by the time the popup paints and costs nothing for
visitors who never hover.

Also: rows with no persisted metadata still call Microlink from the *browser* on hover
(`LinkPreview.tsx:92`, via `src/lib/microlink-cache.ts`). Once item 25 guarantees metadata is
always persisted, that client fetch and `microlink-cache.ts` can be deleted outright —
falling back to domain + favicon when metadata is genuinely missing.

---

## Checked and fine — don't re-audit

- All public routes are static/ISR with `generateStaticParams` on detail routes; no stray
  `force-dynamic`/`cookies()`/`headers()`. Confirmed via build. (As of 2026-07-26, `/`,
  `/posts`, `/projects` and the two detail routes are `revalidate = false` — cached until an
  admin write; the rest are still on `3600`, see item 23.)
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

Revised tail (2026-07-26), for the caching/image thread specifically:

8. ~~Item 25~~ — done 2026-07-27.
9. ~~Item 26~~ — done 2026-07-27.
10. ~~Item 24~~ — done 2026-07-27 for `/sites`, `/stacks`, `/books`.
11. Item 23 — `/sites`, `/stacks`, `/books`, `/books/[id]` flipped 2026-07-27;
    `/life`, `/media`, `/til`, `/photos` still on the timer.

---

## Fixed 2026-07-27 while doing items 23–26 (weren't in this tracker)

- **`/admin/sites` re-queried Microlink from the browser for every row, every visit** —
  31 requests per page load, even though `title`/`logo` have been persisted on the row since
  item 2 and `getSites()` already returned them. Now reads the stored fields.
- **`updateSite` / `updateStack` let you change the URL without refreshing metadata**, so a
  row kept the previous site's title, logo and og-image indefinitely. Both re-look up on URL
  change; a failed lookup clears to null (reads as the domain) rather than lying.
- **`/books/[id]` was never revalidated by any write path** — see item 23.
