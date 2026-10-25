import type { ImportRow } from "./types";
import type { PlatformKey } from "../types";

const PLATFORM_KEYS: PlatformKey[] = [
  "ebay",
  "amazon",
  "onbuy",
  "tiktok",
  "backmarket",
  "wowcher",
  "ebay_live",
];

export interface Mapping {
  item: number | null;
  itemSecondary: number | null;
  qty: number | null;
  sku: number | null;
  location: number | null;
  condition: number | null;
  notes: number | null;
  pf_number: number | null;
  identifier_1: number | null;
  identifier_2: number | null;
  price: number | null; // legacy / eBay fallback
  // Platform price columns — empty cell ⇒ platform not required for that row
  ebay: number | null;
  amazon: number | null;
  onbuy: number | null;
  tiktok: number | null;
  backmarket: number | null;
  wowcher: number | null;
  ebay_live: number | null;
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
    ebay: null,
    amazon: null,
    onbuy: null,
    tiktok: null,
    backmarket: null,
    wowcher: null,
    ebay_live: null,
  };
}

export function hasPlatformMapping(m: Mapping): boolean {
  return (
    m.ebay !== null ||
    m.amazon !== null ||
    m.onbuy !== null ||
    m.tiktok !== null ||
    m.backmarket !== null ||
    m.wowcher !== null ||
    m.ebay_live !== null
  );
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
    // ── Platform columns ──────────────────────────────────────────────
    else if (m.ebay === null && (hn === "ebay" || hn === "ebayprice"))
      m.ebay = i;
    else if (
      m.amazon === null &&
      ["amazon", "az", "amazonprice", "azprice"].includes(hn)
    )
      m.amazon = i;
    else if (m.onbuy === null && ["onbuy", "onbuyprice"].includes(hn))
      m.onbuy = i;
    else if (
      m.tiktok === null &&
      ["tiktok", "tiktokprice", "tiktokshop"].includes(hn)
    )
      m.tiktok = i;
    else if (
      m.backmarket === null &&
      ["backmarket", "backmarketprice"].includes(hn)
    )
      m.backmarket = i;
    else if (m.wowcher === null && ["wowcher", "wowcherprice"].includes(hn))
      m.wowcher = i;
    else if (m.ebay_live === null && ["ebaylive", "ebayliveprice"].includes(hn))
      m.ebay_live = i;
  });

  return m;
}

export type ParsedRow = ImportRow & { _srcIdx: number };

/** Returns `null` for empty / `-` / `N/A` / `TBC` / "already in stock" etc.
 *  If the cell contains "/", the first numeric group is used (e.g. "39.99 / 44.99" → 39.99).
 *  Returns `null` on genuinely un‑parseable values — platforms are silently skipped. */
function parsePlatformPrice(raw: string): number | null {
  if (!raw) return null;
  const t = raw.trim();
  if (!t) return null;

  const lower = t.toLowerCase();
  if (["-", "/", "n/a", "na", "tbc", "?", ""].includes(lower)) return null;

  const first = t.split("/")[0].trim();
  const cleaned = first.replace(/[^\d.\-]/g, "");
  if (cleaned === "") return null;
  if (/^-?\d+(\.\d+)?$/.test(cleaned)) return parseFloat(cleaned);
  return null;
}

export function transformRows(
  raw: string[][],
  mapping: Mapping,
): {
  rows: ParsedRow[];
  errors: Record<number, string>;
  /** Indices of source rows that contained no data in any *mapped* column.
   *  These are treated as "spacing" (section headers, date stamps, VAT-only
   *  markers) and are surfaced as informational notes, not errors. */
  spacesSkipped: number[];
} {
  const rows: ParsedRow[] = [];
  const errors: Record<number, string> = {};
  const spacesSkipped: number[] = [];
  const platformsMapped = hasPlatformMapping(mapping);

  raw.forEach((r, idx) => {
    // Completely blank row (every cell empty) → silent skip, no note.
    if (r.every((c) => !c || !c.trim())) return;

    const get = (col: number | null): string =>
      col == null ? "" : (r[col] ?? "").trim();

    // Rows whose only content lives in UNMAPPED columns (Date, VAT %,
    // section headers, etc.) get flagged as spacing, not errors.
    const mappedCols: (number | null)[] = [
      mapping.item,
      mapping.itemSecondary,
      mapping.qty,
      mapping.sku,
      mapping.location,
      mapping.condition,
      mapping.notes,
      mapping.pf_number,
      mapping.identifier_1,
      mapping.identifier_2,
      mapping.price,
      mapping.ebay,
      mapping.amazon,
      mapping.onbuy,
      mapping.tiktok,
      mapping.backmarket,
      mapping.wowcher,
      mapping.ebay_live,
    ];
    const hasAnyMappedContent = mappedCols.some(
      (c) => c !== null && get(c) !== "",
    );
    if (!hasAnyMappedContent) {
      spacesSkipped.push(idx);
      return;
    }

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

    // ── Legacy price (used for the preview "Price" column, i.e. eBay) ─
    let displayPrice: number | null = null;
    if (platformsMapped) {
      displayPrice = parsePlatformPrice(get(mapping.ebay));
    } else {
      const priceRaw = get(mapping.price);
      if (priceRaw) {
        const cleaned = priceRaw.replace(/[^\d.\-]/g, "");
        if (cleaned !== "") {
          if (/^-?\d+(\.\d+)?$/.test(cleaned)) {
            displayPrice = parseFloat(cleaned);
          } else {
            errors[idx] = `Invalid price: "${priceRaw.slice(0, 40)}${
              priceRaw.length > 40 ? "…" : ""
            }"`;
            return;
          }
        }
      }
    }

    // ── Per-platform prices ─────────────────────────────────────────
    const platformPrices = platformsMapped
      ? ({} as Partial<Record<PlatformKey, number | null>>)
      : undefined;

    if (platformPrices) {
      const cols: Record<PlatformKey, number | null> = {
        ebay: mapping.ebay,
        amazon: mapping.amazon,
        onbuy: mapping.onbuy,
        tiktok: mapping.tiktok,
        backmarket: mapping.backmarket,
        wowcher: mapping.wowcher,
        ebay_live: mapping.ebay_live,
      };
      for (const p of PLATFORM_KEYS) {
        const col = cols[p];
        if (col === null) continue;
        const v = parsePlatformPrice(get(col));
        if (v !== null) platformPrices[p] = v;
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
      price: displayPrice,
      platformPrices,
    });
  });

  return { rows, errors, spacesSkipped };
}
