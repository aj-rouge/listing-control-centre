"use client";

import { useState } from "react";
import StagePill from "./StagePill";
import MarketplaceGrid from "./MarketplaceGrid";
import { useStore } from "../lib/store";
import { nextAction, stage, stageIndex } from "../lib/stages";
import { PLATFORMS, STAGE_LABEL, STAGES } from "../lib/constants";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
      <div className="text-slate-900 dark:text-slate-100 mt-0.5">
        {value || <span className="text-slate-400 dark:text-slate-500">—</span>}
      </div>
    </div>
  );
}

function HistoryEntry({ ts, label }: { ts: number; label: string }) {
  return (
    <div className="flex items-start gap-2">
      <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 mt-1.5" />
      <div className="flex-1">
        <div className="text-slate-900 dark:text-slate-50">{label}</div>
        <div className="text-xs text-slate-400 dark:text-slate-500">
          {new Date(ts).toLocaleString("en-GB")}
        </div>
      </div>
    </div>
  );
}

export default function RowDetail() {
  const openRowId = useStore((s) => s.openRowId);
  const closeRow = useStore((s) => s.closeRow);
  const markArrived = useStore((s) => s.markArrived);
  const markChecked = useStore((s) => s.markChecked);
  const markListed = useStore((s) => s.markListed);
  const markDone = useStore((s) => s.markDone);
  const blockRow = useStore((s) => s.blockRow);
  const unblockRow = useStore((s) => s.unblockRow);

  const [isBlocking, setIsBlocking] = useState(false);
  const [blockReason, setBlockReason] = useState("");

  const stock = useStore((s) => s.stock.find((x) => x.id === openRowId));
  const batch = useStore((s) =>
    s.batches.find((b) => b.id === stock?.batch_id),
  );

  if (!stock) return null;

  const st = stage(stock);
  const act = nextAction(stock);

  const onClickAction = () => {
    if (!act?.key) return;
    if (act.key === "markArrived") markArrived(stock.id);
    if (act.key === "markChecked") markChecked(stock.id);
    if (act.key === "markListed") markListed(stock.id);
    if (act.key === "markDone") markDone(stock.id);
  };

  const cancelBlock = () => {
    setIsBlocking(false);
    setBlockReason("");
  };

  const submitBlock = () => {
    const reason = blockReason.trim();
    if (!reason) return;
    blockRow(stock.id, reason);
    cancelBlock();
  };

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/30 dark:bg-black/60" onClick={closeRow} />
      <div className="w-160 max-w-full bg-white dark:bg-slate-900 shadow-2xl overflow-y-auto slide-over border-l border-slate-200 dark:border-slate-800">
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-start justify-between z-10">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {batch?.name}
            </div>
            <h2 className="text-lg font-semibold mt-0.5 text-slate-900 dark:text-slate-100">
              {stock.item}
            </h2>
            <div className="mt-2 flex items-center gap-3">
              <StagePill stage={st} blockedReason={stock.blocked_reason} />
              {stock.pf_number && (
                <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded">
                  {stock.pf_number}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={closeRow}
            className="text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 text-2xl leading-none transition-colors"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Stage timeline */}
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
              Stage
            </div>
            <div className="flex items-center gap-1">
              {STAGES.map((sg, i) => {
                const reached = stageIndex(st) >= i;
                const cur = st === sg;
                return (
                  <div key={sg} className="flex items-center gap-1 flex-1">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                        cur
                          ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                          : reached
                            ? "bg-green-500 text-white dark:bg-green-500 dark:text-white"
                            : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                      }`}
                    >
                      {reached && !cur ? "✓" : i + 1}
                    </div>
                    {i < STAGES.length - 1 && (
                      <div
                        className={`flex-1 h-0.5 ${
                          stageIndex(st) > i
                            ? "bg-green-500"
                            : "bg-slate-100 dark:bg-slate-800"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              {STAGES.map((sg) => (
                <span key={sg} className="flex-1 text-center">
                  {STAGE_LABEL[sg]}
                </span>
              ))}
            </div>
          </div>

          {/* Next action */}
          {act?.key && (
            <button
              onClick={onClickAction}
              className="w-full bg-slate-900 text-white rounded-lg py-2.5 font-medium hover:bg-slate-800
                         dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white
                         transition-colors"
            >
              {act.label}
            </button>
          )}

          {/* Block / unblock */}
          {stock.blocked ? (
            <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg p-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-red-700 dark:text-red-400">
                  Blocked
                </div>
                <div className="text-xs text-red-900 dark:text-red-200 mt-0.5">
                  {stock.blocked_reason}
                </div>
              </div>
              <button
                onClick={() => unblockRow(stock.id)}
                className="text-xs font-medium text-red-700 dark:text-red-400 hover:text-red-900 dark:hover:text-red-200 transition-colors"
              >
                Unblock
              </button>
            </div>
          ) : isBlocking ? (
            <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 p-3 space-y-2">
              <label className="block text-xs font-medium text-red-800 dark:text-red-300">
                Why is this blocked?
              </label>
              <input
                autoFocus
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitBlock();
                  if (e.key === "Escape") cancelBlock();
                }}
                placeholder="e.g. waiting for photos, Amazon approval, stock not arrived"
                className="w-full rounded-md border border-red-200 dark:border-red-900 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/40"
              />
              <div className="flex gap-2">
                <button
                  onClick={submitBlock}
                  disabled={!blockReason.trim()}
                  className="flex-1 rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Block
                </button>
                <button
                  onClick={cancelBlock}
                  className="rounded-md border border-red-200 dark:border-red-900 px-3 py-2 text-sm font-medium text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-950/60 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsBlocking(true)}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:hover:border-red-900 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="m4.9 4.9 14.2 14.2" />
              </svg>
              Mark as blocked…
            </button>
          )}

          {/* Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <Field label="Identifier 1" value={stock.identifier_1} />
            <Field label="Identifier 2" value={stock.identifier_2} />
            <Field label="SKU" value={stock.sku} />
            <Field label="Location" value={stock.location} />
            <Field label="Condition" value={stock.condition} />
            <Field label="VAT %" value={stock.vat_percent} />
            <Field label="Qty" value={stock.qty} />
            <Field label="Priority" value={stock.priority} />
          </div>

          {stock.notes && (
            <div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                Notes
              </div>
              <div className="text-sm bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 rounded-lg p-3">
                {stock.notes}
              </div>
            </div>
          )}

          {/* Marketplaces */}
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
              Marketplaces
            </div>
            <MarketplaceGrid stock={stock} />
          </div>

          {/* History */}
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
              History
            </div>
            <div className="space-y-2 text-sm">
              <HistoryEntry ts={stock.recorded_at} label="Recorded by AJ" />
              {stock.arrived_at && (
                <HistoryEntry ts={stock.arrived_at} label="Marked arrived" />
              )}
              {stock.checked_at && (
                <HistoryEntry
                  ts={stock.checked_at}
                  label="Marked checked / counted"
                />
              )}
              {stock.listed_at && (
                <HistoryEntry
                  ts={stock.listed_at}
                  label="BaseLinker product created"
                />
              )}
              {stock.marketplaces
                .filter((m) => m.published_at)
                .map((m) => (
                  <HistoryEntry
                    key={m.platform}
                    ts={m.published_at!}
                    label={`${PLATFORMS.find((p) => p.key === m.platform)!.label} live`}
                  />
                ))}
              {stock.completed_at && (
                <HistoryEntry
                  ts={stock.completed_at}
                  label="Fully complete — all required marketplaces live"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
