import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { QuickAdd } from "@/components/QuickAdd";

async function Gate() {
  const session = await auth();
  if (!session?.user) return null;
  return <QuickAdd />;
}

export function QuickAddGate() {
  return (
    <Suspense fallback={null}>
      <Gate />
    </Suspense>
  );
}
