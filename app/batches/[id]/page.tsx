"use client";
import MiniStat from "@/app/components/MiniStat";
import StockRow from "@/app/components/StockRow";
import { isListingRemaining } from "@/app/lib/stages";
import { useStore } from "@/app/lib/store";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const PAGE_SIZES = [25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 50;

export default function BatchDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const batches = useStore((s) => s.batches);
  const stock = useStore((s) => s.stock);
  const openNewStockRow = useStore((s) => s.openNewStockRow);
  const deleteBatch = useStore((s) => s.deleteBatch);

  const batch = batches.find((b) => b.id === params.id);
  const rows = useMemo(
    () => stock.filter((x) => x.batch_id === params.id),
    [stock, params.id],
  );

  // ── Pagination ────────────────────────────────────────────────
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [page, setPage] = useState(0);

  // Reset page when navigating between batches
  useEffect(() => {
    setPage(0);
  }, [params.id]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const startIdx = safePage * pageSize;
  const endIdx = Math.min(startIdx + pageSize, rows.length);
  const pageRows = rows.slice(startIdx, endIdx);

  // Clamp when rows shrink (deletions) or pageSize changes
  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);
  // ─────────────────────────────────────────────────────────────

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
        `Delete "${batch.name}"?\n\nThis will permanently remove ${rows.length} product${rows.length === 1 ? "" : "s"} inside it. This cannot be undone.`,
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

        <button
          onClick={handleDeleteBatch}
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 dark:border-red-900/50
             bg-red-50 dark:bg-red-950/20 px-3 py-1.5 text-sm font-medium
             text-red-600 dark:text-red-400
             hover:bg-red-100 dark:hover:bg-red-950/40
             focus:outline-none focus:ring-2 focus:ring-red-500/40
             transition-colors ml-2"
          title="Delete Batch"
        >
          <Trash2 className="w-4 h-4" />
          Delete
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

      {/* Table card — flex column, capped to viewport height */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col max-h-[calc(100vh-280px)] overflow-hidden">
        {/* Scrollable table area — sticky header, internal scroll */}
        <div className="overflow-y-auto flex-1 min-h-0">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide shadow-[0_1px_0_0_rgb(226,232,240)] dark:shadow-[0_1px_0_0_rgb(30,41,59)]">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Item</th>
                <th className="text-left px-4 py-2 font-medium">Qty</th>
                <th className="text-left px-4 py-2 font-medium">Stage</th>
                <th className="text-left px-4 py-2 font-medium">
                  Marketplaces
                </th>
                <th className="text-right px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {pageRows.map((s) => (
                <StockRow key={s.id} stock={s} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination footer — outside scroll area, always visible */}
        <div className="flex-shrink-0 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-sm flex flex-wrap items-center justify-between gap-3">
          <div className="text-slate-500 dark:text-slate-400">
            Showing{" "}
            <strong className="text-slate-700 dark:text-slate-200">
              {rows.length === 0 ? 0 : startIdx + 1} - {endIdx}
            </strong>{" "}
            of{" "}
            <strong className="text-slate-700 dark:text-slate-200">
              {rows.length}
            </strong>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              Rows per page
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(0);
                }}
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm
                     text-slate-900 focus:border-blue-500 focus:outline-none
                     focus:ring-2 focus:ring-blue-500/40
                     dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              >
                {PAGE_SIZES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={safePage === 0}
                className="inline-flex items-center justify-center w-8 h-8 rounded-md
                     text-slate-500 hover:text-slate-900 hover:bg-slate-100
                     disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent
                     dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="min-w-16 text-center text-slate-500 dark:text-slate-400">
                {safePage + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={safePage >= totalPages - 1}
                className="inline-flex items-center justify-center w-8 h-8 rounded-md
                     text-slate-500 hover:text-slate-900 hover:bg-slate-100
                     disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent
                     dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
