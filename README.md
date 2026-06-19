# Portfolio

Personal portfolio for [@suckstobeanik](https://github.com/SucksToBeAnik) — a minimal black-and-white website with a phone-like centered layout, glass navigation, and admin content management.

Built with [Next.js](https://nextjs.org), [Turso](https://turso.tech) + [Drizzle](https://orm.drizzle.team), and deployed on [Vercel](https://vercel.com).

## Features

- Projects, books, microblog, life timeline, and tools showcase
- AI-powered "Ask About Me" chat (powered by Groq)
- Admin dashboard with full CRUD and drag-and-drop sorting
- Global search (Cmd+K)
- Dark/light theme with persistent preference
- Heart/like system for projects
- YouTube lite embeds and link previews
- Responsive — works on mobile and desktop

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** Turso (SQLite) via Drizzle ORM
- **Auth:** NextAuth v5 (Credentials)
- **AI:** Vercel AI SDK + Groq
- **Styling:** Tailwind CSS v4
- **Icons:** Phosphor Icons (thin weight)
- **Rich Text:** Tiptap
- **File Upload:** Cloudinary

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=
AUTH_SECRET=
GROQ_API_KEY=
ADMIN_EMAIL=
ADMIN_PASSWORD=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
```

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm check` | Lint with Biome |
| `pnpm db:push` | Push schema to Turso |
| `pnpm db:generate` | Generate migrations |
| `pnpm db:migrate` | Run migrations |

## Deployment

Connected to Vercel via GitHub — every push to `main` auto-deploys.

Production: https://suckstobeanik.vercel.app
