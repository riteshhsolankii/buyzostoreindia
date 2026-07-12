import { getDatabase, transaction } from "./database";
import type { Address, Order, OrderItem, OrderStatus } from "./types";

export type { Order, OrderItem, OrderStatus } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

type OrderRow = {
  id: string;
  customer_id: string;
  status: OrderStatus;
  items_json: string;
  subtotal_cents: number;
  total_cents: number;
  address_json: string;
  note: string | null;
  delivery_days: number | null;
  estimated_delivery: string | null;
  placed_at: string;
  accepted_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
};

function toOrder(row: OrderRow): Order {
  const order: Order = {
    id: row.id,
    customerId: row.customer_id,
    status: row.status,
    items: JSON.parse(row.items_json) as OrderItem[],
    subtotal: row.subtotal_cents / 100,
    total: row.total_cents / 100,
    address: JSON.parse(row.address_json) as Address,
    placedAt: row.placed_at,
  };
  if (row.note) order.note = row.note;
  if (row.delivery_days !== null) order.deliveryDays = row.delivery_days;
  if (row.estimated_delivery) order.estimatedDelivery = row.estimated_delivery;
  if (row.accepted_at) order.acceptedAt = row.accepted_at;
  if (row.shipped_at) order.shippedAt = row.shipped_at;
  if (row.delivered_at) order.deliveredAt = row.delivered_at;
  if (row.cancelled_at) order.cancelledAt = row.cancelled_at;
  return order;
}

const SELECT = "SELECT * FROM orders";

export type OrderResult =
  | { ok: true; order: Order }
  | { ok: false; error: string; status: number };

/**
 * Place an order for a customer. Prices are re-read from the catalog (never
 * trusted from the client) and stock is decremented atomically. The delivery
 * address is snapshotted so it stays fixed for this order.
 */
export function createOrder(input: {
  customerId: string;
  items: { productId: string; quantity: number }[];
  address: Address;
  note?: string;
}): OrderResult {
  if (input.items.length === 0) {
    return { ok: false, error: "Your cart is empty.", status: 400 };
  }

  const db = getDatabase();
  const getProductRow = db.prepare(
    "SELECT id, name, image, price_cents, stock FROM products WHERE id = ?"
  );
  const decrementStock = db.prepare(
    "UPDATE products SET stock = stock - ?, updated_at = ? WHERE id = ?"
  );

  try {
    const order = transaction(() => {
      const now = new Date().toISOString();
      const lineItems: OrderItem[] = [];
      let subtotalCents = 0;

      for (const requested of input.items) {
        const quantity = Math.max(1, Math.trunc(requested.quantity));
        const product = getProductRow.get(requested.productId) as
          | { id: string; name: string; image: string; price_cents: number; stock: number }
          | undefined;
        if (!product) {
          throw new OrderError(`A product in your cart is no longer available.`, 409);
        }
        if (product.stock < quantity) {
          throw new OrderError(
            `Only ${product.stock} left of "${product.name}".`,
            409
          );
        }
        decrementStock.run(quantity, now, product.id);
        subtotalCents += product.price_cents * quantity;
        lineItems.push({
          productId: product.id,
          name: product.name,
          image: product.image,
          price: product.price_cents / 100,
          quantity,
        });
      }

      const id = `ord-${crypto.randomUUID().slice(0, 8)}`;
      db.prepare(
        `INSERT INTO orders (
           id, customer_id, status, items_json, subtotal_cents, total_cents,
           address_json, note, placed_at, created_at, updated_at
         ) VALUES (
           @id, @customerId, 'placed', @itemsJson, @subtotalCents, @totalCents,
           @addressJson, @note, @now, @now, @now
         )`
      ).run({
        id,
        customerId: input.customerId,
        itemsJson: JSON.stringify(lineItems),
        subtotalCents,
        totalCents: subtotalCents,
        addressJson: JSON.stringify(input.address),
        note: input.note?.trim() || null,
        now,
      });

      return getOrder(id)!;
    });
    return { ok: true, order };
  } catch (err) {
    if (err instanceof OrderError) {
      return { ok: false, error: err.message, status: err.httpStatus };
    }
    throw err;
  }
}

