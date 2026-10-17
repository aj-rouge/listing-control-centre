import type { ImportRow } from "./types";

export interface Mapping {
  item: number | null;
  itemSecondary: number | null; // optional "Make" to combine with "Model"
  qty: number | null;
  sku: number | null;
  location: number | null;
  condition: number | null;
  notes: number | null;
  pf_number: number | null;
  identifier_1: number | null;
  identifier_2: number | null;
  price: number | null;
}

export function emptyMapping(): Mapping {
  return {
    item: null,
    itemSecondary: null,
    qty: null,
    sku: null,
    location: null,
    condition: null,
    notes: null,
    pf_number: null,
    identifier_1: null,
    identifier_2: null,
    price: null,
  };
}

export function autoMap(headers: string[]): Mapping {
  const m = emptyMapping();
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

  headers.forEach((h, i) => {
    const hn = norm(h);
    if (!hn) return;
    if (
      m.item === null &&
      ["model", "item", "product", "productname", "description"].includes(hn)
    )
      m.item = i;
    else if (
      m.itemSecondary === null &&
      ["make", "manufacturer", "brand"].includes(hn)
    )
      m.itemSecondary = i;
    else if (m.qty === null && ["qty", "quantity", "count"].includes(hn))
      m.qty = i;
    else if (m.sku === null && hn === "sku") m.sku = i;
    else if (m.location === null && hn === "location") m.location = i;
    else if (m.condition === null && hn.includes("condition")) m.condition = i;
    else if (m.notes === null && (hn === "notes" || hn === "note")) m.notes = i;
    else if (m.pf_number === null && hn === "pfnumber") m.pf_number = i;
    else if (m.identifier_1 === null && (hn === "imei" || hn === "identifier1"))
      m.identifier_1 = i;
    else if (m.identifier_2 === null && hn === "identifier2")
      m.identifier_2 = i;
    else if (m.price === null && (hn === "price" || hn === "sellingprice"))
      m.price = i;
  });

  return m;
}

export type ParsedRow = ImportRow & { _srcIdx: number };

export function transformRows(
  raw: string[][],
  mapping: Mapping,
): { rows: ParsedRow[]; errors: Record<number, string> } {
  const rows: ParsedRow[] = [];
  const errors: Record<number, string> = {};

  raw.forEach((r, idx) => {
    // Skip completely empty sentinel rows (like `,,,,,,,,,`)
    if (r.every((c) => !c || !c.trim())) return;

    const get = (col: number | null): string =>
      col == null ? "" : (r[col] ?? "").trim();

    let item = get(mapping.item);
    const secondary = get(mapping.itemSecondary);
    if (secondary) item = item ? `${item} ${secondary}` : secondary;

    if (!item) {
      errors[idx] = "Item name is required";
      return;
    }

    const qtyRaw = get(mapping.qty);
    let qty = 1;
    if (qtyRaw) {
      const n = parseInt(qtyRaw, 10);
      if (!Number.isFinite(n) || n < 0) {
        errors[idx] = `Invalid quantity: "${qtyRaw}"`;
        return;
      }
      qty = n;
    }

    const priceRaw = get(mapping.price);
    let price: number | null = null;
    if (priceRaw) {
      // Strip currency symbols, commas, spaces, mojibake, "approx", etc.
      // "£1,299.99" → "1299.99";  "�119.00" → "119.00";  "/" → "";  "TBC" → ""
      const cleaned = priceRaw.replace(/[^\d.\-]/g, "");
      if (cleaned === "") {
        // No digits at all — treat as "no price set", not as an error.
        // Covers "/", "TBC", "Try to test", "see notes", etc.
        price = null;
      } else if (/^-?\d+(\.\d+)?$/.test(cleaned)) {
        price = parseFloat(cleaned);
      } else {
        // Had digits but not a clean number, e.g. "1.2.3" or "-"
        errors[idx] = `Invalid price: "${priceRaw.slice(0, 40)}${
          priceRaw.length > 40 ? "…" : ""
        }"`;
        return;
      }
    }

    rows.push({
      _srcIdx: idx,
      item,
      qty,
      sku: get(mapping.sku) || undefined,
      location: get(mapping.location) || undefined,
      condition: get(mapping.condition) || undefined,
      notes: get(mapping.notes) || undefined,
      pf_number: get(mapping.pf_number) || undefined,
      identifier_1: get(mapping.identifier_1) || undefined,
      identifier_2: get(mapping.identifier_2) || undefined,
      price,
    });
  });

  return { rows, errors };
}
