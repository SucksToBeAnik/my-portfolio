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

## ✅ DONE (session 2)

### 1. Featured cap + mobile swipe for Selected Work — DONE
- Home `featuredProjects` query capped to **8** (`.limit(8)`, ordered by `sortOrder`).
- `SelectedProjects.tsx`: mobile horizontal swipe carousel (`snap-x snap-mandatory`,
  `overflow-x-auto`, cards `basis-[80%] shrink-0`), desktop keeps the 3-up grid (`lg:grid`).

### 2. Deep-dive project page `/projects/[id]` — DONE (full PostEditor path)
- **Schema:** dropped `description`; added `content`, `microview` (≤180), `tags`, `published`
  to `projects` (`pnpm db:push` applied).
- **`microview`** is the card hook + SEO/JSON-LD description — an editable field (required to
  publish), NOT derived from content.
- **Editor:** chose the **full PostEditor** experience over the inline drawer. New
  `ProjectEditor.tsx` (mirrors `PostEditor`) at routes `/admin/projects/new` +
  `/admin/projects/[id]/edit`; content stored as **markdown**, autosave, publish toggle,
  details panel. Old inline Drawer removed; list page now links to the editor routes.
  Shared bubble menu extracted to `post-editor/EditorBubbleMenu.tsx`.
- **`/projects` is published-only.** `ProjectCard` now follows the post-card pattern:
  whole card clickable → `/projects/${id}`, shows the `microview` (no derived blurb),
  cover (imageUrl → firstImage fallback), date + heart footer.
- **Inline media:** images AND videos upload while writing (slash `/Image` + `/Video`,
  paste, drag-drop). A video is just an image node whose src is a video URL — see
  `imageTitle.isVideoSrc`; `ImageNodeView` + `PostPreview` branch to `<video>`. The separate
  dashboard "Demo video" field was removed (legacy `videoUrl` column kept, no longer edited).
- **Route:** `src/app/projects/[id]/page.tsx` (reuses `PostPreview`, `generateMetadata`,
  hearts, prev/next, cover). 404s until `published`. `BottomNav` regex now includes `projects`.
- **Feature gating:** a project can't be featured unless published (UI disables the toggle +
  auto-unfeatures on unpublish; `actions/projects.ts` enforces it server-side).
- **Links:** home `SelectedProjects` + `/projects` `ProjectCard` link to `/projects/${id}`
  when published, else fall back to external `url`.

### 3. Section order + Now section — DONE
- Career label → **"Work Experience"**; order is **Recent Posts → Selected Work →
  Publications → Work Experience**.
- **Now** collapsed to a compact strip under the bio ("NOW" label on its own line, then
  `working on X · <github activity>`); standalone Now section removed.

