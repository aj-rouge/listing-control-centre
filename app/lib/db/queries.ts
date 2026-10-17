import type { D1Database } from "@cloudflare/workers-types";
import type { Batch, Stock } from "../types";
import {
  mapBatch,
  mapMarketplace,
  mapStock,
  type BatchRow,
  type MarketplaceRow,
  type StockRow,
} from "./mappers";
import { executeQuery } from "./execute";

export async function getBatches(db: D1Database): Promise<Batch[]> {
  const rows = (await executeQuery(
    "SELECT * FROM batches ORDER BY batch_date DESC",
    [],
    db,
  )) as BatchRow[];
  return rows.map(mapBatch);
}

export async function getStockWithMarketplaces(
  db: D1Database,
): Promise<Stock[]> {
  const [stockRows, mpRows] = await Promise.all([
    executeQuery(
      "SELECT * FROM stock ORDER BY recorded_at DESC",
      [],
      db,
    ) as Promise<StockRow[]>,
    executeQuery("SELECT * FROM marketplaces", [], db) as Promise<
      MarketplaceRow[]
    >,
  ]);

  const byStock = new Map<string, MarketplaceRow[]>();
  for (const r of mpRows) {
    const list = byStock.get(r.stock_id) ?? [];
    list.push(r);
    byStock.set(r.stock_id, list);
  }

  return stockRows.map((row) =>
    mapStock(row, (byStock.get(row.id) ?? []).map(mapMarketplace)),
  );
}
