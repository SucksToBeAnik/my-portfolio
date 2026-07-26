import { Breadcrumb } from "@/components/Breadcrumb";
import { type LifeEvent, Timeline } from "@/components/Timeline";

export function LifeContent({ items }: { items: LifeEvent[] }) {
  return (
    <div className="space-y-8">
      <div className="mb-8 md:mb-12">
        <Breadcrumb crumbs={[{ label: "My Life" }]} />
      </div>

      <Timeline items={items} />
    </div>
  );
}
