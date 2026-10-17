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
}