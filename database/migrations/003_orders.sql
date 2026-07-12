-- Customer orders and their fulfilment lifecycle.
-- Status flow: placed -> accepted -> shipped -> delivered  (or -> cancelled).
-- Line items and the delivery address are snapshotted as JSON so an order keeps
-- its historical values even if the product or the customer's address changes.
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'placed'
    CHECK(status IN ('placed', 'accepted', 'shipped', 'delivered', 'cancelled')),
  items_json TEXT NOT NULL CHECK(json_valid(items_json)),
  subtotal_cents INTEGER NOT NULL CHECK(subtotal_cents >= 0),
  total_cents INTEGER NOT NULL CHECK(total_cents >= 0),
  address_json TEXT NOT NULL CHECK(json_valid(address_json)),
  note TEXT,
  delivery_days INTEGER CHECK(delivery_days IS NULL OR delivery_days >= 0),
  estimated_delivery TEXT,
  placed_at TEXT NOT NULL,
  accepted_at TEXT,
  shipped_at TEXT,
  delivered_at TEXT,
  cancelled_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) STRICT;

CREATE INDEX IF NOT EXISTS orders_customer_id_idx ON orders(customer_id);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);
CREATE INDEX IF NOT EXISTS orders_placed_at_idx ON orders(placed_at);
