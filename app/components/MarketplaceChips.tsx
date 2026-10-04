import { PLATFORMS } from "../lib/constants";
import { Stock } from "../lib/types";

const CHIP = {
  live: "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400",
  blocked: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
  error: "bg-red-200 text-red-800 dark:bg-red-950/60 dark:text-red-300",
  in_progress:
    "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  not_started:
    "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  not_required:
    "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500",
} as const;

const MARK = {
  live: "✓",
  blocked: "!",
  error: "✕",
  in_progress: "○",
  not_started: "○",
  not_required: "·",
} as const;

export default function MarketplaceChips({ stock }: { stock: Stock }) {
  const req = stock.marketplaces.filter((m) => m.required);
  if (!req.length)
    return (
      <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
    );
  return (
    <div className="flex flex-wrap gap-1">
      {req.map((m) => {
        const p = PLATFORMS.find((x) => x.key === m.platform)!;
        const cls = CHIP[m.status as keyof typeof CHIP] ?? CHIP.not_required;
        const mark = MARK[m.status as keyof typeof MARK] ?? "·";
        return (
          <span
            key={m.platform}
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold ${cls}`}
          >
            {mark} {p.label}
          </span>
        );
      })}
    </div>
  );
}
