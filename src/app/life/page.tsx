import { asc } from "drizzle-orm";
import { db } from "@/db";
import { lifeEvents } from "@/db/schema";
import { LifeContent } from "./LifeContent";

export const metadata = {
  title: "Life",
  description: "Personal milestones, achievements, and travels.",
  openGraph: {
    title: "Life",
    description: "Personal milestones, achievements, and travels.",
    url: "/life",
  },
  twitter: {
    title: "Life",
    description: "Personal milestones, achievements, and travels.",
  },
};

export const revalidate = 3600;

export default async function LifePage() {
  const items = await db.select().from(lifeEvents).orderBy(asc(lifeEvents.sortOrder));

  return <LifeContent items={items} />;
}
