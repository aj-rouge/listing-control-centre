"use client";
import { useMemo, useState } from "react";
import StockRow from "./StockRow";
import EmptyState from "./EmptyState";
import { useStore } from "../lib/store";
import { PLATFORMS } from "../lib/constants";
import { PlatformKey, Stock } from "../lib/types";
import { stage } from "../lib/stages";

const DAY = 86_400_000;

type SortKey =
  | "newest"
  | "oldest"
  | "item-asc"
  | "qty-desc"
  | "qty-asc"
  | "price-desc"
  | "price-asc";

type StageFilter = "all" | "remaining" | "in_progress" | "live" | "blocked";

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

  // Filters
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState<PlatformKey | "all">("all");
  const [platformRemainingOnly, setPlatformRemainingOnly] = useState(false);
  const [stageFilter, setStageFilter] = useState<StageFilter>("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minQty, setMinQty] = useState("");
  const [maxQty, setMaxQty] = useState("");
  const [age, setAge] = useState<AgeFilter>("any");
  const [sort, setSort] = useState<SortKey>("newest");

  // Batch name lookup for the table column
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
      // Text search
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

      // Platform
      if (platform !== "all") {
        const m = s.marketplaces.find((x) => x.platform === platform);
        if (!m || m.required !== 1) return false;
        if (platformRemainingOnly && m.status === "live") return false;
      }

      // Stage
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

      // Price range (any required marketplace price falls inside the range)
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

      // Quantity range
      if (minQ !== null && s.qty < minQ) return false;
      if (maxQ !== null && s.qty > maxQ) return false;

      // Age
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
    minPrice,
    maxPrice,
    minQty,
    maxQty,
    age,
    sort,
  ]);

  const resetFilters = () => {
    setSearch("");
    setPlatform("all");
    setPlatformRemainingOnly(false);
    setStageFilter("all");
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
              </select>
            </div>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState label="No products match these filters." />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
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
              {filtered.map((s) => (
                <StockRow
                  key={s.id}
                  stock={s}
                  batchName={batchNameById.get(s.batch_id) ?? "—"}
                />
              ))}
            </tbody>
          </table>
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

/** Highest price across required marketplaces; 0 when none. */
function maxPriceOf(s: Stock): number {
  let max = 0;
  for (const m of s.marketplaces) {
    if (m.required === 1 && m.price !== null && m.price > max) max = m.price;
  }
  return max;
}
