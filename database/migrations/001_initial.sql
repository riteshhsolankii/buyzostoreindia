-- Buyzo's first relational SQLite schema.
CREATE TABLE IF NOT EXISTS app_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL CHECK(length(trim(name)) > 0),
  name_key TEXT NOT NULL UNIQUE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL CHECK(length(trim(name)) > 0),
  description TEXT NOT NULL,
  price_cents INTEGER NOT NULL CHECK(price_cents >= 0),
  category_id TEXT NOT NULL,
  stock INTEGER NOT NULL CHECK(stock >= 0),
  emoji TEXT NOT NULL,
  image TEXT NOT NULL,
  slug TEXT,
  brand TEXT,
  sku TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK(status IN ('draft', 'active', 'out-of-stock', 'archived')),
  extras_json TEXT CHECK(extras_json IS NULL OR json_valid(extras_json)),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (category_id) REFERENCES categories(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) STRICT;

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL CHECK(length(trim(name)) > 0),
  email TEXT NOT NULL COLLATE NOCASE UNIQUE,
  phone TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  password_algorithm TEXT NOT NULL DEFAULT 'scrypt'
    CHECK(password_algorithm IN ('legacy-sha256', 'scrypt')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;

CREATE TABLE IF NOT EXISTS email_outbox (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  text TEXT NOT NULL,
  sent_at TEXT NOT NULL,
  delivered INTEGER NOT NULL DEFAULT 0 CHECK(delivered IN (0, 1))
) STRICT;

CREATE INDEX IF NOT EXISTS categories_position_idx ON categories(position);
CREATE INDEX IF NOT EXISTS products_category_id_idx ON products(category_id);
CREATE INDEX IF NOT EXISTS products_status_idx ON products(status);
CREATE INDEX IF NOT EXISTS products_display_order_idx ON products(display_order);
CREATE INDEX IF NOT EXISTS email_outbox_sent_at_idx ON email_outbox(sent_at);
