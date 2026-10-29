import { index, integer, primaryKey, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import type { PublicationLink, Venue } from "@/lib/publications";
import type { RelatedRef } from "@/lib/research";
import type { Source } from "@/lib/sources";

export const adminUsers = sqliteTable("admin_users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  content: text("content"),
  microview: text("microview"),
  tags: text("tags"),
  imageUrl: text("image_url"),
  url: text("url"),
  githubUrl: text("github_url"),
  workedOn: text("worked_on"),
  featured: integer("featured", { mode: "boolean" }).default(false),
  published: integer("published", { mode: "boolean" }).default(false),
  // JSON snapshot of unpublished edits to a published project. When set, the
  // public page keeps rendering the live columns above until the draft is
  // explicitly published. Null for unpublished projects (they edit live).
  draft: text("draft"),
  sortOrder: integer("sort_order").default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const lifeEvents = sqliteTable("life_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  url: text("url"),
  role: text("role"),
  type: text("type").notNull(),
  current: integer("current", { mode: "boolean" }).default(false),
  location: text("location"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  sortOrder: integer("sort_order").default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const books = sqliteTable("books", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  author: text("author").notNull(),
  coverUrl: text("cover_url"),
  rating: integer("rating"),
  review: text("review"),
  quote: text("quote"),
  category: text("category"),
  status: text("status", { enum: ["reading", "read", "want_to_read"] })
    .notNull()
    .default("want_to_read"),
  sortOrder: integer("sort_order").default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const microblogs = sqliteTable("microblogs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  microview: text("microview"),
  tags: text("tags"),
  imageUrl: text("image_url"),
  // Listed at the end of the post; see @/lib/sources.
  sources: text("sources", { mode: "json" }).$type<Source[]>(),
  published: integer("published", { mode: "boolean" }).default(false),
  publishedAt: integer("published_at", { mode: "timestamp" }),
  // JSON snapshot of unpublished edits to a published post — see projects.draft.
  draft: text("draft"),
  sortOrder: integer("sort_order").default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const hearts = sqliteTable("hearts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  entityType: text("entity_type").notNull(),
  entityId: integer("entity_id").notNull(),
  visitorId: text("visitor_id").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const stacks = sqliteTable("stacks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  url: text("url").notNull(),
  platform: text("platform"),
  category: text("category"),
  // Microlink og-image, fetched server-side on create (+ one-time backfill).
  // "" = lookup succeeded but the site has no og image; don't refetch.
  previewImage: text("preview_image"),
  sortOrder: integer("sort_order").default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const sites = sqliteTable("sites", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  url: text("url").notNull(),
  tags: text("tags"),
  title: text("title"),
  description: text("description"),
  logo: text("logo"),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const siteConfig = sqliteTable("site_config", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const tils = sqliteTable("tils", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  sortOrder: integer("sort_order").default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const cvs = sqliteTable("cvs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  fileUrl: text("file_url").notNull(),
  // Optional LaTeX source the PDF was compiled from, kept for reference only.
  latexSource: text("latex_source"),
  // Legacy single showcase flag, superseded by the per-mode flags below. Unused;
  // kept so the additive push doesn't break the deployed build.
  showcased: integer("showcased", { mode: "boolean" }).default(false),
  // The CV linked from the home page, chosen separately for each audience.
  showcaseAcademia: integer("showcase_academia", { mode: "boolean" }).default(false),
  showcaseIndustry: integer("showcase_industry", { mode: "boolean" }).default(false),
  sortOrder: integer("sort_order").default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const publications = sqliteTable("publications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),
  // Legacy single-venue field, superseded by `venues`. Unused; kept so the
  // additive push doesn't break the deployed build. Drop after the next deploy.
  venue: text("venue"),
  // Comma-separated byline; see parseAuthors in @/lib/publications.
  authors: text("authors"),
  venues: text("venues", { mode: "json" }).$type<Venue[]>(),
  links: text("links", { mode: "json" }).$type<PublicationLink[]>(),
  bibtex: text("bibtex"),
  url: text("url"),
  publishedOn: text("published_on"),
  sortOrder: integer("sort_order").default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const researchInterests = sqliteTable("research_interests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  // The open question this interest chases; the homepage headline. Falls back
  // to the title when empty.
  question: text("question").notNull().default(""),
  keywords: text("keywords", { mode: "json" }).$type<string[]>(),
  // Short Markdown write-up, collapsed under "Why this matters".
  summary: text("summary").notNull().default(""),
  related: text("related", { mode: "json" }).$type<RelatedRef[]>(),
  // Featured interests lead the homepage; the rest sit behind "+ N more".
  // Nullable like gallery.featured: drizzle-kit reads a `false` default as no
  // default and wants to rebuild the table for a NOT NULL column.
  featured: integer("featured", { mode: "boolean" }).default(false),
  sortOrder: integer("sort_order").default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const gallery = sqliteTable("gallery", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  imageUrl: text("image_url").notNull(),
  width: integer("width"),
  height: integer("height"),
  takenAt: text("taken_at"),
  featured: integer("featured", { mode: "boolean" }).default(false),
  sortOrder: integer("sort_order").default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const media = sqliteTable("media", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  imdbId: text("imdb_id"),
  title: text("title").notNull(),
  year: text("year"),
  type: text("type", { enum: ["movie", "series"] })
    .notNull()
    .default("movie"),
  posterUrl: text("poster_url"),
  imdbUrl: text("imdb_url"),
  plot: text("plot"),
  review: text("review"),
  rating: integer("rating"),
  status: text("status", { enum: ["watching", "watched", "planned", "dropped"] })
    .notNull()
    .default("planned"),
  seasons: integer("seasons"),
  sortOrder: integer("sort_order").default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// One row per anonymous visitor per day; the composite key makes recording a
// visit an idempotent insert and a day's unique count a plain COUNT(*).
// `visitorHash` is an HMAC of IP + user agent keyed per day, so it can't be
// reversed to an IP or linked across days. The rest is what the first beacon
// of the day saw — coarse location from Vercel's geo headers, where they came
// from, and the parsed browser — plus the pages they went on to open. All of it
// is null on rows recorded before these columns existed.
export const dailyVisitors = sqliteTable(
  "daily_visitors",
  {
    day: text("day").notNull(),
    visitorHash: text("visitor_hash").notNull(),
    firstSeenAt: integer("first_seen_at", { mode: "timestamp" }),
    lastSeenAt: integer("last_seen_at", { mode: "timestamp" }),
    country: text("country"),
    region: text("region"),
    city: text("city"),
    timezone: text("timezone"),
    latitude: real("latitude"),
    longitude: real("longitude"),
    referrer: text("referrer"),
    pages: text("pages", { mode: "json" }).$type<string[]>(),
    browser: text("browser"),
    os: text("os"),
    device: text("device"),
  },
  (t) => [primaryKey({ columns: [t.day, t.visitorHash] })],
);

// What a visitor did on a page, keyed to their `daily_visitors` row. `time` is
// how long a page was visible (one row per stretch, so a page that was tabbed
// away from and back to gets several); `click` is an outbound link or download.
export const visitEvents = sqliteTable(
  "visit_events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    day: text("day").notNull(),
    visitorHash: text("visitor_hash").notNull(),
    type: text("type", { enum: ["time", "click"] }).notNull(),
    path: text("path").notNull(),
    durationMs: integer("duration_ms"),
    href: text("href"),
    label: text("label"),
    at: integer("at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index("visit_events_visitor_idx").on(t.day, t.visitorHash)],
);
