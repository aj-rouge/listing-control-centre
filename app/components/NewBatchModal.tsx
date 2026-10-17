"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "../lib/store";

function todayISO() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function isoToTs(iso: string): number {
  // Parse as local midnight so dates don't shift by timezone
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).getTime();
}

export default function NewBatchModal() {
  const router = useRouter();

  const open = useStore((s) => s.newBatchOpen);
  const closeNewBatch = useStore((s) => s.closeNewBatch);
  const addBatch = useStore((s) => s.addBatch);

  const [name, setName] = useState("");
  const [date, setDate] = useState(todayISO());
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Reset form each time the modal opens
  useEffect(() => {
    if (open) {
      setName("");
      setDate(todayISO());
      setNotes("");
      setError(null);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeNewBatch();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeNewBatch]);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Batch name is required.");
      return;
    }

    try {
      const batch = await addBatch({
        name: trimmed,
        batch_date: isoToTs(date),
        notes: notes.trim(),
      });
      closeNewBatch();
      router.push(`/batches/${batch.id}`);
    } catch (err) {
      console.error("[NewBatchModal] create failed", err);
      setError("Could not create batch. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/60"
        onClick={closeNewBatch}
      />

      <div className="relative bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md slide-over border border-slate-200 dark:border-slate-800">
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              New Batch
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Name the purchase, pick a date, add anything worth remembering.
            </p>
          </div>
          <button
            type="button"
            onClick={closeNewBatch}
            className="text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 text-2xl leading-none transition-colors"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-slate-50 mb-1">
              Batch name <span className="text-red-500">*</span>
            </label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder='e.g. "07-08 Phones", "Gaming Batch (Aug)"'
              className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2
                         bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100
                         placeholder:text-slate-400 dark:placeholder:text-slate-500
                         focus:outline-none focus:border-slate-900 dark:focus:border-slate-400"
            />
            {error && (
              <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                {error}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-slate-50 mb-1">
              Batch date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2
                         bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100
                         focus:outline-none focus:border-slate-900 dark:focus:border-slate-400
                         scheme-light dark:sheme-dark"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-slate-50 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Optional — supplier, delivery ref, anything the team should know."
              className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2
                         bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100
                         placeholder:text-slate-400 dark:placeholder:text-slate-500
                         focus:outline-none focus:border-slate-900 dark:focus:border-slate-400 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800
                         dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white
                         disabled:opacity-50 transition-colors"
              disabled={!name.trim()}
            >
              Create Batch
            </button>
            <button
              type="button"
              onClick={closeNewBatch}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300
                         hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
