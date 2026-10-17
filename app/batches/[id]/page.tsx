"use client";
import MiniStat from "@/app/components/MiniStat";
import StockRow from "@/app/components/StockRow";
import { isListingRemaining } from "@/app/lib/stages";
import { useStore } from "@/app/lib/store";
import { ArrowLeft, Plus, Trash2 } from "lucide-react"; // Import Trash2
import Link from "next/link";
import { useParams, useRouter } from "next/navigation"; // Import useRouter

export default function BatchDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter(); // Initialize router
  const batches = useStore((s) => s.batches);
  const stock = useStore((s) => s.stock);
  const openNewStockRow = useStore((s) => s.openNewStockRow);
  const deleteBatch = useStore((s) => s.deleteBatch); // Get delete function

  const batch = batches.find((b) => b.id === params.id);
  const rows = stock.filter((x) => x.batch_id === params.id);

  if (!batch) {
    return (
      <div className="text-slate-500 dark:text-slate-400">
        Batch not found.{" "}
        <Link href="/" className="underline">
          Back
        </Link>
      </div>
    );
  }

  const done = rows.filter((s) => s.completed_at).length;
  const rem = rows.filter(isListingRemaining).length;
  const blocked = rows.filter((s) => s.blocked).length;
  const pct = rows.length ? Math.round((done / rows.length) * 100) : 0;

  const handleDeleteBatch = () => {
    if (
      window.confirm(
        `Are you sure you want to delete "${batch.name}"? This will permanently delete all ${rows.length} products inside it.`,
      )
    ) {
      deleteBatch(batch.id);
      router.push("/");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          aria-label="Back to dashboard"
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400
                     hover:text-slate-900 hover:bg-slate-100
                     dark:hover:text-slate-100 dark:hover:bg-slate-800
                     transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          {batch.name}
        </h1>

        {/* Delete Batch Button */}
        <button
          onClick={handleDeleteBatch}
          className=" text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-950/40 rounded-md transition-colors ml-2"
          title="Delete Batch"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <button
          onClick={() => openNewStockRow(batch.id)}
          className="ml-auto inline-flex items-center gap-1.5 text-sm font-medium bg-slate-900 text-white px-3 py-1.5 rounded-lg
                     hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white
                     transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <MiniStat label="Items" value={rows.length} color="slate" />
        <MiniStat label="Listings Remaining" value={rem} color="blue" />
        <MiniStat
          label="Blocked"
          value={blocked}
          color={blocked ? "red" : "slate"}
        />
        <MiniStat label="Progress" value={`${pct}%`} color="green" />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Item</th>
              <th className="text-left px-4 py-2 font-medium">Qty</th>
              <th className="text-left px-4 py-2 font-medium">Stage</th>
              <th className="text-left px-4 py-2 font-medium">Marketplaces</th>
              <th className="text-right px-4 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map((s) => (
              <StockRow key={s.id} stock={s} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
