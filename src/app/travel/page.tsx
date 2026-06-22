import { and, isNotNull } from "drizzle-orm";
import type { Metadata } from "next";
import { db } from "@/db";
import { lifeEvents } from "@/db/schema";
import { TravelMap } from "@/components/TravelMap";

export const metadata: Metadata = {
  title: "Travel | Suckstobeanik",
  description: "Interactive map of places I've lived, worked, and visited.",
  openGraph: {
    title: "Travel | Suckstobeanik",
    description: "Interactive map of places I've lived, worked, and visited.",
    url: "/travel",
  },
  twitter: {
    title: "Travel | Suckstobeanik",
    description: "Interactive map of places I've lived, worked, and visited.",
  },
};

export const revalidate = 3600;

export default async function TravelPage() {
  const all = await db
    .select({
      id: lifeEvents.id,
      title: lifeEvents.title,
      type: lifeEvents.type,
      location: lifeEvents.location,
      startDate: lifeEvents.startDate,
      endDate: lifeEvents.endDate,
      current: lifeEvents.current,
      latitude: lifeEvents.latitude,
      longitude: lifeEvents.longitude,
    })
    .from(lifeEvents)
    .where(and(isNotNull(lifeEvents.latitude), isNotNull(lifeEvents.longitude)))
    .orderBy(lifeEvents.sortOrder);

  const events = all.filter((e): e is typeof e & { latitude: number; longitude: number } =>
    e.latitude !== null && e.longitude !== null
  );

  return <TravelMap events={events} />;
}
