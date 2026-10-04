"use client";
import StagePill from "./StagePill";
import MarketplaceChips from "./MarketplaceChips";
import { nextAction, stage } from "../lib/stages";
import { useStore } from "../lib/store";
import { Stock } from "../lib/types";

export default function StockRow({ stock }: { stock: Stock }) {
  const openRow = useStore((s) => s.openRow);
  const act = nextAction(stock);
  const st = stage(stock);

  return (
    <tr
      onClick={() => openRow(stock.id)}
      className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
    >
      <td className="px-4 py-3">
        <div className="font-medium text-slate-900 dark:text-slate-100">
          {stock.item}
        </div>
        {stock.pf_number && (
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            P/F{" "}
            <span className="font-mono font-semibold">{stock.pf_number}</span>
          </div>
        )}
        {stock.notes && (
          <div className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-xs mt-0.5">
            {stock.notes}
          </div>
        )}
      </td>
      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
        {stock.qty}
      </td>
      <td className="px-4 py-3">
        <StagePill stage={st} blockedReason={stock.blocked_reason} />
      </td>
      <td className="px-4 py-3">
        <MarketplaceChips stock={stock} />
      </td>
      <td className="px-4 py-3 text-right">
        {act?.key && (
          <span className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors">
            {act.label} →
          </span>
        )}
      </td>
    </tr>
  );
}
