export type PlatformKey =
  | "ebay"
  | "amazon"
  | "onbuy"
  | "tiktok"
  | "backmarket"
  | "wowcher"
  | "ebay_live";

export type MpStatus =
  | "not_required"
  | "not_started"
  | "in_progress"
  | "live"
  | "blocked"
  | "error";

export type Stage =
  | "incoming"
  | "arrived"
  | "checked"
  | "listed"
  | "published"
  | "done"
  | "blocked";

export type Priority = "urgent" | "normal" | "low";

export interface Marketplace {
  platform: PlatformKey;
  price: number | null;
  required: 0 | 1;
  status: MpStatus;
  blocked_reason: string | null;
  published_at: number | null;
  listing_id: string | null;
}

export interface Stock {
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

  created_by: string;
  updated_by: string;
  updated_at: number;

  marketplaces: Marketplace[];
  stock_date?: number;
  expected_arrival_at?: number | null;
  volume?: string | null;
}

export interface Batch {
  id: string;
  name: string;
  batch_date: number;
  notes: string;
  created_by: string;
  created_at: number;
  updated_by: string;
  updated_at: number;
}
