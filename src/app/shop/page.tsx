"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/lib/products";
import { useCart } from "./cart-context";

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const { addItem } = useCart();
  const [addedId, setAddedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data: Product[]) => {
        setProducts(data);
        setLoading(false);
      });
  }, []);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(products.map((p) => p.category)))],
    [products]
  );

  const filtered = products.filter((p) => {
    const matchesQuery =
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.description.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = category === "All" || p.category === category;
    return matchesQuery && matchesCategory;
  });

  function handleAdd(product: Product) {
    addItem(product);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1200);
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Browse products</h1>
        <p className="text-muted mt-1">
          Find something you love from our catalog.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products…"
          className="flex-1 rounded-lg border border-line bg-surface px-4 py-2.5 text-sm outline-none focus:border-fuchsia-500"
        />
        <div className="flex gap-2 flex-wrap">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full px-4 py-2 text-sm transition ${
                category === c
                  ? "bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/50"
                  : "border border-line bg-surface text-muted hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-muted text-sm">Loading products…</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted text-sm">No products match your search.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="group rounded-2xl border border-line bg-surface overflow-hidden flex flex-col transition hover:border-fuchsia-500/50"
            >
              <Link
                href={`/shop/products/${p.id}`}
                className="flex items-center justify-center h-40 bg-surface-2 text-6xl transition group-hover:scale-105"
              >
                {p.emoji}
              </Link>
              <div className="p-5 flex-1 flex flex-col">
                <div className="text-xs text-fuchsia-400 mb-1">
                  {p.category}
                </div>
                <Link
                  href={`/shop/products/${p.id}`}
                  className="font-semibold hover:text-fuchsia-300 transition"
                >
                  {p.name}
                </Link>
                <p className="text-sm text-muted mt-1 line-clamp-2 flex-1">
                  {p.description}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-lg font-semibold">
                    ${p.price.toFixed(2)}
                  </span>
                  {p.stock === 0 ? (
                    <span className="text-xs text-red-400 font-medium">
                      Out of stock
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAdd(p)}
                      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                        addedId === p.id
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-fuchsia-600 hover:bg-fuchsia-500 text-white"
                      }`}
                    >
                      {addedId === p.id ? "Added ✓" : "Add to cart"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
