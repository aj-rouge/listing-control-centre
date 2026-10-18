"use client";
import StatCard from "./StatCard";
import {
  isListingRemaining,
  isReplenishmentRemaining,
  stage,
} from "../lib/stages";
import { useStore } from "../lib/store";

const DAY = 86_400_000;

export default function DashboardStats() {
  const stock = useStore((s) => s.stock);

  // Incoming = not yet arrived, regardless of whether it's a replenishment
  const incomingRows = stock.filter((s) => !s.completed_at && !s.arrived_at);
  const incomingUnits = incomingRows.reduce((sum, s) => sum + s.qty, 0);

  const listingsRemaining = stock.filter(isListingRemaining).length;
  const totalListings = stock.length;

  // Total required marketplaces that aren't live yet, on items not completed.
  const platformsLeft = new Set(
    stock
      .filter((s) => !s.completed_at)
      .flatMap((s) => s.marketplaces)
      .filter((m) => m.required && m.status !== "live")
      .map((m) => m.platform),
  ).size;

  const blocked = stock.filter((s) => s.blocked).length;
  const done30d = stock.filter(
    (s) => s.completed_at && s.completed_at > Date.now() - 30 * DAY,
  ).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <IncomingStockCard rows={incomingRows.length} units={incomingUnits} />
      <StatCard
        label="Listings Remaining"
        value={listingsRemaining}
        color="blue"
      />
      <StatCard label="Listings" value={totalListings} color="blue" />
      <StatCard label="Platforms Left" value={platformsLeft} color="amber" />
      <StatCard label="Blocked" value={blocked} color="red" />
      <StatCard label="Fully Completed (30d)" value={done30d} color="green" />
    </div>
  );
}

function IncomingStockCard({ rows, units }: { rows: number; units: number }) {
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 transition-colors">
      <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
        Incoming Stock
      </div>
      <div className="mt-2 flex items-baseline gap-2 flex-wrap">
        <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
          {rows}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {rows === 1 ? "row" : "rows"} · {units.toLocaleString()} units
        </div>
      </div>
    </div>
  );
}
