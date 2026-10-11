"use client";
import { Suspense } from "react";
import DashboardContent from "./components/DashboardContent";

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="text-sm text-slate-500 dark:text-slate-400">
          Loading…
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
