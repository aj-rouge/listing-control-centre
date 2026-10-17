-- ============================================================
-- batches
-- ============================================================
CREATE TABLE batches (
  id          TEXT    PRIMARY KEY,
  name        TEXT    NOT NULL,
  batch_date  INTEGER NOT NULL,             -- unix ms
  notes       TEXT    NOT NULL DEFAULT '',
  created_by  TEXT    NOT NULL,
  created_at  INTEGER NOT NULL,             -- unix ms
  updated_by  TEXT    NOT NULL,
  updated_at  INTEGER NOT NULL              -- unix ms
);

CREATE INDEX idx_batches_batch_date ON batches(batch_date DESC);

-- ============================================================
-- stock
-- ============================================================
CREATE TABLE stock (
  id                  TEXT    PRIMARY KEY,
  batch_id            TEXT    NOT NULL REFERENCES batches(id) ON DELETE CASCADE,

  item                TEXT    NOT NULL,
  identifier_1        TEXT    NOT NULL DEFAULT '',
  identifier_2        TEXT    NOT NULL DEFAULT '',
  qty                 INTEGER NOT NULL DEFAULT 1 CHECK (qty >= 0),
  sku                 TEXT    NOT NULL DEFAULT '',
  location            TEXT    NOT NULL DEFAULT '',
  condition           TEXT    NOT NULL DEFAULT 'New',
  vat_percent         REAL,
  notes               TEXT    NOT NULL DEFAULT '',
  pf_number           TEXT,
  priority            TEXT    NOT NULL DEFAULT 'normal'
                        CHECK (priority IN ('urgent','normal','low')),
  is_replenishment    INTEGER NOT NULL DEFAULT 0 CHECK (is_replenishment IN (0,1)),

  blocked             INTEGER NOT NULL DEFAULT 0 CHECK (blocked IN (0,1)),
  blocked_reason      TEXT,

  -- lifecycle timestamps (unix ms)
  recorded_at         INTEGER NOT NULL,
  arrived_at          INTEGER,
  checked_at          INTEGER,
  listed_at           INTEGER,
  completed_at        INTEGER,

  -- misc
  stock_date          INTEGER,
  expected_arrival_at INTEGER,
  volume              TEXT,

  created_by          TEXT    NOT NULL,
  updated_by          TEXT    NOT NULL,
  updated_at          INTEGER NOT NULL
);

-- filters / sorts used by DashboardStats + ProductsView
CREATE INDEX idx_stock_batch_id      ON stock(batch_id);
CREATE INDEX idx_stock_recorded_at   ON stock(recorded_at DESC);   -- default sort
CREATE INDEX idx_stock_completed_at  ON stock(completed_at);       -- "remaining" filter
CREATE INDEX idx_stock_item          ON stock(item);               -- sort by item
CREATE INDEX idx_stock_qty           ON stock(qty);                -- sort by qty
CREATE INDEX idx_stock_blocked       ON stock(blocked) WHERE blocked = 1; -- partial

-- ============================================================
-- marketplaces  (child of stock)
-- ============================================================
CREATE TABLE marketplaces (
  stock_id       TEXT    NOT NULL REFERENCES stock(id) ON DELETE CASCADE,
  platform       TEXT    NOT NULL
                     CHECK (platform IN
                       ('ebay','amazon','onbuy','tiktok',
                        'backmarket','wowcher','ebay_live')),

  price          REAL,
  required       INTEGER NOT NULL DEFAULT 0 CHECK (required IN (0,1)),
  status         TEXT    NOT NULL DEFAULT 'not_started'
                     CHECK (status IN
                       ('not_required','not_started','in_progress',
                        'live','blocked','error')),
  blocked_reason TEXT,
  published_at   INTEGER,                    -- unix ms
  listing_id     TEXT,

  PRIMARY KEY (stock_id, platform)
);

-- platform-focused filters (e.g. "all live on Amazon")
CREATE INDEX idx_marketplaces_platform_status
  ON marketplaces(platform, status);