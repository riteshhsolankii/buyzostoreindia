"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "../../cart-context";

const ctaClass =
  "rounded-lg bg-brand-gradient px-6 py-2.5 text-sm font-bold text-black transition hover:brightness-110";

export default function CartPage() {
  const { items, total, setQuantity, removeItem, clear } = useCart();
  const [placed, setPlaced] = useState(false);

  function handleCheckout() {
    clear();
    setPlaced(true);
  }

  if (placed) {
    return (
      <div className="animate-scale-in py-20 text-center">
        <p className="mb-4 text-5xl">🎉</p>
        <h1 className="mb-2 text-2xl font-bold">Order placed!</h1>
        <p className="text-muted mb-6">
          Thanks for shopping with Buyzo. This is a demo — no payment was
          taken.
        </p>
        <Link href="/shop" className={ctaClass}>
          Continue shopping
        </Link>
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
                ${product.price.toFixed(2)} each
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
            <div className="w-20 text-right font-semibold">
              ${(product.price * quantity).toFixed(2)}
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

      <div className="mt-6 flex items-center justify-between rounded-2xl border border-accent/30 bg-surface px-5 py-4">
        <span className="text-muted">Total</span>
        <span className="text-brand-gradient text-2xl font-extrabold">
          ${total.toFixed(2)}
        </span>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={clear}
          className="rounded-lg border border-line px-4 py-2.5 text-sm text-muted transition hover:bg-surface-2 hover:text-foreground"
        >
          Clear cart
        </button>
        <button onClick={handleCheckout} className={ctaClass}>
          Checkout
        </button>
      </div>
    </div>
  );
}
