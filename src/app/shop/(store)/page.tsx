"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Product } from "@/lib/products";
import { useCart } from "../cart-context";
import { HeroBanner } from "../hero-banner";

function ShopPageContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const cat = searchParams.get("cat") ?? "All";
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(q);
  const [category, setCategory] = useState(cat);
  const { addItem } = useCart();
  const [addedId, setAddedId] = useState<string | null>(null);

  useEffect(() => setQuery(q), [q]);
  useEffect(() => setCategory(cat), [cat]);

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
      <div className="mb-12">
        <HeroBanner />
      </div>

      <div className="mb-8 flex items-end justify-between">
        <div className="animate-fade-up">
          <span className="text-xs font-bold tracking-[0.2em] text-accent">
            OUR CATALOG
          </span>
          <h1 className="mt-1 text-3xl font-bold">Browse products</h1>
          <p className="text-muted mt-1">
            Find something you love from our catalog.
          </p>
        </div>
      </div>

      <div className="mb-8 flex flex-col gap-3 sm:flex-row">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products…"
          className="flex-1 rounded-lg border border-line bg-surface px-4 py-2.5 text-sm outline-none transition focus:border-accent"
        />
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full px-4 py-2 text-sm transition-all duration-200 ${
                category === c
                  ? "bg-accent font-semibold text-black shadow-lg shadow-accent/20"
                  : "border border-line bg-surface text-muted hover:border-accent/40 hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-80 animate-pulse rounded-2xl border border-line bg-surface"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-muted text-sm">No products match your search.</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p, i) => (
            <div
              key={p.id}
              className="group animate-fade-up flex flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-xl hover:shadow-accent/10"
              style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
            >
              <Link
                href={`/shop/products/${p.id}`}
                className="relative h-48 overflow-hidden bg-surface-2"
              >
                <Image
                  src={p.image}
                  alt={p.name}
                  fill
                  unoptimized
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {p.stock === 0 && (
                  <span className="absolute left-3 top-3 rounded-full bg-danger/90 px-3 py-1 text-[11px] font-bold text-white">
                    SOLD OUT
                  </span>
                )}
                {p.stock > 0 && p.stock < 10 && (
                  <span className="absolute left-3 top-3 rounded-full bg-brand-gradient px-3 py-1 text-[11px] font-bold text-black">
                    ONLY {p.stock} LEFT
                  </span>
                )}
              </Link>
              <div className="flex flex-1 flex-col p-5">
                <div className="mb-1 text-xs font-semibold tracking-wide text-accent">
                  {p.category}
                </div>
                <Link
                  href={`/shop/products/${p.id}`}
                  className="font-semibold transition hover:text-accent"
                >
                  {p.name}
                </Link>
                <p className="text-muted mt-1 line-clamp-2 flex-1 text-sm">
                  {p.description}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-lg font-bold">
                    ${p.price.toFixed(2)}
                  </span>
                  {p.stock === 0 ? (
                    <span className="text-danger text-xs font-medium">
                      Out of stock
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAdd(p)}
                      className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-all duration-200 ${
                        addedId === p.id
                          ? "bg-success/20 text-success"
                          : "bg-brand-gradient text-black hover:brightness-110 active:scale-95"
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

export default function ShopPage() {
  return (
    <Suspense>
      <ShopPageContent />
    </Suspense>
  );
}