class OrderError extends Error {
  constructor(message: string, readonly httpStatus: number) {
    super(message);
  }
}

export function listOrders(): Order[] {
  const rows = getDatabase()
    .prepare(`${SELECT} ORDER BY placed_at DESC`)
    .all() as OrderRow[];
  return rows.map(toOrder);
}

export function listCustomerOrders(customerId: string): Order[] {
  const rows = getDatabase()
    .prepare(`${SELECT} WHERE customer_id = ? ORDER BY placed_at DESC`)
    .all(customerId) as OrderRow[];
  return rows.map(toOrder);
}

export function getOrder(id: string): Order | undefined {
  const row = getDatabase().prepare(`${SELECT} WHERE id = ?`).get(id) as
    | OrderRow
    | undefined;
  return row ? toOrder(row) : undefined;
}

export function getCustomerOrder(
  id: string,
  customerId: string
): Order | undefined {
  const order = getOrder(id);
  return order && order.customerId === customerId ? order : undefined;
}

// --- Admin lifecycle transitions -------------------------------------------

/** Accept a placed order and promise a delivery window (in days). */
export function acceptOrder(id: string, deliveryDays: number): OrderResult {
  const order = getOrder(id);
  if (!order) return notFound();
  if (order.status !== "placed") {
    return { ok: false, error: "Only placed orders can be accepted.", status: 409 };
  }
  const days = Math.max(0, Math.trunc(deliveryDays));
  const now = new Date();
  const eta = new Date(now.getTime() + days * DAY_MS).toISOString();
  getDatabase()
    .prepare(
      `UPDATE orders SET status = 'accepted', accepted_at = ?, delivery_days = ?,
         estimated_delivery = ?, updated_at = ? WHERE id = ?`
    )
    .run(now.toISOString(), days, eta, now.toISOString(), id);
  return { ok: true, order: getOrder(id)! };
}

export function shipOrder(id: string): OrderResult {
  const order = getOrder(id);
  if (!order) return notFound();
  if (order.status !== "accepted") {
    return { ok: false, error: "Only accepted orders can be shipped.", status: 409 };
  }
  const now = new Date().toISOString();
  getDatabase()
    .prepare("UPDATE orders SET status = 'shipped', shipped_at = ?, updated_at = ? WHERE id = ?")
    .run(now, now, id);
  return { ok: true, order: getOrder(id)! };
}

export function deliverOrder(id: string): OrderResult {
  const order = getOrder(id);
  if (!order) return notFound();
  if (order.status !== "shipped") {
    return { ok: false, error: "Only shipped orders can be delivered.", status: 409 };
  }
  const now = new Date().toISOString();
  getDatabase()
    .prepare("UPDATE orders SET status = 'delivered', delivered_at = ?, updated_at = ? WHERE id = ?")
    .run(now, now, id);
  return { ok: true, order: getOrder(id)! };
}

/** Cancel an order that hasn't been delivered yet, returning stock to catalog. */
export function cancelOrder(id: string): OrderResult {
  const order = getOrder(id);
  if (!order) return notFound();
  if (order.status === "delivered" || order.status === "cancelled") {
    return {
      ok: false,
      error: "This order can no longer be cancelled.",
      status: 409,
    };
  }
  const db = getDatabase();
  const now = new Date().toISOString();
  transaction(() => {
    const restock = db.prepare(
      "UPDATE products SET stock = stock + ?, updated_at = ? WHERE id = ?"
    );
    for (const item of order.items) {
      restock.run(item.quantity, now, item.productId);
    }
    db.prepare(
      "UPDATE orders SET status = 'cancelled', cancelled_at = ?, updated_at = ? WHERE id = ?"
    ).run(now, now, id);
  });
  return { ok: true, order: getOrder(id)! };
}

function notFound(): OrderResult {
  return { ok: false, error: "Order not found.", status: 404 };
}
