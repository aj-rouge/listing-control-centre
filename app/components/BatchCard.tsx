"use client";
import Link from "next/link";
import { useStore } from "../lib/store";
import { isListingRemaining } from "../lib/stages";

export default function BatchCard({ batchId }: { batchId: string }) {
  // select stable references
  const batches = useStore((s) => s.batches);
  const stock = useStore((s) => s.stock);

  // derive in render — pure, no new refs stored in the store subscription
  const batch = batches.find((b) => b.id === batchId);
  if (!batch) return null;

  const rows = stock.filter((x) => x.batch_id === batchId);
  const total = rows.length;
  const done = rows.filter((s) => s.completed_at).length;
  const blocked = rows.filter((s) => s.blocked).length;
  const rem = rows.filter(isListingRemaining).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <Link
      href={`/batches/${batch.id}`}
      className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4
                 hover:border-slate-400 dark:hover:border-slate-600 transition block"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="font-semibold text-slate-900 dark:text-slate-100">
            {batch.name}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {new Date(batch.batch_date).toLocaleDateString("en-GB")}
          </div>
        </div>
        {blocked > 0 && (
          <div className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded">
            {blocked} blocked
          </div>
        )}
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
          <span>
            {done} of {total} done · {rem} remaining
          </span>
          <span>{pct}%</span>
        </div>
        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 dark:bg-green-400 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </Link>
  );
}
