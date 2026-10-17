"use client";
import { Suspense, useEffect, useState } from "react";
import type { Batch, Stock } from "./lib/types";
import { useStore } from "./lib/store";
import DashboardContent from "./components/DashboardContent";
import DashboardSkeleton from "./components/DashboardSkeleton";

export default function DashboardHydrator({
  batches,
  stock,
}: {
  batches: Batch[];
  stock: Stock[];
}) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    useStore.setState({ batches, stock });
    setHydrated(true);
  }, [batches, stock]);

  if (!hydrated) return <DashboardSkeleton />;
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
