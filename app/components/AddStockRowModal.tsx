"use client";

import { useEffect, useState } from "react";
import { PlatformKey } from "../lib/types";
import { PLATFORMS } from "../lib/constants";
import { useStore } from "../lib/store";

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}
function isoToTs(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).getTime();
}
function tsToISO(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

interface MpInput {
  price: string;
  required: boolean;
}

const EMPTY_MP: Record<PlatformKey, MpInput> = Object.fromEntries(
  PLATFORMS.map((p) => [p.key, { price: "", required: false }]),
) as Record<PlatformKey, MpInput>;

export default function AddStockRowModal() {
  const batchId = useStore((s) => s.newStockRowForBatch);
  const closeNewStockRow = useStore((s) => s.closeNewStockRow);
  const addStock = useStore((s) => s.addStock);

  const [stockDate, setStockDate] = useState(todayISO());
  const [item, setItem] = useState("");
  const [id1, setId1] = useState("");
  const [id2, setId2] = useState("");
  const [qty, setQty] = useState("1");
  const [sku, setSku] = useState("");
  const [location, setLocation] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [counted, setCounted] = useState(false);
  const [volume, setVolume] = useState("");
  const [condition, setCondition] = useState("New");
  const [vat, setVat] = useState("20");
  const [notes, setNotes] = useState("");
  const [pf, setPf] = useState("");
  const [replenish, setReplenish] = useState(false);
  const [mp, setMp] = useState<Record<PlatformKey, MpInput>>(EMPTY_MP);
  const [error, setError] = useState<string | null>(null);

  // Reset form each open; default date to the batch date
  useEffect(() => {
    if (!batchId) return;
    const b = useStore.getState().batches.find((x) => x.id === batchId);
    setStockDate(b ? tsToISO(b.batch_date) : todayISO());
    setItem("");
    setId1("");
    setId2("");
    setQty("1");
    setSku("");
    setLocation("");
    setArrivalDate("");
    setCounted(false);
    setVolume("");
    setCondition("New");
    setVat("20");
    setNotes("");
    setPf("");
    setReplenish(false);
    setMp(EMPTY_MP);
    setError(null);
  }, [batchId]);

  // Escape to close
  useEffect(() => {
    if (!batchId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeNewStockRow();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [batchId, closeNewStockRow]);

  if (!batchId) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = item.trim();
    if (!trimmed) {
      setError("Item name is required.");
      return;
    }
    const qtyNum = Number.parseInt(qty, 10);
    if (Number.isNaN(qtyNum) || qtyNum < 0) {
      setError("Quantity must be a non-negative number.");
      return;
    }

    const mpInput: Partial<
      Record<PlatformKey, { price?: number | null; req?: 0 | 1 }>
    > = {};
    for (const p of PLATFORMS) {
      const v = mp[p.key];
      const hasPrice = v.price.trim() !== "";
      const isRequired = v.required || hasPrice;
      if (!isRequired) continue;
      mpInput[p.key] = {
        price: hasPrice ? Number.parseFloat(v.price) : null,
        req: 1,
      };
    }

    addStock({
      batch_id: batchId,
      item: trimmed,
      identifier_1: id1.trim(),
      identifier_2: id2.trim(),
      qty: qtyNum,
      sku: sku.trim(),
      location: location.trim(),
      condition: condition.trim() || "New",
      vat_percent: vat.trim() ? Number.parseFloat(vat) : null,
      volume: volume.trim() || null,
      notes: notes.trim(),
      pf_number: pf.trim() || null,
      is_replenishment: replenish ? 1 : 0,
      counted: counted ? 1 : 0,
      stock_date: isoToTs(stockDate),
      expected_arrival_at: arrivalDate ? isoToTs(arrivalDate) : null,
      mp: mpInput,
    });

    closeNewStockRow();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/40 dark:bg-black/60"
        onClick={closeNewStockRow}
      />

      <div className="relative bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-2xl my-8 slide-over border border-slate-200 dark:border-slate-800">
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              Add Stock Row
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              One item in this batch. Marketplace prices mark where it needs to
              be listed.
            </p>
          </div>
          <button
            type="button"
            onClick={closeNewStockRow}
            className="text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 text-2xl leading-none transition-colors"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-6">
          {/* Identification */}
          <section>
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
              Identification
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>
                  Item / Product <Req />
                </Label>
                <Input
                  value={item}
                  onChange={setItem}
                  autoFocus
                  placeholder='e.g. "iPhone 15 Pro 256GB Silver"'
                />
              </div>
              <div>
                <Label>Identifier 1</Label>
                <Input
                  value={id1}
                  onChange={setId1}
                  placeholder="Model #, EAN, URL…"
                />
              </div>
              <div>
                <Label>Identifier 2</Label>
                <Input
                  value={id2}
                  onChange={setId2}
                  placeholder="ASIN, model #, …"
                />
              </div>
              <div>
                <Label>SKU</Label>
                <Input
                  value={sku}
                  onChange={setSku}
                  placeholder="Leave blank to generate later"
                />
              </div>
              <div>
                <Label>P/F Number</Label>
                <Input
                  value={pf}
                  onChange={setPf}
                  placeholder="Phones only (P353, F185…)"
                />
              </div>
            </div>
          </section>

          {/* Stock info */}
          <section>
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
              Stock
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <Input type="date" value={stockDate} onChange={setStockDate} />
              </div>
              <div>
                <Label>
                  Quantity <Req />
                </Label>
                <Input type="number" value={qty} onChange={setQty} min="0" />
              </div>
              <div>
                <Label>Location</Label>
                <Input
                  value={location}
                  onChange={setLocation}
                  placeholder="e.g. A-OFF6, Loading Bay"
                />
              </div>
              <div>
                <Label>Arrival Date</Label>
                <Input
                  type="date"
                  value={arrivalDate}
                  onChange={setArrivalDate}
                />
              </div>
              <div>
                <Label>Condition</Label>
                <Input
                  value={condition}
                  onChange={setCondition}
                  placeholder="New, Sealed, ONU…"
                />
              </div>
              <div>
                <Label>VAT %</Label>
                <Input
                  type="number"
                  value={vat}
                  onChange={setVat}
                  min="0"
                  step="0.1"
                  placeholder="20"
                />
              </div>
              <div className="col-span-2">
                <Label>Volume</Label>
                <Input
                  value={volume}
                  onChange={setVolume}
                  placeholder="Physical size / volume"
                />
              </div>
            </div>

            <div className="flex items-center gap-6 mt-3">
              <Checkbox
                checked={counted}
                onChange={setCounted}
                label="Counted (physically verified)"
              />
              <Checkbox
                checked={replenish}
                onChange={setReplenish}
                label="Existing product / stock replenishment"
              />
            </div>
          </section>

          {/* Marketplaces */}
          <section>
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
              Marketplaces
            </h3>
            <div className="space-y-1.5">
              {PLATFORMS.map((p) => {
                const v = mp[p.key];
                return (
                  <div
                    key={p.key}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-colors ${
                      v.required
                        ? "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
                        : "border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={v.required}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setMp((prev) => ({
                          ...prev,
                          [p.key]: {
                            price: checked ? prev[p.key].price : "",
                            required: checked,
                          },
                        }));
                      }}
                      className="rounded"
                    />
                    <span
                      className={`text-sm font-medium w-32 ${
                        v.required
                          ? "text-slate-900 dark:text-slate-100"
                          : "text-slate-400 dark:text-slate-500"
                      }`}
                    >
                      {p.label}
                    </span>
                    <span className="text-slate-400 dark:text-slate-500 text-sm">
                      £
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="price"
                      value={v.price}
                      onChange={(e) => {
                        const price = e.target.value;
                        setMp((prev) => ({
                          ...prev,
                          [p.key]: {
                            price,
                            required:
                              price.trim() !== "" ? true : prev[p.key].required,
                          },
                        }));
                      }}
                      className="w-28 text-sm border border-slate-200 dark:border-slate-700 rounded px-2 py-1
                                 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100
                                 placeholder:text-slate-400 dark:placeholder:text-slate-500
                                 focus:outline-none focus:border-slate-900 dark:focus:border-slate-400"
                    />
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {v.required ? "Required" : "Not required"}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
              Entering a price marks the platform as required. Toggle the
              checkbox to require a platform without a price (e.g. price TBC).
            </p>
          </section>

          {/* Notes */}
          <section>
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
              Notes
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Anything the team should know — batch quirks, condition caveats, sourcing info…"
              className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2
                         bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100
                         placeholder:text-slate-400 dark:placeholder:text-slate-500
                         focus:outline-none focus:border-slate-900 dark:focus:border-slate-400 resize-none"
            />
          </section>

          {error && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={closeNewStockRow}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300
                         hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!item.trim()}
              className="px-4 py-2 text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800
                         dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white
                         disabled:opacity-50 transition-colors"
            >
              Add to Batch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── small presentational helpers ─── */

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
      {children}
    </label>
  );
}
function Req() {
  return <span className="text-red-500">*</span>;
}
function Input({
  value,
  onChange,
  type = "text",
  placeholder,
  autoFocus,
  min,
  step,
}: {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  autoFocus?: boolean;
  min?: string;
  step?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      autoFocus={autoFocus}
      min={min}
      step={step}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2
                 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100
                 placeholder:text-slate-400 dark:placeholder:text-slate-500
                 focus:outline-none focus:border-slate-900 dark:focus:border-slate-400
                 [scheme-light] dark:[scheme-dark]"
    />
  );
}
function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 dark:text-slate-300">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded"
      />
      {label}
    </label>
  );
}
