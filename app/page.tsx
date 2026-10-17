"use client";
import { Suspense, useEffect, useState } from "react";
import DashboardContent from "./components/DashboardContent";
import DashboardSkeleton from "./components/DashboardSkeleton";

// ← set to 0 to disable the demo delay
const SKELETON_DELAY_MS = 0;

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DelayedDashboard />
    </Suspense>
  );
}

function DelayedDashboard() {
  const [ready, setReady] = useState(SKELETON_DELAY_MS <= 0);

  useEffect(() => {
    if (ready) return;
    const t = setTimeout(() => setReady(true), SKELETON_DELAY_MS);
    return () => clearTimeout(t);
  }, [ready]);

  if (!ready) return <DashboardSkeleton />;
  return <DashboardContent />;
}
