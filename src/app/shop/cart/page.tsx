"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "../cart-context";

export default function CartPage() {
  const { items, total, setQuantity, removeItem, clear } = useCart();
  const [placed, setPlaced] = useState(false);

  function handleCheckout() {
    clear();
    setPlaced(true);
  }

  if (placed) {
    return (
      <div className="py-20 text-center">
        <p className="text-5xl mb-4">🎉</p>
        <h1 className="text-2xl font-bold mb-2">Order placed!</h1>
        <p className="text-muted mb-6">
          Thanks for shopping with Buyzo. This is a demo — no payment was
          taken.
        </p>
        <Link
          href="/shop"
          className="rounded-lg bg-fuchsia-600 hover:bg-fuchsia-500 px-5 py-2.5 text-sm font-medium text-white transition"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-5xl mb-4">🛒</p>
        <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
        <p className="text-muted mb-6">
          Browse the catalog and add something you like.
        </p>
        <Link
          href="/shop"
          className="rounded-lg bg-fuchsia-600 hover:bg-fuchsia-500 px-5 py-2.5 text-sm font-medium text-white transition"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Your cart</h1>

      <div className="rounded-xl border border-line bg-surface divide-y divide-line">
        {items.map(({ product, quantity }) => (
          <div key={product.id} className="flex items-center gap-4 px-5 py-4">
            <span className="text-3xl">{product.emoji}</span>
            <div className="flex-1 min-w-0">
              <Link
                href={`/shop/products/${product.id}`}
                className="font-medium hover:text-fuchsia-300 transition"
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
                className="px-3 py-1.5 text-muted hover:text-foreground transition"
              >
                −
              </button>
              <span className="w-8 text-center text-sm">{quantity}</span>
              <button
                onClick={() => setQuantity(product.id, quantity + 1)}
                className="px-3 py-1.5 text-muted hover:text-foreground transition"
              >
                +
              </button>
            </div>
            <div className="w-20 text-right font-medium">
              ${(product.price * quantity).toFixed(2)}
            </div>
            <button
              onClick={() => removeItem(product.id)}
              className="text-muted hover:text-red-400 transition"
              aria-label={`Remove ${product.name}`}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between rounded-xl border border-line bg-surface px-5 py-4">
        <span className="text-muted">Total</span>
        <span className="text-2xl font-bold">${total.toFixed(2)}</span>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={clear}
          className="rounded-lg border border-line px-4 py-2.5 text-sm text-muted hover:text-foreground hover:bg-surface-2 transition"
        >
          Clear cart
        </button>
        <button
          onClick={handleCheckout}
          className="rounded-lg bg-fuchsia-600 hover:bg-fuchsia-500 px-6 py-2.5 text-sm font-medium text-white transition"
        >
          Checkout
        </button>
      </div>
    </div>
  );
}
