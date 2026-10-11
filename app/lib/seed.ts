import type {
  Batch,
  Marketplace,
  MpStatus,
  PlatformKey,
  Priority,
  Stock,
} from "./types";

const now = Date.now();
const DAY = 86_400_000;

export const batches: Batch[] = [
  ["b1", "June Batch", 30],
  ["b2", "03.06 Incoming", 27],
  ["b3", "July Batch", 20],
  ["b4", "Gaming Batch (Aug)", 12],
  ["b5", "30.09 GameSir / Ring", 3],
  ["b6", "07-08 Phones", 8],
].map(([id, name, age]) => ({
  id: id as string,
  name: name as string,
  batch_date: now - (age as number) * DAY,
  notes: "",
  created_by: "AJ",
  created_at: now - (age as number) * DAY,
  updated_by: "AJ",
  updated_at: now - (age as number) * DAY,
}));

type MpOpt = {
  price?: number | null;
  req?: 0 | 1;
  status?: MpStatus;
  blocked_reason?: string;
};
export function buildMarketplaces(
  mp: Partial<
    Record<
      PlatformKey,
      {
        price?: number | null;
        req?: 0 | 1;
        status?: MpStatus;
        blocked_reason?: string;
        listing_id?: string | null;
      }
    >
  >,
  baseAge: number,
): Marketplace[] {
  const keys: PlatformKey[] = [
    "ebay",
    "amazon",
    "onbuy",
    "tiktok",
    "backmarket",
    "wowcher",
    "ebay_live",
  ];
  return keys.map((k) => {
    const o = mp[k];
    if (!o) {
      return {
        platform: k,
        price: null,
        required: 0,
        status: "not_required",
        blocked_reason: null,
        published_at: null,
        listing_id: null,
      };
    }
    const required = (o.req ?? 1) as 0 | 1;
    const status = o.status ?? "not_started";
    return {
      platform: k,
      price: o.price ?? null,
      required,
      status,
      blocked_reason: o.blocked_reason ?? null,
      published_at:
        status === "live" ? now - Math.max(baseAge - 3, 0) * DAY : null,
      listing_id: o.listing_id ?? null,
    };
  });
}

interface Row {
  id: string;
  batch_id: string;
  item: string;
  id1?: string;
  id2?: string;
  qty?: number;
  sku?: string;
  loc?: string;
  cond?: string;
  vat?: number;
  notes?: string;
  pf?: string;
  pri?: Priority;
  replenish?: 0 | 1;
  age?: number;
  arrived?: boolean;
  checked?: boolean;
  listed?: boolean;
  done?: boolean;
  mp?: Partial<Record<PlatformKey, MpOpt>>;
}

