import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

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
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  videoUrl: text("video_url"),
  url: text("url"),
  githubUrl: text("github_url"),
  workedOn: text("worked_on"),
  featured: integer("featured", { mode: "boolean" }).default(false),
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
  imageUrl: text("image_url"),
  tags: text("tags"),
  published: integer("published", { mode: "boolean" }).default(false),
  publishedAt: integer("published_at", { mode: "timestamp" }),
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
  sortOrder: integer("sort_order").default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const sites = sqliteTable("sites", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  url: text("url").notNull(),
  tags: text("tags"),
  description: text("description"),
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

export const publications = sqliteTable("publications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),
  venue: text("venue"),
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

export const gallery = sqliteTable("gallery", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  imageUrl: text("image_url").notNull(),
  width: integer("width"),
  height: integer("height"),
  takenAt: text("taken_at"),
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
