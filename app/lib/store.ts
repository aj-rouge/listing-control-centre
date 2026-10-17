"use client";

import { create } from "zustand";
import type { Batch, Marketplace, PlatformKey, Stock } from "./types";
import { allRequiredLive } from "./stages";
import { buildMarketplaces } from "./seed";
import {
  actionBlockRow,
  actionCreateBatch,
  actionCreateStock,
  actionDeleteBatch,
  actionDeleteStock,
  actionMarkArrived,
  actionMarkChecked,
  actionMarkDone,
  actionMarkListed,
  actionSetMarketplace,
  actionUnblockRow,
  actionUpdateStockDetails,
} from "@/app/actions";

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
  newStockRowOpen: boolean;
  newStockRowForBatch: string | null;

  openRow: (id: string) => void;
  closeRow: () => void;

  openNewBatch: () => void;
  closeNewBatch: () => void;
  addBatch: (input: {
    name: string;
    batch_date: number;
    notes?: string;
  }) => Promise<Batch>;

  openNewStockRow: (batchId: string | null) => void;
  closeNewStockRow: () => void;
  addStock: (input: NewStockInput) => Promise<Stock>;

  markArrived: (id: string) => Promise<void>;
  markChecked: (id: string) => Promise<void>;
  markListed: (id: string) => Promise<void>;
  markDone: (id: string) => Promise<void>;

  blockRow: (id: string, reason: string) => Promise<void>;
  unblockRow: (id: string) => Promise<void>;

  setMarketplace: (
    stockId: string,
    platform: PlatformKey,
    patch: Partial<Marketplace>,
  ) => Promise<void>;

  reset: () => void;
  updateStockDetails: (id: string, patch: Partial<Stock>) => Promise<void>;
  deleteStock: (id: string) => Promise<void>;
  deleteBatch: (id: string) => Promise<void>;
}

const now = () => Date.now();

export const useStore = create<State>((set) => ({
  batches: [],
  stock: [],
  openRowId: null,
  newBatchOpen: false,
  newStockRowOpen: false,
  newStockRowForBatch: null,

  openRow: (id) => set({ openRowId: id }),
  closeRow: () => set({ openRowId: null }),

  openNewBatch: () => set({ newBatchOpen: true }),
  closeNewBatch: () => set({ newBatchOpen: false }),

  addBatch: async ({ name, batch_date, notes }) => {
    const batch = await actionCreateBatch({ name, batch_date, notes });
    set((s) => ({ batches: [...s.batches, batch] }));
    return batch;
  },

  openNewStockRow: (batchId) =>
    set({ newStockRowOpen: true, newStockRowForBatch: batchId }),
  closeNewStockRow: () =>
    set({ newStockRowOpen: false, newStockRowForBatch: null }),

  addStock: async (input) => {
    const created = await actionCreateStock(input);
    set((s) => ({ stock: [...s.stock, created] }));
    return created;
  },

  markArrived: async (id) => {
    const ts = now();
    set((s) => ({
      stock: s.stock.map((x) =>
        x.id === id ? { ...x, arrived_at: ts, updated_at: ts } : x,
      ),
    }));
    try {
      await actionMarkArrived(id, ts);
    } catch (err) {
      console.error("[markArrived] persist failed", err);
    }
  },

  markChecked: async (id) => {
    const ts = now();
    set((s) => ({
      stock: s.stock.map((x) =>
        x.id === id ? { ...x, checked_at: ts, updated_at: ts } : x,
      ),
    }));
    try {
      await actionMarkChecked(id, ts);
    } catch (err) {
      console.error("[markChecked] persist failed", err);
    }
  },

  markListed: async (id) => {
    const ts = now();
    set((s) => ({
      stock: s.stock.map((x) =>
        x.id === id ? { ...x, listed_at: ts, updated_at: ts } : x,
      ),
    }));
    try {
      await actionMarkListed(id, ts);
    } catch (err) {
      console.error("[markListed] persist failed", err);
    }
  },

  markDone: async (id) => {
    const ts = now();
    set((s) => ({
      stock: s.stock.map((x) =>
        x.id === id ? { ...x, completed_at: ts, updated_at: ts } : x,
      ),
    }));
    try {
      await actionMarkDone(id, ts);
    } catch (err) {
      console.error("[markDone] persist failed", err);
    }
  },

  blockRow: async (id, reason) => {
    const ts = now();
    set((s) => ({
      stock: s.stock.map((x) =>
        x.id === id
          ? { ...x, blocked: 1, blocked_reason: reason, updated_at: ts }
          : x,
      ),
    }));
    try {
      await actionBlockRow(id, reason, ts);
    } catch (err) {
      console.error("[blockRow] persist failed", err);
    }
  },

  unblockRow: async (id) => {
    const ts = now();
    set((s) => ({
      stock: s.stock.map((x) =>
        x.id === id
          ? { ...x, blocked: 0, blocked_reason: null, updated_at: ts }
          : x,
      ),
    }));
    try {
      await actionUnblockRow(id, ts);
    } catch (err) {
      console.error("[unblockRow] persist failed", err);
    }
  },

  setMarketplace: async (stockId, platform, patch) => {
    const ts = now();
    set((s) => ({
      stock: s.stock.map((x) => {
        if (x.id !== stockId) return x;
        const marketplaces = x.marketplaces.map((m) => {
          if (m.platform !== platform) return m;
          const updated: Marketplace = { ...m, ...patch };
          if (patch.status === "live" && !m.published_at) {
            updated.published_at = ts;
          }
          return updated;
        });
        const next: Stock = { ...x, marketplaces, updated_at: ts };
        if (allRequiredLive(next)) {
          if (!next.completed_at) next.completed_at = ts;
        } else if (next.completed_at) {
          next.completed_at = null;
        }
        return next;
      }),
    }));
    try {
      await actionSetMarketplace(stockId, platform, patch, ts);
    } catch (err) {
      console.error("[setMarketplace] persist failed", err);
    }
  },
  updateStockDetails: async (id, patch) => {
    const ts = now();

    // Optimistic update
    set((s) => ({
      stock: s.stock.map((x) =>
        x.id === id ? { ...x, ...patch, updated_at: ts } : x,
      ),
    }));

    try {
      await actionUpdateStockDetails(id, patch, ts);
    } catch (err) {
      console.error("[updateStockDetails] persist failed", err);
    }
  },
  deleteStock: async (id) => {
    // Optimistically remove
    set((s) => ({
      stock: s.stock.filter((x) => x.id !== id),
      // Close the row detail panel if it's currently open for this item
      openRowId: s.openRowId === id ? null : s.openRowId,
    }));

    try {
      await actionDeleteStock(id);
    } catch (err) {
      console.error("[deleteStock] persist failed", err);
    }
  },

  deleteBatch: async (id) => {
    // Optimistically remove batch and all its associated stock
    set((s) => ({
      batches: s.batches.filter((b) => b.id !== id),
      stock: s.stock.filter((x) => x.batch_id !== id),
      // Close row if it belonged to this batch
      openRowId:
        s.stock.find((x) => x.id === s.openRowId)?.batch_id === id
          ? null
          : s.openRowId,
    }));

    try {
      await actionDeleteBatch(id);
    } catch (err) {
      console.error("[deleteBatch] persist failed", err);
    }
  },
  reset: () =>
    set({
      batches: [],
      stock: [],
      openRowId: null,
      newBatchOpen: false,
      newStockRowOpen: false,
      newStockRowForBatch: null,
    }),
}));
