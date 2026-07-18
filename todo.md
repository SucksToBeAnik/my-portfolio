# Portfolio — Home Revamp: status & next steps

## ✅ DONE (this session)

Home page turned into a minimal continuous scroll (snap container / ContentTabs /
ShowcaseScroll / SeeWorkLink all removed). Structure now:

Hero → Now → **Selected Work** (projects) → **Publications** → **Work** (career) → **Recent Posts**

- **Selected Work** (`SelectedProjects.tsx`) — `featured` projects only, in a wider full-bleed
  section (capped ~940px), 3-up grid on large screens. Card = mono uppercase title → cover
  image/GIF (`imageUrl`, plain `<img>` so GIFs animate) → relative date. No description, no hearts.
  Cards link to the project's external `url` (fallback `/projects`).
- **Publications** (`HomePublications.tsx`) — all publications, border rows (title + date).
- **Work / career** (`CareerTrack.tsx`) — life events `type === "work"`, grouped rounded card.
  Left: `title` + `description` subtitle. Right: `role` + year range.
- **Recent Posts** (`RecentPosts.tsx`) — latest 4 published microblogs, border rows.
- Shared: `SectionHeader.tsx` (label only; supports optional link, currently unused),
  `HomeListRow.tsx` (title in body font; date in mono heading font, all-caps; subtle `fg/80` hover).
- **`/projects` page** (`src/app/projects/page.tsx`) — full projects grid, reusable
  `ProjectCard.tsx` (cover + hearts + links, no video embed).
- **Nav** — "Work" is now a plain link to `/projects` (Briefcase icon). All snap/panel scroll
  logic removed from `BottomNav.tsx` and `PageTransition.tsx` (the latter previously locked
  `html { overflow-y: hidden }` on home — that was the "can't scroll" bug, now fixed).
- **Schema** — added nullable `role` to `life_events` (pushed); wired into
  `actions/life-events.ts` + admin life-events form (Role input, work type only).
- **Admin projects** — image field relabeled "Cover image / GIF"; ★/☆ featured toggle already
  exists per project; video upload kept, labeled "deep-dive only".
- Kept (unused for now, for the deep-dive): `VideoEmbed.tsx`, `projects.videoUrl`.

---

## 📋 TODO (next session)

### 1. Featured cap + mobile swipe for Selected Work
- Home shows ALL featured projects with **no limit** today. Cap to **8** (order by `sortOrder`)
  in the home query (`src/app/page.tsx`, `featuredProjects`).
- (Featured toggle already exists in admin — no new button needed.)
- **Mobile:** revamp `SelectedProjects.tsx` so the projects are a horizontal **swipe carousel**
  (scroll-snap x: `snap-x snap-mandatory`, `overflow-x-auto`, cards `shrink-0` at ~80% width)
  instead of a vertical stack. Desktop keeps the 3-up grid (`lg:grid` / `lg:overflow-visible`).

### 2. Deep-dive project page `/projects/[id]` (mirror the post page)
- **Schema (`projects` table) — add:**
  - `content text` (nullable) — rich HTML body, edited with `ContentEditor` (same as microblogs);
    inline images/videos come for free via the post editor.
  - `published integer boolean default false` — so a project can be featured/listed before its
    writeup is finished; the `[id]` page 404s (or shows blurb only) until published.
  - `tags text` (nullable, optional) — for future filtering, like microblogs.
  - Keep as-is: `description` (short blurb), `imageUrl` (cover/GIF), `videoUrl` (optional hero/demo),
    `url`, `githubUrl`, `workedOn`. Run `pnpm db:push`.
- **Admin** — add a `ContentEditor` + Published toggle to the projects form (copy the microblog
  admin form's editor setup). Wire `content`/`published`/`tags` into `actions/projects.ts` Zod schema.
- **Route** — create `src/app/projects/[id]/page.tsx` modeled on `src/app/posts/[id]/page.tsx`:
  reuse `PostPreview` to render `content`, add `generateMetadata`, hearts, prev/next nav, cover.
  `BottomNav` already hides the pill on `/(posts|books|media|til)/[id]` — add `projects` to that
  regex so the detail page gets the same full-bleed treatment.
- **After it's live:** change home `SelectedProjects` cards + `/projects` `ProjectCard` to link to
  `/projects/${id}` (internal) instead of the external `url`.

### 3. Section order + Now section (my recommendations — confirm before building)
- **Naming collision:** projects = "Selected Work" and career = "Work". Rename career section
  label → **"Experience"** (`CareerTrack.tsx` SectionHeader).
- **Order:** group professional sections → **Selected Work → Experience → Publications → Recent Posts**
  (move CareerTrack above HomePublications in `page.tsx`).
- **Now section:** takes prime space under the hero for thin value (only "Working on" + GitHub
  after reading/TIL were removed). Recommend collapsing into a compact one-line strip directly
  under the bio (e.g. `Now — working on X · <github activity>`) instead of a standalone section
  with its own header — or drop it if `working_on` is usually empty.