const rows: Row[] = [
  // June — all done
  {
    id: "s01",
    batch_id: "b1",
    item: "Shokz OpenFit Pro",
    qty: 36,
    age: 30,
    arrived: true,
    checked: true,
    listed: true,
    done: true,
    mp: {
      ebay: { price: 199, status: "live" },
      onbuy: { price: 89, status: "live" },
      backmarket: { price: 89, status: "live" },
    },
  },
  {
    id: "s02",
    batch_id: "b1",
    item: "Ugreen HDMI",
    qty: 3,
    age: 30,
    arrived: true,
    checked: true,
    listed: true,
    done: true,
    mp: {
      ebay: { price: 59.99, status: "live" },
      onbuy: { price: 89, status: "live" },
      backmarket: { price: 89, status: "live" },
    },
  },
  {
    id: "s03",
    batch_id: "b1",
    item: "Ring Video Doorbell Pro",
    qty: 7,
    age: 30,
    arrived: true,
    checked: true,
    listed: true,
    done: true,
    notes: "We may already have this",
    mp: {
      ebay: { price: 129, status: "live" },
      onbuy: { price: 89, status: "live" },
      backmarket: { price: 89, status: "live" },
    },
  },
  {
    id: "s04",
    batch_id: "b1",
    item: "MacBook Air Laptop",
    qty: 1,
    age: 30,
    arrived: true,
    checked: true,
    listed: true,
    done: true,
    notes: "eBay only",
    mp: { ebay: { price: 899, status: "live" } },
  },

  // 03.06 — in flight
  {
    id: "s05",
    batch_id: "b2",
    item: "Eero 6+",
    qty: 1,
    age: 27,
    arrived: true,
    checked: true,
    listed: true,
    notes: "Should be sealed",
    mp: {
      ebay: { price: 69, status: "live" },
      onbuy: { price: 89, status: "live" },
      backmarket: { price: 89, status: "live" },
    },
  },
  {
    id: "s06",
    batch_id: "b2",
    item: "Greenpacket router",
    qty: 1,
    age: 27,
    arrived: true,
    checked: true,
    listed: true,
    mp: {
      ebay: { price: 139, status: "live" },
      amazon: { price: 169, status: "live" },
      onbuy: { price: 149, status: "live" },
      backmarket: { price: 169, status: "live" },
    },
  },
  {
    id: "s07",
    batch_id: "b2",
    item: "Remarkable Paper Pro",
    qty: 150,
    age: 27,
    arrived: true,
    checked: true,
    listed: true,
    pri: "urgent",
    notes: "Added to BaseLinker, ONU version",
    mp: {
      ebay: { price: 449, status: "live" },
      onbuy: { price: 529, status: "live" },
      backmarket: { price: 549, status: "in_progress" },
    },
  },
  {
    id: "s08",
    batch_id: "b2",
    item: "Zyxel Outdoor Router",
    qty: 1,
    age: 27,
    arrived: true,
    checked: true,
    listed: true,
    notes: "Be wary of FWA model",
    mp: {
      ebay: { price: 299, status: "live" },
      amazon: {
        price: 299,
        status: "blocked",
        blocked_reason: "Amazon approval pending",
      },
      onbuy: { price: 299, status: "live" },
      backmarket: { price: 299, status: "live" },
    },
  },
  {
    id: "s09",
    batch_id: "b2",
    item: "Marshall V Headphones",
    qty: 60,
    age: 27,
    pri: "urgent",
    notes: "On Base awaiting arrival. Sell for £95 on Amazon if possible",
    mp: {
      ebay: { price: 84.99, status: "in_progress" },
      amazon: { price: 89.99, status: "in_progress" },
      onbuy: { price: 89.99, status: "in_progress" },
      backmarket: { price: 94.99, status: "in_progress" },
    },
  },

  // July
  {
    id: "s10",
    batch_id: "b3",
    item: "Sony lens 55-210mm",
    id1: "4905524958706",
    qty: 6,
    age: 20,
    arrived: true,
    checked: true,
    listed: true,
    done: true,
    mp: {
      ebay: { price: 189, status: "live" },
      onbuy: { price: 219, status: "live" },
    },
  },
  {
    id: "s11",
    batch_id: "b3",
    item: "Sony C700N",
    id1: "4548736143593",
    qty: 110,
    age: 20,
    arrived: true,
    checked: true,
    listed: true,
    done: true,
    mp: {
      ebay: { price: 49.99, status: "live" },
      amazon: { price: 49.99, status: "live" },
      onbuy: { price: 52.99, status: "live" },
      backmarket: { price: 54, status: "live" },
    },
  },
  {
    id: "s12",
    batch_id: "b3",
    item: "Arctis Nova Pro WL HS for PC",
    id1: "813682027599",
    id2: "73257-B",
    qty: 28,
    age: 20,
    arrived: true,
    checked: true,
    listed: true,
    replenish: 1,
    sku: "STEE-HEA-NOV-PRO-WIR-PC-BLA-REF",
    notes: "Existing SKU — replenishment",
    mp: {
      ebay: { price: 149, status: "in_progress" },
      onbuy: { price: 169, status: "live" },
      backmarket: { price: 169, status: "live" },
    },
  },
  {
    id: "s13",
    batch_id: "b3",
    item: "BlackShark V3 WL HS for PC Blk",
    id1: "840272919590",
    qty: 5,
    age: 20,
    arrived: true,
    checked: true,
    listed: true,
    done: true,
    mp: {
      ebay: { price: 84.99, status: "live" },
      onbuy: { price: 99.99, status: "live" },
      backmarket: { price: 99, status: "live" },
    },
  },
  {
    id: "s14",
    batch_id: "b3",
    item: "Wolverine V3 Pro WL Xbox",
    id1: "840272909850",
    qty: 20,
    age: 20,
    arrived: true,
    checked: true,
    mp: { ebay: { price: 109.99, status: "in_progress" } },
  },

  // Aug gaming
  {
    id: "s15",
    batch_id: "b4",
    item: "Apex 3 TKL Wired Gaming Keyboard",
    id1: "810052980270",
    id2: "73237-B",
    qty: 28,
    age: 12,
    arrived: true,
    checked: true,
    listed: true,
    loc: "14 in N2",
    cond: "ONU + EX-REF",
    mp: {
      ebay: { price: 34.99, status: "live" },
      onbuy: { price: 39.99, status: "live" },
      backmarket: { price: 39.99, status: "in_progress" },
    },
  },
  {
    id: "s16",
    batch_id: "b4",
    item: "Razer Huntsman V3 Pro TKL",
    id1: "840272909386",
    id2: "RZ03-04980200-B",
    qty: 30,
    age: 12,
    arrived: true,
    checked: true,
    listed: true,
    notes: "Check 8khz or not",
    cond: "ONU + EX-REF",
    mp: {
      ebay: { price: 104.99, status: "live" },
      onbuy: { price: 119.99, status: "live" },
      backmarket: { price: 119.99, status: "live" },
    },
  },
  {
    id: "s17",
    batch_id: "b4",
    item: "Pulsar X2H Mini Size1 WL White",
    id1: "8809773553643",
    qty: 20,
    age: 12,
    arrived: true,
    checked: true,
    listed: true,
    done: true,
    mp: {
      ebay: { price: 49.99, status: "live" },
      amazon: { price: 69.99, status: "live" },
      onbuy: { price: 69.99, status: "live" },
      backmarket: { price: 69.99, status: "live" },
    },
  },
  {
    id: "s18",
    batch_id: "b4",
    item: "Aerox 9 Wireless",
    id2: "73251-B",
    qty: 30,
    age: 12,
    arrived: true,
    checked: true,
    mp: {
      ebay: { price: 54.99, status: "in_progress" },
      onbuy: { price: 64.99, status: "in_progress" },
      backmarket: { price: 69.99, status: "in_progress" },
    },
  },

  // Sept
  {
    id: "s19",
    batch_id: "b5",
    item: "GameSir G7 SE - White",
    id1: "5060745415144",
    qty: 127,
    age: 3,
    arrived: true,
    cond: "Open, Never Used / X-Ref (Brown Box)",
    mp: {
      ebay: { price: 27.99, status: "not_started" },
      amazon: { price: 29.99, status: "not_started" },
      onbuy: { price: 29.99, status: "not_started" },
      backmarket: { price: 32.99, status: "not_started" },
    },
  },
  {
    id: "s20",
    batch_id: "b5",
    item: "GameSir G7 SE - Orange",
    id1: "5060745415199",
    qty: 3,
    age: 3,
    arrived: true,
    cond: "Open, Never Used / X-Ref (Brown Box)",
    mp: {
      ebay: { price: 27.99, status: "not_started" },
      amazon: { price: 29.99, status: "not_started" },
      onbuy: { price: 29.99, status: "not_started" },
      backmarket: { price: 32.99, status: "not_started" },
    },
  },
  {
    id: "s21",
    batch_id: "b5",
    item: "Ring Doorbells Plus New 2K",
    id1: "RING-DOOR-RING-BATT-VIDE-PLUS-NEW",
    qty: 348,
    age: 3,
    arrived: true,
    pri: "urgent",
    loc: "AJ to bring",
    mp: {
      ebay: { price: 69.99, status: "not_started" },
      onbuy: { price: 74.99, status: "not_started" },
      tiktok: { price: 74.99, status: "not_started" },
      backmarket: { price: 74.99, status: "not_started" },
    },
  },
  {
    id: "s22",
    batch_id: "b5",
    item: "Dyson V8 Origin",
    qty: 1,
    age: 3,
    arrived: true,
    checked: true,
    listed: true,
    replenish: 1,
    notes: "Relisted under existing SKU",
    mp: {
      ebay: { price: 249.99, status: "live" },
      onbuy: { price: 249.99, status: "live" },
    },
  },

  // Phones
  {
    id: "s23",
    batch_id: "b6",
    item: "iPhone 17 Pro Max 256GB Silver",
    pf: "P353",
    qty: 1,
    age: 8,
    arrived: true,
    checked: true,
    listed: true,
    done: true,
    cond: "Fully working, perfect condition",
    sku: "APPL-IPH-17-PRO-MAX-256-SILV-P353",
    mp: {
      ebay: { price: 849, status: "live" },
      backmarket: { price: 849, status: "live" },
    },
  },
  {
    id: "s24",
    batch_id: "b6",
    item: "iPhone 15 Pro 256GB Silver",
    pf: "P354",
    qty: 1,
    age: 8,
    arrived: true,
    checked: true,
    listed: true,
    cond: "Very good condition",
    sku: "APPL-IPH-15-PRO-256-SILV-P354",
    mp: {
      ebay: { price: 549, status: "live" },
      backmarket: { price: 549, status: "in_progress" },
    },
  },
  {
    id: "s25",
    batch_id: "b6",
    item: "Samsung S24 Ultra 256GB Silver",
    pf: "F185",
    qty: 1,
    age: 8,
    arrived: true,
    checked: true,
    listed: false,
    cond: "Good condition, minor scratches on screen",
    notes: "Rear camera module not working",
    mp: {
      ebay: {
        price: 459,
        status: "blocked",
        blocked_reason: "Waiting for price confirmation",
      },
    },
  },
  {
    id: "s26",
    batch_id: "b6",
    item: "iPhone 14 Pro 256GB Gold",
    pf: "P248",
    qty: 1,
    age: 8,
    arrived: true,
    checked: true,
    cond: "Working, Good condition",
    mp: {
      ebay: { price: 409, status: "not_started" },
      backmarket: { price: 409, status: "not_started" },
    },
  },
  {
    id: "s27",
    batch_id: "b6",
    item: "iPhone 14 Pro Max 128GB Gold",
    pf: "P249",
    qty: 1,
    age: 8,
    arrived: true,
    checked: true,
    cond: "Working, Good condition",
    notes: "Battery issue to investigate",
    mp: {
      ebay: { price: 389, status: "not_started" },
      backmarket: { price: 389, status: "not_started" },
    },
  },
];

export const stock: Stock[] = rows.map((r) => {
  const age = r.age ?? 10;
  return {
    id: r.id,
    batch_id: r.batch_id,
    item: r.item,
    identifier_1: r.id1 ?? "",
    identifier_2: r.id2 ?? "",
    qty: r.qty ?? 1,
    sku: r.sku ?? "",
    location: r.loc ?? "",
    condition: r.cond ?? "New",
    vat_percent: r.vat ?? 20,
    notes: r.notes ?? "",
    pf_number: r.pf ?? null,
    priority: r.pri ?? "normal",
    is_replenishment: r.replenish ?? 0,
    blocked: 0,
    blocked_reason: null,
    recorded_at: now - age * DAY,
    arrived_at: r.arrived ? now - (age - 1) * DAY : null,
    checked_at: r.checked ? now - (age - 2) * DAY : null,
    listed_at: r.listed ? now - (age - 3) * DAY : null,
    completed_at: r.done ? now - (age - 4) * DAY : null,
    created_by: "AJ",
    updated_by: "AJ",
    updated_at: now,
    marketplaces: buildMarketplaces(r.mp ?? {}, age),
  };
});
