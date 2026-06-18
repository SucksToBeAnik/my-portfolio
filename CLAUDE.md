# Portfolio

Read [docs/rules.md](docs/rules.md) before writing any code. All development rules for this
project are defined there.

## Overview

Personal portfolio — a minimal black-and-white website centered in a 680px column with a
bottom-fixed glass navigation bar. Content is stored in Turso (SQLite via Drizzle) and
managed through an admin dashboard with login.

## Design System

### Layout
- Max-width 680px, centered horizontally with `mx-auto`
- Bottom-fixed nav bar with frosted glass effect (`backdrop-blur-xl`);
  sits inside the 680px column as a floating pill
- Page background: pure black (dark mode) or pure white (light mode)
- Background outside the centered column: solid black in both modes

### Typography
- **Headings:** Instrument Serif via `next/font` — editorial, refined
- **Body:** Inter via `next/font` — clean, legible
- Font size scale: `text-sm` (nav), `text-base` (body), `text-2xl` (section
  titles), `text-4xl` (page headings)

### Colors
- Dark mode: `#000` background, `#fff` text
- Light mode: `#fff` background, `#000` text
- Nav glass: `bg-white/10 dark:bg-black/10 backdrop-blur-xl`
- Borders/hairlines: `border-white/10` (dark) / `border-black/10` (light)
- No accent colors — pure black & white only

### Navbar
- Fixed at bottom center, floats within the 680px column
- Glass background, rounded-full pill shape
- Entries: Projects, Life, Books, Microblog, Tools, Ask
- Each entry: icon (Phosphor Icons, thin weight) + text label
- Active page highlighted with inverted background

## Pages & Routes

| Route | Page | Description |
|---|---|---|
| `/` | Home | Brief intro + quick links to sections |
| `/projects` | Projects | List of projects with descriptions |
| `/life` | Life Events | Timeline of personal milestones |
| `/books` | Books | Book catalog with ratings/reviews |
| `/microblog` | Microblog | Short-form posts |
| `/tools` | Tools | Tools, gear, software stack |
| `/ask` | Ask About Me | AI chat that answers questions about me |
| `/admin` | Admin Login | Login page |
| `/admin/dashboard` | Admin Dashboard | Content management dashboard |

## Database (Drizzle + Turso)

All tables defined in `src/db/schema.ts`.

### Tables

**admin_users**
- `id` integer PK
- `email` text unique
- `passwordHash` text
- `name` text
- `createdAt` timestamp

**projects**
- `id` integer PK
- `title` text
- `description` text
- `techStack` text (JSON array stored as text)
- `url` text nullable
- `githubUrl` text nullable
- `featured` integer (boolean)
- `sortOrder` integer
- `createdAt` timestamp
- `updatedAt` timestamp

**life_events**
- `id` integer PK
- `title` text
- `date` text (ISO date string)
- `description` text
- `type` text (milestone, achievement, travel, etc.)
- `sortOrder` integer
- `createdAt` timestamp

**books**
- `id` integer PK
- `title` text
- `author` text
- `coverUrl` text nullable
- `rating` integer nullable (1-5)
- `review` text nullable
- `status` text (reading, read, want_to_read)
- `sortOrder` integer
- `createdAt` timestamp

**microblogs**
- `id` integer PK
- `title` text
- `content` text
- `published` integer (boolean)
- `publishedAt` timestamp nullable
- `createdAt` timestamp
- `updatedAt` timestamp

**tools**
- `id` integer PK
- `name` text
- `description` text
- `url` text nullable
- `category` text
- `sortOrder` integer
- `createdAt` timestamp

**profile_data** (knowledge base for the AI chat)
- `id` integer PK
- `question` text (e.g. "What programming languages do you know?")
- `answer` text
- `category` text (skills, experience, education, etc.)
- `createdAt` timestamp

### Migrations
- Schema changes: `pnpm db:push` during development
- Production: `pnpm db:generate` then `pnpm db:migrate`

## Auth

- Use `next-auth` v5 with a credentials provider
- Single admin user stored in `admin_users` table
- Password hashed with `bcryptjs`
- Session stored in a JWT cookie
- Protect `/admin/*` routes with a middleware check
- Login page at `/admin` redirects to `/admin/dashboard` on success

## AI Chat (Ask About Me)

- Use the `ai` package from Vercel (AI SDK)
- xAI provider via `@ai-sdk/openai` with a custom base URL pointing to
  `https://api.x.ai/v1` (OpenAI-compatible endpoint)
- System prompt constructed from `profile_data` table rows (all Q&A pairs
  injected as context)
- Streaming response rendered token by token
- Chat UI: simple scrollable message list + text input at bottom
- No conversation history stored (stateless per session, or use
  `useChat` from `ai/react` with in-memory history)

## Component Architecture

All components in `src/components/`:

### Layout components
- `BottomNav` — the bottom navigation pill
- `PageShell` — wraps each page, provides the 680px centered layout
- `PageHeader` — page title + optional description

### Content components
- `ProjectCard` — single project display
- `TimelineEvent` — single life event in the timeline
- `BookCard` — single book entry
- `MicroblogPost` — single microblog post
- `ToolCard` — single tool entry

### Feature components
- `ChatWindow` — the Ask About Me chat interface
- `ChatMessage` — individual chat bubble
- `ChatInput` — text input + send button

### Admin components (in `src/app/admin/`)
- `LoginForm` — email + password form
- `AdminLayout` — shared admin layout with sidebar
- `ContentForm` — generic form for creating/editing any content type
- `ContentList` — generic list view for managing content

### Admin pages (server components calling actions)
- `/admin/dashboard` — overview + quick links
- `/admin/projects` — list + CRUD
- `/admin/life-events` — list + CRUD
- `/admin/books` — list + CRUD
- `/admin/microblogs` — list + CRUD
- `/admin/tools` — list + CRUD
- `/admin/profile-data` — manage AI knowledge base entries

## Server Actions (`src/actions/`)

Grouped by domain:
- `auth.ts` — `login`, `logout`, `getSession`
- `projects.ts` — CRUD actions
- `life-events.ts` — CRUD actions
- `books.ts` — CRUD actions
- `microblogs.ts` — CRUD actions
- `tools.ts` — CRUD actions
- `profile-data.ts` — CRUD actions

## Dependencies to Add

```
pnpm add @phosphor-icons/react ai @ai-sdk/openai next-auth@beta bcryptjs
pnpm add -D @types/bcryptjs
```

## Environment Variables (add to `src/lib/env.ts` and `.env.example`)

```
AUTH_SECRET=                # next-auth encryption secret
XAI_API_KEY=                # xAI API key for Grok chat
ADMIN_EMAIL=                # admin login email
ADMIN_PASSWORD=             # admin login password
```

## Development Workflow

1. `pnpm dev` — start dev server
2. Edit schema in `src/db/schema.ts`, run `pnpm db:push`
3. `pnpm check` — lint with Biome before committing
4. Content managed through `/admin/dashboard` (not hand-edited in DB)

## Mini Design Manifesto

- Every pixel is intentional. Nothing decorative without purpose.
- Black and white only. Texture comes from typography, spacing, and glass.
- The 680px column is a constraint that forces focus — treat it like a
  letterbox for your life's work.
- The bottom nav is a tool, not a decoration. Every entry earns its place.
- Microblog posts are short — think Twitter threads, not essays.
