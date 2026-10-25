import type { PlatformKey } from "../types";

export interface ImportRow {
  item: string;
  qty: number;
  sku?: string;
  location?: string;
  condition?: string;
  notes?: string;
  pf_number?: string;
  identifier_1?: string;
  identifier_2?: string;
  price?: number | null;
  /**
   * Per-platform prices. Present only when platform columns were mapped.
   * A platform key that is missing or `null` means "not required for this row".
   */
  platformPrices?: Partial<Record<PlatformKey, number | null>>;
}
