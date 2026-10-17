"use server";

import {
  blockStock,
  deleteBatch,
  deleteStock,
  insertBatch,
  insertStock,
  markStockTimestamp,
  unblockStock,
  updateMarketplace,
  updateStockDetails,
} from "./lib/db/mutations";
import { buildMarketplaces } from "./lib/seed";
import type { Batch, Marketplace, PlatformKey, Stock } from "./lib/types";
import { getDb } from "./lib/db/client";

export async function actionCreateBatch(input: {
  name: string;
  batch_date: number;
  notes?: string;
}): Promise<Batch> {
  const db = await getDb();
  const ts = Date.now();
  const batch: Batch = {
    id: crypto.randomUUID(),
    name: input.name,
    batch_date: input.batch_date,
    notes: input.notes ?? "",
    created_by: "AJ",
    created_at: ts,
    updated_by: "AJ",
    updated_at: ts,
  };
  await insertBatch(db, batch);
  return batch;
}

export async function actionCreateStock(input: {
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
}): Promise<Stock> {
  const db = await getDb();
  const ts = Date.now();
  const counted = input.counted ?? 0;
  const stock: Stock = {
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
  await insertStock(db, stock);
  return stock;
}

export async function actionMarkArrived(id: string, ts: number) {
  await markStockTimestamp(await getDb(), id, "arrived_at", ts);
}
export async function actionMarkChecked(id: string, ts: number) {
  await markStockTimestamp(await getDb(), id, "checked_at", ts);
}
export async function actionMarkListed(id: string, ts: number) {
  await markStockTimestamp(await getDb(), id, "listed_at", ts);
}
export async function actionMarkDone(id: string, ts: number) {
  await markStockTimestamp(await getDb(), id, "completed_at", ts);
}
export async function actionBlockRow(id: string, reason: string, ts: number) {
  await blockStock(await getDb(), id, reason, ts);
}
export async function actionUnblockRow(id: string, ts: number) {
  await unblockStock(await getDb(), id, ts);
}
export async function actionSetMarketplace(
  stockId: string,
  platform: PlatformKey,
  patch: Partial<Marketplace>,
  ts: number,
) {
  await updateMarketplace(await getDb(), stockId, platform, patch, ts);
}
export async function actionUpdateStockDetails(
  id: string,
  patch: Partial<Stock>,
  ts: number,
) {
  await updateStockDetails(await getDb(), id, patch, ts);
}
export async function actionDeleteStock(id: string) {
  await deleteStock(await getDb(), id);
}

export async function actionDeleteBatch(id: string) {
  await deleteBatch(await getDb(), id);
}
