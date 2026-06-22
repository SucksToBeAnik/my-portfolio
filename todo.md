# Portfolio Improvements

## 1. Sitemap
- [ ] Create `src/app/sitemap.ts` — list all public URLs (/, /life, /books, /books/[id], /til, /til/[id], /posts/[id], /media, /utils/media/[id], /utils)
- [ ] Use `lastModified` from DB where available, fallback to build date
- [ ] Verify at `/sitemap.xml` after deploy

## 2. Open Graph / JSON-LD
- [ ] Add `<meta property="og:..." />` tags to all public pages (title, description, image, type, url)
- [ ] Add `<meta name="twitter:card" />` tags
- [ ] Add `<script type="application/ld+json">` for:
  - Homepage: `Person`
  - Books: `Book` (on detail pages)
  - TIL/Posts: `Article` (on detail pages)
  - Media: `Movie` / `TVSeries` (on detail pages)

## 3. Gallery page (within Life → discuss UI first)
- [ ] **Do not build yet** — discuss UI approach
- [ ] Likely approach: tabs on `/life` like `/utils?tab=timeline|gallery`

## 4. Travel map
- [ ] Build in one commit → review & iterate
- [ ] Use existing Leaflet dependency + `latitude`/`longitude` from `life_events`
- [ ] Full-page interactive map at `/travel` with color-coded markers by event type

## 5. Homepage "See my work" link
- [ ] After the bio paragraph on homepage (`page.tsx`), add a bold "See my work →" line
- [ ] On click, scrolls to the second snap panel (the projects/posts section, `#snap-container` scroll)
- [ ] Style: bold, subtle arrow, hover effect, same color as text

## 6. Breadcrumb label updates
- [ ] `/life`: `"Life"` → `"My Life"`
- [ ] `/media` (watch): `"Watch"` → `"What I Watch"`
- [ ] `/til`: `"TIL"` → `"Today I Learned"`
- [ ] `/books`: add breadcrumb with label `"Books I Read"`
- [ ] `/utils`: `"utils"` → `"Stuff I Use"`

## 7. Follow-up (if needed)
- [ ] Any fixes or iterations from review of items 1-6
