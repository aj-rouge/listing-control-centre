"use client";

import { useState } from "react";
import StagePill from "./StagePill";
import MarketplaceGrid from "./MarketplaceGrid";
import { useStore } from "../lib/store";
import { nextAction, stage, stageIndex } from "../lib/stages";
import { PLATFORMS, STAGE_LABEL, STAGES } from "../lib/constants";
import type { Priority, Stock } from "../lib/types";
import { Trash2 } from "lucide-react";
type RevertField = "arrived_at" | "checked_at" | "listed_at" | "completed_at";

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
function HistoryEntry({
  ts,
  label,
  onRevert,
}: {
  ts: number;
  label: string;
  onRevert?: () => void;
}) {
  return (
    <div className="flex items-start gap-2">
      <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 mt-1.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="text-slate-900 dark:text-slate-50">{label}</div>
          {onRevert && (
            <button
              onClick={onRevert}
              className="text-[11px] text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors shrink-0"
              title="Undo this step and everything after it"
            >
              ↺ Undo
            </button>
          )}
        </div>
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
  const updateStockDetails = useStore((s) => s.updateStockDetails);
  const deleteStock = useStore((s) => s.deleteStock);
  const revertTimestamp = useStore((s) => s.revertTimestamp);

  const [isBlocking, setIsBlocking] = useState(false);
  const [blockReason, setBlockReason] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Stock>>({});

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

  const startEditing = () => {
    setEditForm({ ...stock });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditForm({});
  };

  const saveEditing = async () => {
    if (!stock) return;

    // Clean up empty numbers
    const patch = { ...editForm };
    if (patch.vat_percent === undefined || (patch.vat_percent as any) === "") {
      patch.vat_percent = null;
    }

    await updateStockDetails(stock.id, patch);
    setIsEditing(false);
  };

  const handleChange = (field: keyof Stock, value: any) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };
  const handleDelete = () => {
    if (
      window.confirm(
        `Are you sure you want to delete "${stock.item}"? This cannot be undone.`,
      )
    ) {
      deleteStock(stock.id);
    }
  };

  const confirmRevert = (field: RevertField, label: string) => {
    if (window.confirm(`Undo "${label}"?`)) {
      revertTimestamp(stock.id, field);
    }
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
              {isEditing ? editForm.item || "Editing..." : stock.item}
            </h2>
            <div className="mt-2 flex items-center gap-3">
              <StagePill stage={st} blockedReason={stock.blocked_reason} />
              {stock.pf_number && !isEditing && (
                <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded">
                  {stock.pf_number}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {!isEditing && (
              <button
                onClick={startEditing}
                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                Edit
              </button>
            )}
            <button
              onClick={closeRow}
              className="text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 text-2xl leading-none transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {isEditing ? (
            <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Edit Product Information
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                    Item Name
                  </label>
                  <input
                    type="text"
                    value={editForm.item || ""}
                    onChange={(e) => handleChange("item", e.target.value)}
                    className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-md px-3 py-1.5 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                    P/F Number
                  </label>
                  <input
                    type="text"
                    value={editForm.pf_number || ""}
                    onChange={(e) =>
                      handleChange("pf_number", e.target.value || null)
                    }
                    className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-md px-3 py-1.5 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                    Qty
                  </label>
                  <input
                    type="number"
                    value={editForm.qty ?? ""}
                    onChange={(e) =>
                      handleChange("qty", parseInt(e.target.value) || 0)
                    }
                    className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-md px-3 py-1.5 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                    Identifier 1
                  </label>
                  <input
                    type="text"
                    value={editForm.identifier_1 || ""}
                    onChange={(e) =>
                      handleChange("identifier_1", e.target.value)
                    }
                    className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-md px-3 py-1.5 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                    Identifier 2
                  </label>
                  <input
                    type="text"
                    value={editForm.identifier_2 || ""}
                    onChange={(e) =>
                      handleChange("identifier_2", e.target.value)
                    }
                    className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-md px-3 py-1.5 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                    SKU
                  </label>
                  <input
                    type="text"
                    value={editForm.sku || ""}
                    onChange={(e) => handleChange("sku", e.target.value)}
                    className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-md px-3 py-1.5 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={editForm.location || ""}
                    onChange={(e) => handleChange("location", e.target.value)}
                    className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-md px-3 py-1.5 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                    Condition
                  </label>
                  <input
                    type="text"
                    value={editForm.condition || ""}
                    onChange={(e) => handleChange("condition", e.target.value)}
                    className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-md px-3 py-1.5 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                    VAT %
                  </label>
                  <input
                    type="number"
                    value={editForm.vat_percent ?? ""}
                    onChange={(e) =>
                      handleChange(
                        "vat_percent",
                        e.target.value === ""
                          ? null
                          : parseFloat(e.target.value),
                      )
                    }
                    className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-md px-3 py-1.5 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                    Priority
                  </label>
                  <select
                    value={editForm.priority || "normal"}
                    onChange={(e) =>
                      handleChange("priority", e.target.value as Priority)
                    }
                    className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-md px-3 py-1.5 bg-white dark:bg-slate-900"
                  >
                    <option value="urgent">Urgent</option>
                    <option value="normal">Normal</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={editForm.notes || ""}
                    onChange={(e) => handleChange("notes", e.target.value)}
                    rows={3}
                    className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-md px-3 py-1.5 bg-white dark:bg-slate-900 resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={saveEditing}
                  className="flex-1 bg-slate-900 text-white rounded-lg py-2 text-sm font-medium hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition-colors"
                >
                  Save Changes
                </button>
                <button
                  onClick={cancelEditing}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
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
              <div className="space-y-2">
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

                {!stock.arrived_at &&
                  !stock.blocked &&
                  act?.key !== "markArrived" && (
                    <button
                      onClick={() => markArrived(stock.id)}
                      className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 12l5 5L20 7" />
                      </svg>
                      Mark as Arrived
                    </button>
                  )}
              </div>
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
                    <HistoryEntry
                      ts={stock.arrived_at}
                      label="Marked arrived"
                      onRevert={() =>
                        confirmRevert("arrived_at", "Marked arrived")
                      }
                    />
                  )}
                  {stock.checked_at && (
                    <HistoryEntry
                      ts={stock.checked_at}
                      label="Marked checked / counted"
                      onRevert={() =>
                        confirmRevert("checked_at", "Marked checked")
                      }
                    />
                  )}
                  {stock.listed_at && (
                    <HistoryEntry
                      ts={stock.listed_at}
                      label="BaseLinker product created"
                      onRevert={() =>
                        confirmRevert("listed_at", "BaseLinker product created")
                      }
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
                      onRevert={() =>
                        confirmRevert("completed_at", "Fully complete")
                      }
                    />
                  )}
                </div>
              </div>{" "}
              <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center justify-center gap-2 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/40 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Product
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
