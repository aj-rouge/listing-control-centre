"use server";

import { insertBatch, insertStock } from "../lib/db/mutations"; // your existing helpers
import type { Batch, Marketplace, PlatformKey, Stock } from "../lib/types";
import { ImportRow } from "../lib/import/types";
import { getDb } from "../lib/db/client";

const PLATFORMS: PlatformKey[] = [
  "ebay",
  "amazon",
  "onbuy",
  "tiktok",
  "backmarket",
  "wowcher",
  "ebay_live",
];

export async function importStockChunk(input: {
  batchId?: string;
  batchName: string;
  batchDate: number;
  createdBy?: string;
  rows: ImportRow[];
}): Promise<{
  batchId: string;
  imported: number;
  errors: { row: number; message: string }[];
  createdBatch: boolean;
}> {
  const db = await getDb();
  const now = Date.now();
  const createdBy = input.createdBy ?? "import";

  let batchId = input.batchId;
  let createdBatch = false;

  if (!batchId) {
    batchId = crypto.randomUUID();
    const batch: Batch = {
      id: batchId,
      name: input.batchName,
      batch_date: input.batchDate,
      notes: "Imported via CSV",
      created_by: createdBy,
      created_at: now,
      updated_by: createdBy,
      updated_at: now,
    };
    await insertBatch(db, batch);
    createdBatch = true;
  }

  const errors: { row: number; message: string }[] = [];
  let imported = 0;

  for (let i = 0; i < input.rows.length; i++) {
    const r = input.rows[i];
    try {
      const usePlatforms = r.platformPrices !== undefined;

      const marketplaces: Marketplace[] = PLATFORMS.map((platform) => {
        if (usePlatforms) {
          const price = r.platformPrices![platform];
          const isRequired = price !== undefined && price !== null;
          const required: 0 | 1 = isRequired ? 1 : 0;
          return {
            platform,
            price: isRequired ? (price as number) : null,
            required,
            status: isRequired ? "not_started" : "not_required",
            blocked_reason: null,
            published_at: null,
            listing_id: null,
          } as Marketplace;
        }

        // Backward-compat: eBay is required, everything else is not.
        const isEbay = platform === "ebay";
        const required: 0 | 1 = isEbay ? 1 : 0;
        return {
          platform,
          price: isEbay ? (r.price ?? null) : null,
          required,
          status: isEbay ? "not_started" : "not_required",
          blocked_reason: null,
          published_at: null,
          listing_id: null,
        } as Marketplace;
      });

      const stock: Stock = {
        id: crypto.randomUUID(),
        batch_id: batchId,
        item: r.item,
        identifier_1: r.identifier_1 ?? "",
        identifier_2: r.identifier_2 ?? "",
        qty: r.qty,
        sku: r.sku ?? "",
        location: r.location ?? "",
        condition: r.condition ?? "New",
        vat_percent: null,
        notes: r.notes ?? "",
        pf_number: r.pf_number ?? null,
        priority: "normal",
        is_replenishment: 0,
        blocked: 0,
        blocked_reason: null,
        recorded_at: now,
        arrived_at: null,
        checked_at: null,
        listed_at: null,
        completed_at: null,
        stock_date: undefined,
        expected_arrival_at: null,
        volume: null,
        created_by: createdBy,
        updated_by: createdBy,
        updated_at: now,
        marketplaces,
      };

      await insertStock(db, stock);
      imported++;
    } catch (err) {
      errors.push({
        row: i,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return { batchId, imported, errors, createdBatch };
}
