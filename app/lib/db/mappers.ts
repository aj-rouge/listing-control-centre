import type {
  Batch,
  Marketplace,
  MpStatus,
  PlatformKey,
  Priority,
  Stock,
} from "../types";

export interface BatchRow {
  id: string;
  name: string;
  batch_date: number;
  notes: string;
  created_by: string;
  created_at: number;
  updated_by: string;
  updated_at: number;
}

export interface StockRow {
  id: string;
  batch_id: string;
  item: string;
  identifier_1: string;
  identifier_2: string;
  qty: number;
  sku: string;
  location: string;
  condition: string;
  vat_percent: number | null;
  notes: string;
  pf_number: string | null;
  priority: Priority;
  is_replenishment: 0 | 1;
  blocked: 0 | 1;
  blocked_reason: string | null;
  recorded_at: number;
  arrived_at: number | null;
  checked_at: number | null;
  listed_at: number | null;
  completed_at: number | null;
  stock_date: number | null;
  expected_arrival_at: number | null;
  volume: string | null;
  created_by: string;
  updated_by: string;
  updated_at: number;
}

export interface MarketplaceRow {
  stock_id: string;
  platform: PlatformKey;
  price: number | null;
  required: 0 | 1;
  status: MpStatus;
  blocked_reason: string | null;
  published_at: number | null;
  listing_id: string | null;
}

export const mapBatch = (r: BatchRow): Batch => ({ ...r });

export const mapMarketplace = (r: MarketplaceRow): Marketplace => ({
  platform: r.platform,
  price: r.price,
  required: r.required,
  status: r.status,
  blocked_reason: r.blocked_reason,
  published_at: r.published_at,
  listing_id: r.listing_id,
});

export const mapStock = (r: StockRow, marketplaces: Marketplace[]): Stock => {
  // D1 returns `null` for NULL columns; Stock.stock_date expects
  // `number | undefined`, so normalise here. Other nullable columns
  // (vat_percent, pf_number, *_at, expected_arrival_at, volume) already
  // accept `null` in Stock, so they pass through unchanged.
  const { stock_date, ...rest } = r;
  return {
    ...rest,
    stock_date: stock_date ?? undefined,
    marketplaces,
  };
};
