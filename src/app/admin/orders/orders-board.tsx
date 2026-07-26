"use client";

import { useMemo, useState } from "react";
import {
  formatINR,
  ORDER_STATUS_LABEL,
  type Order,
  type OrderStatus,
} from "@/lib/types";
import { useToast } from "../../toast-context";

const STATUS_STYLE: Record<OrderStatus, string> = {
  placed: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  accepted: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  shipped: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  delivered: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  cancelled: "bg-red-500/15 text-red-400 border-red-500/30",
};

const FILTERS: ("all" | OrderStatus)[] = [
  "all",
  "placed",
  "accepted",
  "shipped",
  "delivered",
  "cancelled",
];

function fmtDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDay(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function OrdersBoard({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<{ id: string; msg: string } | null>(null);
  const [days, setDays] = useState<Record<string, string>>({});
  const { success, error } = useToast();

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length };
    for (const o of orders) c[o.status] = (c[o.status] ?? 0) + 1;
    return c;
  }, [orders]);

  const visible = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  async function act(id: string, action: string, deliveryDays?: number) {
    setBusyId(id);
    setErrorId(null);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, deliveryDays }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = data?.error ?? "Action failed.";
        setErrorId({ id, msg });
        error(msg, { title: `Order ${id}` });
        return;
      }
      const updated = data as Order;
      setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
      success(`Order ${id} is now ${updated.status}.`, { title: "Order updated" });
    } catch {
      const msg = "Network error — could not reach the server.";
      setErrorId({ id, msg });
      error(msg, { title: `Order ${id}` });
    } finally {
      setBusyId(null);
    }
  }

  if (orders.length === 0) {
    return (
      <div className="animate-fade-up rounded-2xl border border-dashed border-line bg-surface px-6 py-16 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-2xl">
          🛍️
        </div>
        <h2 className="font-semibold">No orders yet</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
          When a customer checks out from the shop, their order shows up here for
          you to accept and track through to delivery.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      {/* Filter tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold capitalize transition ${
              filter === f
                ? "border-accent bg-accent/10 text-accent"
                : "border-line text-muted hover:border-accent/40 hover:text-foreground"
            }`}
          >
            {f === "all" ? "All" : ORDER_STATUS_LABEL[f]}
            <span className="ml-1.5 text-[10px] opacity-70">{counts[f] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {visible.map((order) => (
          <div
            key={order.id}
            className="rounded-2xl border border-line bg-surface p-5"
          >
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-sm font-semibold text-accent">
                    {order.id}
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${STATUS_STYLE[order.status]}`}
                  >
                    {ORDER_STATUS_LABEL[order.status]}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted">
                  Placed {fmtDate(order.placedAt)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-brand-gradient text-lg font-extrabold">
                  {formatINR(order.total)}
                </p>
                <p className="text-xs text-muted">
                  {order.items.reduce((n, i) => n + i.quantity, 0)} item(s)
                </p>
              </div>
            </div>

            {/* Body: items + address */}
            <div className="mt-4 grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-muted">
                  Items
                </p>
                <ul className="space-y-1.5 text-sm">
                  {order.items.map((item) => (
                    <li key={item.productId} className="flex justify-between gap-3">
                      <span className="min-w-0 truncate">
                        {item.name}{" "}
                        <span className="text-muted">× {item.quantity}</span>
                      </span>
                      <span className="shrink-0 text-muted">
                        {formatINR(item.price * item.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-muted">
                  Delivery address
                </p>
                <p className="text-sm font-semibold">
                  {order.address.name} · {order.address.label}
                </p>
                <p className="mt-0.5 text-sm leading-6 text-muted">
                  {order.address.line1}
                  {order.address.line2 ? `, ${order.address.line2}` : ""}
                  <br />
                  {order.address.city}, {order.address.state} — {order.address.pincode}
                  <br />
                  📞 {order.address.phone}
                </p>
                {order.estimatedDelivery && order.status !== "cancelled" && (
                  <p className="mt-2 text-xs font-semibold text-accent">
                    {order.status === "delivered" ? "Delivered" : "Est. delivery"}:{" "}
                    {fmtDay(order.status === "delivered" ? order.deliveredAt : order.estimatedDelivery)}
                    {order.deliveryDays !== undefined && order.status !== "delivered"
                      ? ` (${order.deliveryDays} day${order.deliveryDays === 1 ? "" : "s"})`
                      : ""}
                  </p>
                )}
              </div>
            </div>

            {errorId?.id === order.id && (
              <p className="mt-3 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
                {errorId.msg}
              </p>
            )}

            {/* Actions */}
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
              {order.status === "placed" && (
                <>
                  <div className="flex items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-2 py-1">
                    <label className="text-xs text-muted">Deliver in</label>
                    <input
                      type="number"
                      min={0}
                      max={60}
                      value={days[order.id] ?? "3"}
                      onChange={(e) =>
                        setDays((d) => ({ ...d, [order.id]: e.target.value }))
                      }
                      className="w-14 rounded-md border border-line bg-surface px-2 py-1 text-center text-sm outline-none focus:border-accent"
                    />
                    <span className="text-xs text-muted">days</span>
                  </div>
                  <button
                    onClick={() =>
                      act(order.id, "accept", Number(days[order.id] ?? "3"))
                    }
                    disabled={busyId === order.id}
                    className="rounded-lg bg-brand-gradient px-4 py-2 text-xs font-bold text-on-accent transition hover:brightness-110 disabled:opacity-60"
                  >
                    {busyId === order.id ? "…" : "Accept order"}
                  </button>
                </>
              )}
              {order.status === "accepted" && (
                <button
                  onClick={() => act(order.id, "ship")}
                  disabled={busyId === order.id}
                  className="rounded-lg bg-brand-gradient px-4 py-2 text-xs font-bold text-on-accent transition hover:brightness-110 disabled:opacity-60"
                >
                  {busyId === order.id ? "…" : "🚚 Mark shipped"}
                </button>
              )}
              {order.status === "shipped" && (
                <button
                  onClick={() => act(order.id, "deliver")}
                  disabled={busyId === order.id}
                  className="rounded-lg bg-brand-gradient px-4 py-2 text-xs font-bold text-on-accent transition hover:brightness-110 disabled:opacity-60"
                >
                  {busyId === order.id ? "…" : "📦 Mark delivered"}
                </button>
              )}
              {(order.status === "placed" ||
                order.status === "accepted" ||
                order.status === "shipped") && (
                <button
                  onClick={() => act(order.id, "cancel")}
                  disabled={busyId === order.id}
                  className="rounded-lg border border-line px-4 py-2 text-xs font-semibold text-muted transition hover:border-danger/50 hover:text-danger disabled:opacity-60"
                >
                  Cancel
                </button>
              )}
              {order.status === "delivered" && (
                <span className="text-xs font-semibold text-emerald-400">
                  ✓ Completed — delivered {fmtDate(order.deliveredAt)}
                </span>
              )}
              {order.status === "cancelled" && (
                <span className="text-xs font-semibold text-red-400">
                  ✕ Cancelled {fmtDate(order.cancelledAt)} — stock restored
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
