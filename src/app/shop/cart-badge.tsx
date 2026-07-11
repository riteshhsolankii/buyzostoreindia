"use client";

import Link from "next/link";
import { useCart } from "./cart-context";

export function CartBadge() {
  const { count } = useCart();

  return (
    <Link
      href="/shop/cart"
      className="relative flex items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-sm hover:border-fuchsia-500/60 transition"
    >
      🛒 Cart
      {count > 0 && (
        <span className="rounded-full bg-fuchsia-500 px-2 py-0.5 text-xs font-semibold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
