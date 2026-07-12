"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatINR, type Order } from "@/lib/types";
import { useCart } from "../../cart-context";
import { useCustomer } from "../../customer-context";
import { AuthModal } from "../../auth-modal";

const ctaClass =
  "rounded-lg bg-brand-gradient px-6 py-2.5 text-sm font-bold transition hover:brightness-110";

export default function CartPage() {
  const { items, total, setQuantity, removeItem, clear } = useCart();
  const { customer } = useCustomer();
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [addressError, setAddressError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  const addresses = customer?.addresses ?? [];

  // Preselect the default (or first) address once the profile loads.
  useEffect(() => {
    if (!selectedAddressId && addresses.length > 0) {
      const preferred = addresses.find((a) => a.isDefault) ?? addresses[0];
      setSelectedAddressId(preferred.id);
    }
  }, [addresses, selectedAddressId]);

  async function handleCheckout() {
    if (!customer) {
      setShowAuthModal(true);
      return;
    }
    const address = addresses.find((a) => a.id === selectedAddressId);
    if (!address) {
      setAddressError(true);
      return;
    }
    setSubmitting(true);
    setOrderError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addressId: address.id,
          items: items.map((i) => ({
            productId: i.product.id,
            quantity: i.quantity,
          })),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setOrderError(data?.error ?? "Could not place your order. Try again.");
        return;
      }
      setPlacedOrder(data as Order);
      clear();
    } finally {
      setSubmitting(false);
    }
  }

  if (placedOrder) {
    const address = placedOrder.address;
    return (
      <div className="animate-scale-in mx-auto max-w-md py-16 text-center">
        <p className="mb-4 text-5xl">🎉</p>
        <h1 className="mb-2 text-2xl font-bold">Order placed!</h1>
        <p className="text-muted mb-2">
          Thanks for shopping with Buyzo. Your order is now with our team.
        </p>
        <p className="mb-6 text-sm">
          Order ID{" "}
          <span className="rounded-md bg-surface-2 px-2 py-0.5 font-mono font-semibold text-accent">
            {placedOrder.id}
          </span>
        </p>
        <div className="mb-8 rounded-2xl border border-line bg-surface p-5 text-left">
          <div className="flex items-center justify-between">
            <span className="text-muted text-sm">Total paid</span>
            <span className="text-brand-gradient text-lg font-extrabold">
              {formatINR(placedOrder.total)}
            </span>
          </div>
          <div className="mt-4 border-t border-line pt-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
              Delivering to
            </p>
            <p className="mt-2 text-sm font-semibold">
              {address.name} · {address.label}
            </p>
            <p className="mt-1 text-sm leading-6 text-muted">
              {address.line1}
              {address.line2 ? `, ${address.line2}` : ""}
              <br />
              {address.city}, {address.state} — {address.pincode}
              <br />
              📞 {address.phone}
            </p>
          </div>
        </div>
        <div className="flex justify-center gap-3">
          <Link
            href="/shop/account/orders"
            className={ctaClass}
          >
            Track my order
          </Link>
          <Link
            href="/shop"
            className="rounded-lg border border-line px-6 py-2.5 text-sm font-bold text-muted transition hover:bg-surface-2 hover:text-foreground"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="animate-fade-up py-20 text-center">
        <p className="mb-4 text-5xl">🛒</p>
        <h1 className="mb-2 text-2xl font-bold">Your cart is empty</h1>
        <p className="text-muted mb-6">
          Browse the catalog and add something you like.
        </p>
        <Link href="/shop" className={ctaClass}>
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-8 text-2xl font-bold">Your cart</h1>

      <div className="divide-y divide-line rounded-2xl border border-line bg-surface">
        {items.map(({ product, quantity }, i) => (
          <div
            key={product.id}
            className="animate-fade-up flex items-center gap-4 px-5 py-4"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg border border-line bg-surface-2">
              <Image
                src={product.image}
                alt={product.name}
                fill
                unoptimized
                className="object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <Link
                href={`/shop/products/${product.id}`}
                className="font-medium transition hover:text-accent"
              >
                {product.name}
              </Link>
              <div className="text-sm text-muted">
                {formatINR(product.price)} each
              </div>
            </div>
            <div className="flex items-center rounded-lg border border-line bg-surface-2">
              <button
                onClick={() => setQuantity(product.id, quantity - 1)}
                className="px-3 py-1.5 text-muted transition hover:text-accent"
              >
                −
              </button>
              <span className="w-8 text-center text-sm">{quantity}</span>
              <button
                onClick={() => setQuantity(product.id, quantity + 1)}
                className="px-3 py-1.5 text-muted transition hover:text-accent"
              >
                +
              </button>
            </div>
            <div className="w-24 text-right font-semibold">
              {formatINR(product.price * quantity)}
            </div>
            <button
              onClick={() => removeItem(product.id)}
              className="text-muted transition hover:text-danger"
              aria-label={`Remove ${product.name}`}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Delivery address */}
      {customer && (
        <div className="mt-6 rounded-2xl border border-line bg-surface p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-muted">
              Delivery address
            </h2>
            <Link
              href="/shop/account"
              className="text-xs font-semibold text-accent transition hover:underline"
            >
              Manage addresses →
            </Link>
          </div>

          {addresses.length === 0 ? (
            <div
              className={`rounded-xl border border-dashed px-4 py-5 text-center text-sm ${
                addressError ? "border-danger/60 text-danger" : "border-line text-muted"
              }`}
            >
              No saved address.{" "}
              <Link href="/shop/account" className="font-semibold text-accent hover:underline">
                Add a delivery address
              </Link>{" "}
              to place your order.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {addresses.map((address) => (
                <label
                  key={address.id}
                  className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition ${
                    selectedAddressId === address.id
                      ? "border-accent bg-accent/5"
                      : "border-line hover:border-accent/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="delivery-address"
                    checked={selectedAddressId === address.id}
                    onChange={() => {
                      setSelectedAddressId(address.id);
                      setAddressError(false);
                    }}
                    className="mt-0.5 accent-[var(--accent)]"
                  />
                  <span className="min-w-0 text-sm">
                    <span className="flex items-center gap-2 font-bold">
                      {address.label}
                      {address.isDefault && (
                        <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent">
                          DEFAULT
                        </span>
                      )}
                    </span>
                    <span className="mt-1 block font-medium">{address.name}</span>
                    <span className="mt-0.5 block leading-6 text-muted">
                      {address.line1}
                      {address.line2 ? `, ${address.line2}` : ""}, {address.city},{" "}
                      {address.state} — {address.pincode}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-6 flex items-center justify-between rounded-2xl border border-accent/30 bg-surface px-5 py-4">
        <span className="text-muted">Total</span>
        <span className="text-brand-gradient text-2xl font-extrabold">
          {formatINR(total)}
        </span>
      </div>

      {orderError && (
        <p className="animate-fade-in mt-4 rounded-lg border border-danger/40 bg-danger/10 px-4 py-2.5 text-right text-sm text-danger">
          {orderError}
        </p>
      )}

      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={clear}
          disabled={submitting}
          className="rounded-lg border border-line px-4 py-2.5 text-sm text-muted transition hover:bg-surface-2 hover:text-foreground disabled:opacity-50"
        >
          Clear cart
        </button>
        <button
          onClick={handleCheckout}
          disabled={submitting}
          className={`${ctaClass} disabled:cursor-not-allowed disabled:opacity-60`}
        >
          {submitting ? "Placing order…" : "Checkout"}
        </button>
      </div>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
}
