"use client";

const STAT_ROWS = 6;
const TABLE_ROWS = 6;

export default function DashboardSkeleton() {
  return (
    <div
      className="space-y-6 animate-pulse"
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Loading dashboard…</span>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: STAT_ROWS }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4"
          >
            <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="mt-3 h-8 w-16 rounded bg-slate-200 dark:bg-slate-800" />
          </div>
        ))}
      </div>

      {/* Tabs row */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <div className="-mb-px h-9 w-28 rounded-t bg-slate-200 dark:bg-slate-800" />
        <div className="-mb-px h-9 w-24 rounded-t bg-slate-200 dark:bg-slate-800" />
        <div className="ml-auto mb-2 h-8 w-28 rounded-lg bg-slate-200 dark:bg-slate-800" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800 px-4 py-2">
          <div className="h-3 flex-1 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-3 w-12 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-3 w-32 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-3 w-10 rounded bg-slate-200 dark:bg-slate-700" />
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {Array.from({ length: TABLE_ROWS }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-40 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-2.5 w-24 rounded bg-slate-100 dark:bg-slate-800/60" />
              </div>
              <div className="h-3.5 w-20 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-3.5 w-8 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-5 w-16 rounded-full bg-slate-200 dark:bg-slate-800" />
              <div className="flex gap-1.5">
                <div className="h-5 w-12 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-5 w-12 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-5 w-12 rounded bg-slate-200 dark:bg-slate-800" />
              </div>
              <div className="h-3.5 w-10 rounded bg-slate-200 dark:bg-slate-800" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
