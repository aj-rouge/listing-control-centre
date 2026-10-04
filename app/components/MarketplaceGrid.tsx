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
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      {PLATFORMS.map((p) => {
        const m = stock.marketplaces.find((x) => x.platform === p.key)!;
        const required = m.required === 1;

        return (
          <div
            key={p.key}
            className={`flex items-center gap-3 px-3 py-2 border-b border-slate-100 last:border-b-0 ${
              required ? "" : "bg-neutral-900/50"
            }`}
          >
            <label className="flex items-center gap-2 cursor-pointer">
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
                className={`text-sm font-medium w-28 ${
                  required ? "text-white" : "text-slate-400"
                }`}
              >
                {p.label}
              </span>
            </label>

            <input
              type="number"
              step="0.01"
              placeholder="price"
              value={m.price ?? ""}
              onChange={(e) => {
                const v =
                  e.target.value === "" ? null : parseFloat(e.target.value);
                const patch: Partial<typeof m> = { price: v };
                if (v !== null) {
                  patch.required = 1;
                  if (m.status === "not_required") patch.status = "not_started";
                }
                setMarketplace(stock.id, p.key, patch);
              }}
              className="w-24 text-sm border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-slate-900"
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
              className="flex-1 text-sm border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-slate-900 disabled:bg-slate-100 disabled:text-slate-400"
            >
              {STATUS_OPTIONS.map((so) => (
                <option key={so} value={so}>
                  {so.replace("_", " ")}
                </option>
              ))}
            </select>

            {m.status === "blocked" && m.blocked_reason && (
              <span className="text-xs text-red-600 truncate max-w-[140px]">
                {m.blocked_reason}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
