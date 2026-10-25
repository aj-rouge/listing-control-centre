"use client";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import StockRow from "./StockRow";
import EmptyState from "./EmptyState";
import { useStore } from "../lib/store";
import { PLATFORMS } from "../lib/constants";
import { PlatformKey, Priority, Stock } from "../lib/types";
import { stage } from "../lib/stages";

const DAY = 86_400_000;
const PAGE_SIZES = [25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 50;

type SortKey =
  | "newest"
  | "oldest"
  | "item-asc"
  | "qty-desc"
  | "qty-asc"
  | "price-desc"
  | "price-asc";

type StageFilter = "all" | "remaining" | "in_progress" | "live" | "blocked";
type PriorityFilter = "all" | Priority;

const AGE_OPTIONS: { key: AgeFilter; label: string; days: number | null }[] = [
  { key: "any", label: "Any age", days: null },
  { key: "7", label: "Last 7 days", days: 7 },
  { key: "30", label: "Last 30 days", days: 30 },
  { key: "90", label: "Last 90 days", days: 90 },
];
type AgeFilter = "any" | "7" | "30" | "90";

export default function ProductsView() {
  const stock = useStore((s) => s.stock);
  const batches = useStore((s) => s.batches);

  // ── Filters (unchanged) ────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState<PlatformKey | "all">("all");
  const [platformRemainingOnly, setPlatformRemainingOnly] = useState(false);
  const [stageFilter, setStageFilter] = useState<StageFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minQty, setMinQty] = useState("");
  const [maxQty, setMaxQty] = useState("");
  const [age, setAge] = useState<AgeFilter>("any");
  const [sort, setSort] = useState<SortKey>("newest");

  // ── Pagination ─────────────────────────────────────────────────
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);

  const batchNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const b of batches) m.set(b.id, b.name);
    return m;
  }, [batches]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const minP = minPrice.trim() === "" ? null : parseFloat(minPrice);
    const maxP = maxPrice.trim() === "" ? null : parseFloat(maxPrice);
    const minQ = minQty.trim() === "" ? null : parseInt(minQty, 10);
    const maxQ = maxQty.trim() === "" ? null : parseInt(maxQty, 10);
    const ageDays =
      age === "any"
        ? null
        : (AGE_OPTIONS.find((o) => o.key === age)?.days ?? null);
    const ageCutoff = ageDays ? Date.now() - ageDays * DAY : null;

    let rows = stock.filter((s) => {
      if (q) {
        const hay = [
          s.item,
          s.sku,
          s.identifier_1,
          s.identifier_2,
          s.pf_number ?? "",
          s.notes,
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (platform !== "all") {
        const m = s.marketplaces.find((x) => x.platform === platform);
        if (!m || m.required !== 1) return false;
        if (platformRemainingOnly && m.status === "live") return false;
      }
      if (stageFilter !== "all") {
        const st = stage(s);
        if (stageFilter === "remaining") {
          if (s.completed_at) return false;
        } else if (stageFilter === "in_progress") {
          if (st !== "listed" && st !== "published" && st !== "checked")
            return false;
        } else if (stageFilter === "live") {
          if (st !== "published" && st !== "done") return false;
        } else if (stageFilter === "blocked") {
          if (!s.blocked) return false;
        }
      }
      if (priorityFilter !== "all" && s.priority !== priorityFilter) {
        return false;
      }
      if (minP !== null || maxP !== null) {
        const prices = s.marketplaces
          .filter((m) => m.required === 1 && m.price !== null)
          .map((m) => m.price as number);
        if (!prices.length) return false;
        const within = prices.some(
          (p) => (minP === null || p >= minP) && (maxP === null || p <= maxP),
        );
        if (!within) return false;
      }
      if (minQ !== null && s.qty < minQ) return false;
      if (maxQ !== null && s.qty > maxQ) return false;
      if (ageCutoff !== null && s.recorded_at < ageCutoff) return false;
      return true;
    });

    rows = rows.sort((a, b) => {
      switch (sort) {
        case "newest":
          return b.recorded_at - a.recorded_at;
        case "oldest":
          return a.recorded_at - b.recorded_at;
        case "item-asc":
          return a.item.localeCompare(b.item);
        case "qty-desc":
          return b.qty - a.qty;
        case "qty-asc":
          return a.qty - b.qty;
        case "price-desc":
          return maxPriceOf(b) - maxPriceOf(a);
        case "price-asc":
          return maxPriceOf(a) - maxPriceOf(b);
      }
    });

    return rows;
  }, [
    stock,
    search,
    platform,
    platformRemainingOnly,
    stageFilter,
    priorityFilter,
    minPrice,
    maxPrice,
    minQty,
    maxQty,
    age,
    sort,
  ]);

  // Reset to page 1 whenever any filter/sort changes
  useEffect(() => {
    setPage(0);
  }, [
    search,
    platform,
    platformRemainingOnly,
    stageFilter,
    priorityFilter,
    minPrice,
    maxPrice,
    minQty,
    maxQty,
    age,
    sort,
  ]);

  // Pagination derivations
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const startIdx = safePage * pageSize;
  const endIdx = Math.min(startIdx + pageSize, filtered.length);
  const pageRows = filtered.slice(startIdx, endIdx);

  // Clamp on data shrink (e.g. deletes) — no infinite loop because
  // the second render sees page === safePage
  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const resetFilters = () => {
    setSearch("");
    setPlatform("all");
    setPlatformRemainingOnly(false);
    setStageFilter("all");
    setPriorityFilter("all");
    setMinPrice("");
    setMaxPrice("");
    setMinQty("");
    setMaxQty("");
    setAge("any");
  };

  const hasActiveFilters =
    search.trim() !== "" ||
    platform !== "all" ||
    platformRemainingOnly ||
    stageFilter !== "all" ||
    priorityFilter !== "all" ||
    minPrice.trim() !== "" ||
    maxPrice.trim() !== "" ||
    minQty.trim() !== "" ||
    maxQty.trim() !== "" ||
    age !== "any";

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <FilterLabel>Search</FilterLabel>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Item, SKU, identifier, P/F, notes…"
              className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5
                         bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100
                         placeholder:text-slate-400 dark:placeholder:text-slate-500
                         focus:outline-none focus:border-slate-900 dark:focus:border-slate-400"
            />
          </div>

          <div>
            <FilterLabel>Platform</FilterLabel>
            <select
              value={platform}
              onChange={(e) =>
                setPlatform(e.target.value as PlatformKey | "all")
              }
              className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5
                         bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100
                         focus:outline-none focus:border-slate-900 dark:focus:border-slate-400"
            >
              <option value="all">All platforms</option>
              {PLATFORMS.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <FilterLabel>Stage</FilterLabel>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value as StageFilter)}
              className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5
                         bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100
                         focus:outline-none focus:border-slate-900 dark:focus:border-slate-400"
            >
              <option value="all">All stages</option>
              <option value="remaining">Listings remaining</option>
              <option value="in_progress">In progress</option>
              <option value="live">Published / done</option>
              <option value="blocked">Blocked only</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <FilterLabel>Price min (£)</FilterLabel>
            <input
              type="number"
              step="0.01"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="0"
              className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5
                         bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100
                         placeholder:text-slate-400 dark:placeholder:text-slate-500
                         focus:outline-none focus:border-slate-900 dark:focus:border-slate-400"
            />
          </div>
          <div>
            <FilterLabel>Price max (£)</FilterLabel>
            <input
              type="number"
              step="0.01"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="Any"
              className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5
                         bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100
                         placeholder:text-slate-400 dark:placeholder:text-slate-500
                         focus:outline-none focus:border-slate-900 dark:focus:border-slate-400"
            />
          </div>
          <div>
            <FilterLabel>Qty min</FilterLabel>
            <input
              type="number"
              value={minQty}
              onChange={(e) => setMinQty(e.target.value)}
              placeholder="0"
              className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5
                         bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100
                         placeholder:text-slate-400 dark:placeholder:text-slate-500
                         focus:outline-none focus:border-slate-900 dark:focus:border-slate-400"
            />
          </div>
          <div>
            <FilterLabel>Qty max</FilterLabel>
            <input
              type="number"
              value={maxQty}
              onChange={(e) => setMaxQty(e.target.value)}
              placeholder="Any"
              className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5
                         bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100
                         placeholder:text-slate-400 dark:placeholder:text-slate-500
                         focus:outline-none focus:border-slate-900 dark:focus:border-slate-400"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <div className="w-44">
            <select
              value={age}
              onChange={(e) => setAge(e.target.value as AgeFilter)}
              className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5
                         bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100
                         focus:outline-none focus:border-slate-900 dark:focus:border-slate-400"
            >
              {AGE_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="w-44">
            <select
              value={priorityFilter}
              onChange={(e) =>
                setPriorityFilter(e.target.value as PriorityFilter)
              }
              className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5
                         bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100
                         focus:outline-none focus:border-slate-900 dark:focus:border-slate-400"
            >
              <option value="all">Any priority</option>
              <option value="urgent">Urgent only</option>
              <option value="normal">Normal only</option>
              <option value="low">Low only</option>
            </select>
          </div>

          {platform !== "all" && (
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={platformRemainingOnly}
                onChange={(e) => setPlatformRemainingOnly(e.target.checked)}
                className="rounded"
              />
              Only still remaining on{" "}
              {PLATFORMS.find((p) => p.key === platform)?.label}
            </label>
          )}

          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {filtered.length} of {stock.length}
              {filtered.length > 0 && (
                <>
                  {" · "}
                  page {safePage + 1}/{totalPages}
                </>
              )}
            </span>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100
                         px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Clear filters
              </button>
            )}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Sort
              </span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5
                         bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100
                         focus:outline-none focus:border-slate-900 dark:focus:border-slate-400"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="item-asc">Item A → Z</option>
                <option value="qty-desc">Qty high → low</option>
                <option value="qty-asc">Qty low → high</option>
                <option value="price-desc">Price high → low</option>
                <option value="price-asc">Price low → high</option>
              </select>{" "}
            </div>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState label="No products match these filters." />
      ) : (
        // ── Table card — no overflow-hidden on the card so the
        //    footer can be sticky relative to the viewport ────────
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          {/* Table wrapper clips the top rounded corners */}
          <div className="overflow-hidden rounded-t-lg">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Item</th>
                  <th className="text-left px-4 py-2 font-medium">Batch</th>
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
                  <StockRow
                    key={s.id}
                    stock={s}
                    batchName={batchNameById.get(s.batch_id) ?? "—"}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Sticky pagination footer — pinned to viewport bottom while
              the card is on screen, settles at natural position when
              you scroll past the end of the table */}
          <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-b-lg border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-sm">
            <div className="text-slate-500 dark:text-slate-400">
              Showing{" "}
              <strong className="text-slate-700 dark:text-slate-200">
                {filtered.length === 0 ? 0 : startIdx + 1} - {endIdx}
              </strong>{" "}
              of{" "}
              <strong className="text-slate-700 dark:text-slate-200">
                {filtered.length}
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
                  onClick={() =>
                    setPage((p) => Math.min(totalPages - 1, p + 1))
                  }
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
      )}
    </div>
  );
}

function FilterLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
      {children}
    </label>
  );
}

function maxPriceOf(s: Stock): number {
  let max = 0;
  for (const m of s.marketplaces) {
    if (m.required === 1 && m.price !== null && m.price > max) max = m.price;
  }
  return max;
}
