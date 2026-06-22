import { asc } from "drizzle-orm";
import { LifeContent } from "./LifeContent";
import { db } from "@/db";
import { gallery, lifeEvents } from "@/db/schema";

export const metadata = {
  title: "Life | Suckstobeanik",
  description: "Personal milestones, achievements, and travels.",
  openGraph: {
    title: "Life | Suckstobeanik",
    description: "Personal milestones, achievements, and travels.",
    url: "/life",
  },
  twitter: {
    title: "Life | Suckstobeanik",
    description: "Personal milestones, achievements, and travels.",
  },
};

export const revalidate = 3600;

export default async function LifePage() {
  const [items, galleryItems] = await Promise.all([
    db.select().from(lifeEvents).orderBy(asc(lifeEvents.sortOrder)),
    db.select().from(gallery).orderBy(asc(gallery.sortOrder)),
  ]);

  return <LifeContent items={items} galleryItems={galleryItems} />;
}
