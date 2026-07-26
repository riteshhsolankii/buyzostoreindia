"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  formatINR,
  ORDER_STAGES,
  ORDER_STATUS_LABEL,
  type Order,
} from "@/lib/types";
import { useCustomer } from "../../customer-context";
import { BuyzoLockup } from "../../site-header";

function fmtDate(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
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

export default function MyOrdersPage() {
  const { customer, checking } = useCustomer();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    if (!customer) return;
    fetch("/api/orders")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setOrders(data as Order[]))
      .catch(() => setOrders([]));
  }, [customer]);

  async function cancel(id: string) {
    setCancelling(id);
    try {
      const res = await fetch(`/api/orders/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        setOrders((prev) =>
          prev ? prev.map((o) => (o.id === id ? (data as Order) : o)) : prev
        );
      }
    } finally {
      setCancelling(null);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <Link href="/shop/account" className="flex items-center gap-2 text-sm text-muted transition hover:text-accent">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M20 12H5m0 0 6-6m-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Account
        </Link>
        <Link href="/shop" className="flex items-center" aria-label="Buyzo — home">
          <BuyzoLockup height={24} />
        </Link>
      </div>

      <h1 className="mb-6 text-2xl font-bold">My orders</h1>

      {checking || (customer && orders === null) ? (
        <div className="h-40 animate-pulse rounded-2xl border border-line bg-surface" />
      ) : !customer ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-16 text-center">
          <p className="mb-4 text-4xl">🔒</p>
          <h2 className="font-semibold">Please sign in</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            Sign in to your account to see your orders and delivery status.
          </p>
          <Link
            href="/shop/account"
            className="mt-5 inline-block rounded-lg bg-brand-gradient px-5 py-2.5 text-sm font-bold transition hover:brightness-110"
          >
            Go to sign in
          </Link>
        </div>
      ) : orders && orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-16 text-center">
          <p className="mb-4 text-4xl">🛍️</p>
          <h2 className="font-semibold">No orders yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            Once you check out, your orders will appear here with live tracking.
          </p>
          <Link
            href="/shop"
            className="mt-5 inline-block rounded-lg bg-brand-gradient px-5 py-2.5 text-sm font-bold transition hover:brightness-110"
          >
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {orders?.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onCancel={() => cancel(order.id)}
              cancelling={cancelling === order.id}
            />
          ))}
        </div>
      )}
    </main>
  );
}

function OrderCard({
  order,
  onCancel,
  cancelling,
}: {
  order: Order;
  onCancel: () => void;
  cancelling: boolean;
}) {
  const cancelled = order.status === "cancelled";
  const currentIndex = ORDER_STAGES.findIndex((s) => s.status === order.status);
  const stageTime: Record<string, string | undefined> = {
    placed: order.placedAt,
    accepted: order.acceptedAt,
    shipped: order.shippedAt,
    delivered: order.deliveredAt,
  };

  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="font-mono text-sm font-semibold text-accent">
            {order.id}
          </span>
          <p className="mt-0.5 text-xs text-muted">Placed {fmtDate(order.placedAt)}</p>
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

      {/* Tracking */}
      {cancelled ? (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400">
          ✕ Order cancelled{order.cancelledAt ? ` on ${fmtDate(order.cancelledAt)}` : ""}
        </div>
      ) : (
        <div className="mt-5">
          <div className="flex items-center">
            {ORDER_STAGES.map((stage, i) => {
              const done = i <= currentIndex;
              const isLast = i === ORDER_STAGES.length - 1;
              return (
                <div key={stage.status} className="flex flex-1 items-center last:flex-none">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm transition ${
                        done
                          ? "border-accent bg-accent/15"
                          : "border-line bg-surface-2 opacity-50"
                      }`}
                    >
                      {stage.emoji}
                    </div>
                    <span
                      className={`mt-1.5 whitespace-nowrap text-[10px] font-semibold ${
                        done ? "text-accent" : "text-muted"
                      }`}
                    >
                      {stage.label}
                    </span>
                    <span className="text-[9px] text-muted">
                      {fmtDate(stageTime[stage.status])}
                    </span>
                  </div>
                  {!isLast && (
                    <div
                      className={`mx-1 h-0.5 flex-1 rounded-full transition ${
                        i < currentIndex ? "bg-accent" : "bg-line"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
          {order.estimatedDelivery && order.status !== "delivered" && (
            <p className="mt-4 rounded-lg bg-accent/10 px-3 py-2 text-center text-xs font-semibold text-accent">
              🚚 Estimated delivery by {fmtDay(order.estimatedDelivery)}
            </p>
          )}
          {order.status === "delivered" && (
            <p className="mt-4 rounded-lg bg-emerald-500/10 px-3 py-2 text-center text-xs font-semibold text-emerald-400">
              ✓ Delivered on {fmtDay(order.deliveredAt)}
            </p>
          )}
          {order.status === "placed" && (
            <p className="mt-4 text-center text-xs text-muted">
              Waiting for the store to accept your order.
            </p>
          )}
        </div>
      )}

      {/* Items */}
      <ul className="mt-5 space-y-1.5 border-t border-line pt-4 text-sm">
        {order.items.map((item) => (
          <li key={item.productId} className="flex justify-between gap-3">
            <span className="min-w-0 truncate">
              {item.name} <span className="text-muted">× {item.quantity}</span>
            </span>
            <span className="shrink-0 text-muted">
              {formatINR(item.price * item.quantity)}
            </span>
          </li>
        ))}
      </ul>

      {/* Address + cancel */}
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-line pt-4">
        <p className="text-xs leading-6 text-muted">
          <span className="font-semibold text-foreground">{order.address.label}</span> ·{" "}
          {order.address.line1}, {order.address.city} — {order.address.pincode}
        </p>
        {(order.status === "placed" || order.status === "accepted") && (
          <button
            onClick={onCancel}
            disabled={cancelling}
            className="rounded-lg border border-line px-3.5 py-1.5 text-xs font-semibold text-muted transition hover:border-danger/50 hover:text-danger disabled:opacity-60"
          >
            {cancelling ? "Cancelling…" : "Cancel order"}
          </button>
        )}
      </div>
    </div>
  );
}
