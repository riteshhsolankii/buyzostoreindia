"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import type { Product } from "@/lib/products";
import { useCart } from "../../cart-context";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    fetch(`/api/products/${id}`).then(async (res) => {
      if (!res.ok) {
        setNotFound(true);
        return;
      }
      setProduct(await res.json());
    });
  }, [id]);

  if (notFound) {
    return (
      <div className="py-20 text-center">
        <p className="text-4xl mb-4">🕳️</p>
        <h1 className="text-xl font-semibold mb-2">Product not found</h1>
        <Link href="/shop" className="text-fuchsia-400 hover:text-fuchsia-300">
          ← Back to shop
        </Link>
      </div>
    );
  }

  if (!product) {
    return <p className="text-muted text-sm">Loading product…</p>;
  }

  function handleAdd() {
    if (!product) return;
    addItem(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div>
      <Link
        href="/shop"
        className="text-sm text-muted hover:text-foreground transition"
      >
        ← Back to products
      </Link>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="flex items-center justify-center rounded-2xl border border-line bg-surface h-80 text-9xl">
          {product.emoji}
        </div>

        <div className="flex flex-col">
          <div className="text-sm text-fuchsia-400 mb-2">
            {product.category}
          </div>
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="mt-4 text-muted leading-relaxed">
            {product.description}
          </p>

          <div className="mt-6 text-3xl font-semibold">
            ${product.price.toFixed(2)}
          </div>

          <div className="mt-2 text-sm">
            {product.stock === 0 ? (
              <span className="text-red-400">Out of stock</span>
            ) : product.stock < 10 ? (
              <span className="text-amber-400">
                Only {product.stock} left in stock
              </span>
            ) : (
              <span className="text-emerald-400">In stock</span>
            )}
          </div>

          {product.stock > 0 && (
            <div className="mt-8 flex items-center gap-4">
              <div className="flex items-center rounded-lg border border-line bg-surface">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3 py-2 text-muted hover:text-foreground transition"
                >
                  −
                </button>
                <span className="w-10 text-center text-sm">{quantity}</span>
                <button
                  onClick={() =>
                    setQuantity((q) => Math.min(product.stock, q + 1))
                  }
                  className="px-3 py-2 text-muted hover:text-foreground transition"
                >
                  +
                </button>
              </div>
              <button
                onClick={handleAdd}
                className={`flex-1 rounded-lg px-5 py-2.5 text-sm font-medium transition ${
                  added
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-fuchsia-600 hover:bg-fuchsia-500 text-white"
                }`}
              >
                {added ? "Added to cart ✓" : "Add to cart"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
