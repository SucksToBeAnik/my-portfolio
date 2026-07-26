import { asc } from "drizzle-orm";
import { Breadcrumb } from "@/components/Breadcrumb";
import { GalleryDisplay } from "@/components/GalleryDisplay";
import { db } from "@/db";
import { gallery } from "@/db/schema";

export const metadata = {
  title: "Photos",
  description: "Photographs — moments worth keeping.",
  alternates: { canonical: "/photos" },
  openGraph: {
    title: "Photos",
    description: "Photographs — moments worth keeping.",
    url: "/photos",
  },
  twitter: {
    title: "Photos",
    description: "Photographs — moments worth keeping.",
  },
};

export const revalidate = 3600;

export default async function PhotosPage() {
  const items = await db
    .select({
      id: gallery.id,
      title: gallery.title,
      imageUrl: gallery.imageUrl,
      takenAt: gallery.takenAt,
    })
    .from(gallery)
    .orderBy(asc(gallery.sortOrder));

  return (
    <div className="space-y-8">
      <div className="mb-8 md:mb-12">
        <Breadcrumb crumbs={[{ label: "Photos" }]} />
      </div>

      <GalleryDisplay items={items} />
    </div>
  );
}
