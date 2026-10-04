"use client";
import BatchCard from "./components/BatchCard";
import StatCard from "./components/StatCard";
import {
  isListingRemaining,
  isReplenishmentRemaining,
  stage,
} from "./lib/stages";
import { useStore } from "./lib/store";

const DAY = 86_400_000;

export default function DashboardPage() {
  const stock = useStore((s) => s.stock);
  const batches = useStore((s) => s.batches);
  const openNewBatch = useStore((s) => s.openNewBatch);

  const listingsRemaining = stock.filter(isListingRemaining).length;
  const replenishRemaining = stock.filter(isReplenishmentRemaining).length;
  const blocked = stock.filter((s) => s.blocked).length;
  const done30d = stock.filter(
    (s) => s.completed_at && s.completed_at > Date.now() - 30 * DAY,
  ).length;
  const inProgress = stock.filter((s) => {
    const st = stage(s);
    return st !== "done" && st !== "incoming" && st !== "blocked";
  }).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatCard
          label="Listings Remaining"
          value={listingsRemaining}
          color="blue"
        />
        <StatCard
          label="Replenishments Remaining"
          value={replenishRemaining}
          color="purple"
        />
        <StatCard label="In Progress" value={inProgress} color="amber" />
        <StatCard label="Blocked" value={blocked} color="red" />
        <StatCard label="Fully Completed (30d)" value={done30d} color="green" />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">
            Batches
          </h2>
          <button
            onClick={openNewBatch}
            className="text-sm font-medium bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-800
                       dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            + New Batch
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {batches.map((b) => (
            <BatchCard key={b.id} batchId={b.id} />
          ))}
        </div>
      </div>
    </div>
  );
}
