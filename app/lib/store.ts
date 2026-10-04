"use client";

import { create } from "zustand";
import type { Batch, Marketplace, PlatformKey, Stock } from "./types";
import { allRequiredLive } from "./stages";
import {
  batches as seedBatches,
  stock as seedStock,
  buildMarketplaces,
} from "./seed";

interface NewStockInput {
  batch_id: string;
  item: string;
  identifier_1?: string;
  identifier_2?: string;
  qty: number;
  sku?: string;
  location?: string;
  condition?: string;
  vat_percent?: number | null;
  volume?: string | null;
  notes?: string;
  pf_number?: string | null;
  is_replenishment?: 0 | 1;
  counted?: 0 | 1;
  stock_date?: number;
  expected_arrival_at?: number | null;
  mp?: Partial<Record<PlatformKey, { price?: number | null; req?: 0 | 1 }>>;
}

interface State {
  batches: Batch[];
  stock: Stock[];
  openRowId: string | null;
  newBatchOpen: boolean;
  newStockRowForBatch: string | null;

  openRow: (id: string) => void;
  closeRow: () => void;

  openNewBatch: () => void;
  closeNewBatch: () => void;
  addBatch: (input: {
    name: string;
    batch_date: number;
    notes?: string;
  }) => Batch;

  openNewStockRow: (batchId: string) => void;
  closeNewStockRow: () => void;
  addStock: (input: NewStockInput) => Stock;

  markArrived: (id: string) => void;
  markChecked: (id: string) => void;
  markListed: (id: string) => void;
  markDone: (id: string) => void;

  blockRow: (id: string, reason: string) => void;
  unblockRow: (id: string) => void;

  setMarketplace: (
    stockId: string,
    platform: PlatformKey,
    patch: Partial<Marketplace>,
  ) => void;

  reset: () => void;
}

const now = () => Date.now();

export const useStore = create<State>((set) => ({
  batches: seedBatches,
  stock: seedStock,
  openRowId: null,
  newBatchOpen: false,
  newStockRowForBatch: null,

  openRow: (id) => set({ openRowId: id }),
  closeRow: () => set({ openRowId: null }),

  openNewBatch: () => set({ newBatchOpen: true }),
  closeNewBatch: () => set({ newBatchOpen: false }),

  addBatch: ({ name, batch_date, notes }) => {
    const batch: Batch = {
      id: crypto.randomUUID(),
      name,
      batch_date,
      notes: notes ?? "",
      created_by: "AJ",
      created_at: now(),
      updated_by: "AJ",
      updated_at: now(),
    };
    set((s) => ({ batches: [...s.batches, batch] }));
    return batch;
  },

  openNewStockRow: (batchId) => set({ newStockRowForBatch: batchId }),
  closeNewStockRow: () => set({ newStockRowForBatch: null }),

  addStock: (input) => {
    const ts = now();
    const counted = input.counted ?? 0;
    const created: Stock = {
      id: crypto.randomUUID(),
      batch_id: input.batch_id,
      item: input.item,
      identifier_1: input.identifier_1 ?? "",
      identifier_2: input.identifier_2 ?? "",
      qty: input.qty,
      sku: input.sku ?? "",
      location: input.location ?? "",
      condition: input.condition ?? "New",
      vat_percent: input.vat_percent ?? null,
      notes: input.notes ?? "",
      pf_number: input.pf_number ?? null,
      priority: "normal",
      is_replenishment: input.is_replenishment ?? 0,
      blocked: 0,
      blocked_reason: null,
      recorded_at: ts,
      arrived_at: counted ? ts : null,
      checked_at: counted ? ts : null,
      listed_at: null,
      completed_at: null,
      created_by: "AJ",
      updated_by: "AJ",
      updated_at: ts,
      marketplaces: buildMarketplaces(input.mp ?? {}, 3),
      stock_date: input.stock_date ?? ts,
      expected_arrival_at: input.expected_arrival_at ?? null,
      volume: input.volume ?? null,
    };
    set((s) => ({ stock: [...s.stock, created] }));
    return created;
  },

  markArrived: (id) =>
    set((s) => ({
      stock: s.stock.map((x) =>
        x.id === id ? { ...x, arrived_at: now(), updated_at: now() } : x,
      ),
    })),

  markChecked: (id) =>
    set((s) => ({
      stock: s.stock.map((x) =>
        x.id === id ? { ...x, checked_at: now(), updated_at: now() } : x,
      ),
    })),

  markListed: (id) =>
    set((s) => ({
      stock: s.stock.map((x) =>
        x.id === id ? { ...x, listed_at: now(), updated_at: now() } : x,
      ),
    })),

  markDone: (id) =>
    set((s) => ({
      stock: s.stock.map((x) =>
        x.id === id ? { ...x, completed_at: now(), updated_at: now() } : x,
      ),
    })),

  blockRow: (id, reason) =>
    set((s) => ({
      stock: s.stock.map((x) =>
        x.id === id
          ? { ...x, blocked: 1, blocked_reason: reason, updated_at: now() }
          : x,
      ),
    })),

  unblockRow: (id) =>
    set((s) => ({
      stock: s.stock.map((x) =>
        x.id === id
          ? { ...x, blocked: 0, blocked_reason: null, updated_at: now() }
          : x,
      ),
    })),

  setMarketplace: (stockId, platform, patch) =>
    set((s) => ({
      stock: s.stock.map((x) => {
        if (x.id !== stockId) return x;
        const marketplaces = x.marketplaces.map((m) => {
          if (m.platform !== platform) return m;
          const updated: Marketplace = { ...m, ...patch };
          if (patch.status === "live" && !m.published_at) {
            updated.published_at = now();
          }
          return updated;
        });
        const next: Stock = { ...x, marketplaces, updated_at: now() };
        if (allRequiredLive(next)) {
          if (!next.completed_at) next.completed_at = now();
        } else if (next.completed_at) {
          next.completed_at = null;
        }
        return next;
      }),
    })),

  reset: () =>
    set({
      batches: seedBatches,
      stock: seedStock,
      openRowId: null,
      newBatchOpen: false,
      newStockRowForBatch: null,
    }),
}));
