"use client";

import { PLATFORMS } from "../lib/constants";
import { useStore } from "../lib/store";
import { MpStatus, Stock } from "../lib/types";

const STATUS_OPTIONS: MpStatus[] = [
  "not_started",
  "in_progress",
  "live",
  "blocked",
  "error",
];

export default function MarketplaceGrid({ stock }: { stock: Stock }) {
  const setMarketplace = useStore((s) => s.setMarketplace);

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
      {/* Header row */}
      <div className="hidden md:grid grid-cols-[24px_120px_1fr_120px_140px] items-center gap-3 px-3 py-2 bg-slate-50 dark:bg-slate-800/60 text-[10px] uppercase tracking-wide font-semibold text-slate-500 dark:text-slate-400">
        <span />
        <span>Platform</span>
        <span>Price · Status · Reason</span>
        <span>ID</span>
        <span>Status</span>
      </div>

      {PLATFORMS.map((p) => {
        const m = stock.marketplaces.find((x) => x.platform === p.key)!;
        const required = m.required === 1;

        return (
          <div
            key={p.key}
            className={`grid grid-cols-1 md:grid-cols-[24px_120px_1fr_120px_140px] md:items-center gap-3 px-3 py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-b-0 ${
              required ? "" : "bg-slate-50 dark:bg-slate-900/40"
            }`}
          >
            <input
              type="checkbox"
              checked={required}
              onChange={(e) =>
                setMarketplace(stock.id, p.key, {
                  required: e.target.checked ? 1 : 0,
                  status: e.target.checked ? "not_started" : "not_required",
                })
              }
              className="rounded"
            />

            <span
              className={`text-sm font-medium ${
                required
                  ? "text-slate-900 dark:text-slate-100"
                  : "text-slate-400 dark:text-slate-500"
              }`}
            >
              {p.label}
            </span>

            <div className="flex items-center gap-2 min-w-0">
              <span className="text-slate-400 dark:text-slate-500 text-sm shrink-0">
                £
              </span>
              <input
                type="number"
                step="0.01"
                placeholder="price"
                value={m.price ?? ""}
                disabled={!required}
                onChange={(e) => {
                  const v =
                    e.target.value === "" ? null : parseFloat(e.target.value);
                  const patch: Partial<typeof m> = { price: v };
                  if (v !== null) {
                    patch.required = 1;
                    if (m.status === "not_required")
                      patch.status = "not_started";
                  }
                  setMarketplace(stock.id, p.key, patch);
                }}
                className="w-24 text-sm border border-slate-200 dark:border-slate-700 rounded px-2 py-1
                           bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100
                           disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400
                           focus:outline-none focus:border-slate-900 dark:focus:border-slate-400"
              />
              {m.status === "blocked" && m.blocked_reason && (
                <span className="text-xs text-red-600 dark:text-red-400 truncate">
                  {m.blocked_reason}
                </span>
              )}
            </div>

            <input
              type="text"
              placeholder="Listing ID"
              value={m.listing_id ?? ""}
              disabled={!required}
              onChange={(e) =>
                setMarketplace(stock.id, p.key, {
                  listing_id: e.target.value.trim() || null,
                })
              }
              className="w-full text-sm font-mono border border-slate-200 dark:border-slate-700 rounded px-2 py-1
                         bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100
                         placeholder:font-sans placeholder:text-slate-400 dark:placeholder:text-slate-500
                         disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400
                         focus:outline-none focus:border-slate-900 dark:focus:border-slate-400"
            />

            <select
              value={m.status}
              disabled={!required}
              onChange={(e) => {
                const status = e.target.value as MpStatus;
                let blocked_reason: string | null = null;
                if (status === "blocked") {
                  blocked_reason =
                    prompt("Blocked reason for this marketplace?") || "Blocked";
                }
                setMarketplace(stock.id, p.key, { status, blocked_reason });
              }}
              className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded px-2 py-1
                         bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100
                         disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400
                         focus:outline-none focus:border-slate-900 dark:focus:border-slate-400"
            >
              {STATUS_OPTIONS.map((so) => (
                <option key={so} value={so}>
                  {so.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
        );
      })}
    </div>
  );
}
