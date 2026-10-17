import type { D1Database } from "@cloudflare/workers-types";
import type { Batch, Marketplace, PlatformKey, Stock } from "../types";
import { executeBatch } from "./execute";

export type D1Statement = { sql: string; params: any[] };

export async function insertBatch(db: D1Database, batch: Batch): Promise<void> {
  await executeBatch(
    [
      {
        sql: `INSERT INTO batches
              (id, name, batch_date, notes, created_by, created_at, updated_by, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        params: [
          batch.id,
          batch.name,
          batch.batch_date,
          batch.notes,
          batch.created_by,
          batch.created_at,
          batch.updated_by,
          batch.updated_at,
        ],
      },
    ],
    db,
  );
}

export async function insertStock(db: D1Database, s: Stock): Promise<void> {
  const statements: D1Statement[] = [
    {
      sql: `INSERT INTO stock (
              id, batch_id, item, identifier_1, identifier_2, qty, sku, location,
              condition, vat_percent, notes, pf_number, priority, is_replenishment,
              blocked, blocked_reason,
              recorded_at, arrived_at, checked_at, listed_at, completed_at,
              stock_date, expected_arrival_at, volume,
              created_by, updated_by, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      params: [
        s.id,
        s.batch_id,
        s.item,
        s.identifier_1,
        s.identifier_2,
        s.qty,
        s.sku,
        s.location,
        s.condition,
        s.vat_percent,
        s.notes,
        s.pf_number,
        s.priority,
        s.is_replenishment,
        s.blocked,
        s.blocked_reason,
        s.recorded_at,
        s.arrived_at,
        s.checked_at,
        s.listed_at,
        s.completed_at,
        s.stock_date ?? null,
        s.expected_arrival_at ?? null,
        s.volume ?? null,
        s.created_by,
        s.updated_by,
        s.updated_at,
      ],
    },
    ...s.marketplaces.map<D1Statement>((m) => ({
      sql: `INSERT INTO marketplaces
            (stock_id, platform, price, required, status,
             blocked_reason, published_at, listing_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      params: [
        s.id,
        m.platform,
        m.price,
        m.required,
        m.status,
        m.blocked_reason,
        m.published_at,
        m.listing_id,
      ],
    })),
  ];
  await executeBatch(statements, db);
}

export async function markStockTimestamp(
  db: D1Database,
  id: string,
  field: "arrived_at" | "checked_at" | "listed_at" | "completed_at",
  ts: number,
): Promise<void> {
  await executeBatch(
    [
      {
        sql: `UPDATE stock SET ${field} = ?, updated_at = ? WHERE id = ?`,
        params: [ts, ts, id],
      },
    ],
    db,
  );
}

export async function blockStock(
  db: D1Database,
  id: string,
  reason: string,
  ts: number,
): Promise<void> {
  await executeBatch(
    [
      {
        sql: `UPDATE stock SET blocked = 1, blocked_reason = ?, updated_at = ? WHERE id = ?`,
        params: [reason, ts, id],
      },
    ],
    db,
  );
}

export async function unblockStock(
  db: D1Database,
  id: string,
  ts: number,
): Promise<void> {
  await executeBatch(
    [
      {
        sql: `UPDATE stock SET blocked = 0, blocked_reason = NULL, updated_at = ? WHERE id = ?`,
        params: [ts, id],
      },
    ],
    db,
  );
}

/**
 * Updates one marketplace row and, in the same D1 batch, recomputes
 * stock.completed_at to keep parity with `allRequiredLive()` in
 * lib/stages.ts:
 *   - done iff every required marketplace is live
 *   - auto-clears if the invariant breaks
 */
export async function updateMarketplace(
  db: D1Database,
  stockId: string,
  platform: PlatformKey,
  patch: Partial<Marketplace>,
  ts: number,
): Promise<void> {
  const setClauses: string[] = [];
  const setValues: any[] = [];

  if (patch.price !== undefined) {
    setClauses.push("price = ?");
    setValues.push(patch.price);
  }
  if (patch.required !== undefined) {
    setClauses.push("required = ?");
    setValues.push(patch.required);
  }
  if (patch.status !== undefined) {
    setClauses.push("status = ?");
    setValues.push(patch.status);
  }
  if (patch.blocked_reason !== undefined) {
    setClauses.push("blocked_reason = ?");
    setValues.push(patch.blocked_reason);
  }
  if (patch.listing_id !== undefined) {
    setClauses.push("listing_id = ?");
    setValues.push(patch.listing_id);
  }

  // published_at: explicit wins, else set-once when becoming live
  if (patch.published_at !== undefined) {
    setClauses.push("published_at = ?");
    setValues.push(patch.published_at);
  } else if (patch.status === "live") {
    setClauses.push("published_at = COALESCE(published_at, ?)");
    setValues.push(ts);
  }

  const statements: D1Statement[] = [];
  if (setClauses.length > 0) {
    statements.push({
      sql: `UPDATE marketplaces
            SET ${setClauses.join(", ")}
            WHERE stock_id = ? AND platform = ?`,
      params: [...setValues, stockId, platform],
    });
  }

  // Recompute completion atomically in the same batch
  statements.push({
    sql: `UPDATE stock SET
            completed_at = CASE
              WHEN (SELECT COUNT(*) FROM marketplaces
                    WHERE stock_id = stock.id AND required = 1) > 0
               AND (SELECT COUNT(*) FROM marketplaces
                    WHERE stock_id = stock.id AND required = 1 AND status = 'live')
                 = (SELECT COUNT(*) FROM marketplaces
                    WHERE stock_id = stock.id AND required = 1)
              THEN COALESCE(completed_at, ?)
              ELSE NULL
            END,
            updated_at = ?
          WHERE id = ?`,
    params: [ts, ts, stockId],
  });

  await executeBatch(statements, db);
}
export async function updateStockDetails(
  db: D1Database,
  id: string,
  patch: Partial<Stock>,
  ts: number,
): Promise<void> {
  const fields: string[] = ["updated_at = ?"];
  const params: any[] = [ts];

  // The specific fields we allow to be edited via this action
  const allowedFields: (keyof Stock)[] = [
    "item",
    "identifier_1",
    "identifier_2",
    "qty",
    "sku",
    "location",
    "condition",
    "vat_percent",
    "notes",
    "pf_number",
    "priority",
  ];

  for (const key of allowedFields) {
    if (patch[key] !== undefined) {
      fields.push(`${key} = ?`);
      // Convert undefined to null for D1
      params.push(patch[key] === undefined ? null : patch[key]);
    }
  }

  params.push(id);

  await executeBatch(
    [
      {
        sql: `UPDATE stock SET ${fields.join(", ")} WHERE id = ?`,
        params,
      },
    ],
    db,
  );
}
export async function deleteStock(db: D1Database, id: string): Promise<void> {
  await executeBatch(
    [
      {
        sql: `DELETE FROM stock WHERE id = ?`,
        params: [id],
      },
    ],
    db,
  );
}

export async function deleteBatch(db: D1Database, id: string): Promise<void> {
  await executeBatch(
    [
      {
        sql: `DELETE FROM batches WHERE id = ?`,
        params: [id],
      },
    ],
    db,
  );
}
