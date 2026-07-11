"use client";

import Image from "next/image";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import type { Product } from "@/lib/products";
import { useCart } from "../../../cart-context";

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
        <p className="mb-4 text-4xl">🕳️</p>
        <h1 className="mb-2 text-xl font-semibold">Product not found</h1>
        <Link href="/shop" className="text-accent hover:underline">
          ← Back to shop
        </Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mt-6 grid grid-cols-1 gap-10 md:grid-cols-2">
        <div className="h-96 animate-pulse rounded-2xl border border-line bg-surface" />
        <div className="space-y-4">
          <div className="h-6 w-24 animate-pulse rounded bg-surface-2" />
          <div className="h-10 w-3/4 animate-pulse rounded bg-surface-2" />
          <div className="h-20 animate-pulse rounded bg-surface-2" />
        </div>
      </div>
    );
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
        className="text-sm text-muted transition hover:text-accent"
      >
        ← Back to products
      </Link>

      <div className="mt-6 grid grid-cols-1 gap-10 md:grid-cols-2">
        <div className="animate-scale-in relative h-96 overflow-hidden rounded-3xl border border-line bg-surface-2">
          <Image
            src={product.image}
            alt={product.name}
            fill
            unoptimized
            className="object-cover"
          />
        </div>

        <div className="animate-fade-up flex flex-col">
          <div className="mb-2 text-xs font-bold tracking-[0.2em] text-accent">
            {product.category.toUpperCase()}
          </div>
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="text-muted mt-4 leading-relaxed">
            {product.description}
          </p>

          <div className="mt-6 text-3xl font-extrabold">
            <span className="text-brand-gradient">
              ${product.price.toFixed(2)}
            </span>
          </div>

          <div className="mt-2 text-sm">
            {product.stock === 0 ? (
              <span className="text-danger">Out of stock</span>
            ) : product.stock < 10 ? (
              <span className="text-warning">
                Only {product.stock} left in stock
              </span>
            ) : (
              <span className="text-success">In stock</span>
            )}
          </div>

          {product.stock > 0 && (
            <div className="mt-8 flex items-center gap-4">
              <div className="flex items-center rounded-lg border border-line bg-surface">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3.5 py-2.5 text-muted transition hover:text-accent"
                >
                  −
                </button>
                <span className="w-10 text-center text-sm font-semibold">
                  {quantity}
                </span>
                <button
                  onClick={() =>
                    setQuantity((q) => Math.min(product.stock, q + 1))
                  }
                  className="px-3.5 py-2.5 text-muted transition hover:text-accent"
                >
                  +
                </button>
              </div>
              <button
                onClick={handleAdd}
                className={`flex-1 rounded-lg px-5 py-3 text-sm font-bold transition-all duration-200 ${
                  added
                    ? "bg-success/20 text-success"
                    : "bg-brand-gradient text-black hover:brightness-110 active:scale-[0.98]"
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
