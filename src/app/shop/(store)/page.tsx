"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Product } from "@/lib/products";
import { formatINR } from "@/lib/types";
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
  const router = useRouter();
  const { addItem } = useCart();
  const [addedId, setAddedId] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => setQuery(q), [q]);
  useEffect(() => setCategory(cat), [cat]);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data: Product[]) => {
        // Drafts and archived products stay hidden from the storefront.
        setProducts(
          data.filter((p) => {
            const s = p.extras?.status;
            return !s || s === "active" || s === "out-of-stock";
          })
        );
        setLoading(false);
      });
  }, []);

  const groupedProducts = useMemo(() => {
    const filtered = products.filter((p) => {
      const matchesQuery =
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.description.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = category === "All" || p.category === category;
      return matchesQuery && matchesCategory;
    });

    const grouped = new Map<string, Product[]>();
    filtered.forEach((product) => {
      const section = product.category || "General";
      const existing = grouped.get(section) ?? [];
      existing.push(product);
      grouped.set(section, existing);
    });

    return Array.from(grouped.entries()).map(([name, items]) => ({ name, items }));
  }, [category, products, query]);

  function handleAdd(product: Product) {
    const customer = window.localStorage.getItem("buyzo-customer");
    if (!customer) {
      setShowAuthModal(true);
      return;
    }

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

      <div className="mb-8 flex flex-wrap gap-2">
        {["All", ...Array.from(new Set(products.map((p) => p.category)))].map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-full px-4 py-2 text-sm transition-all duration-200 ${
              category === c
                ? "bg-accent font-semibold text-white shadow-lg shadow-accent/20"
                : "border border-line bg-surface text-muted hover:border-accent/40 hover:text-foreground"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mb-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {groupedProducts.flatMap((group) => group.items).slice(0, 6).map((p) => (
          <div key={p.id} className="group overflow-hidden rounded-2xl border border-line bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-xl hover:shadow-accent/10">
            <Link href={`/shop/products/${p.id}`} className="relative block h-56 overflow-hidden bg-surface-2">
              <Image src={p.image} alt={p.name} fill unoptimized className="object-cover transition-transform duration-500 group-hover:scale-105" />
            </Link>
            <div className="p-5">
              <div className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-accent">{p.category}</div>
              <Link href={`/shop/products/${p.id}`} className="font-semibold transition hover:text-accent">{p.name}</Link>
              <p className="mt-2 line-clamp-2 text-sm text-muted">{p.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-lg font-bold">{formatINR(p.price)}</span>
                <button onClick={() => handleAdd(p)} className="rounded-lg bg-brand-gradient px-3.5 py-2 text-sm font-semibold text-white transition hover:brightness-110">
                  Add to cart
                </button>
              </div>
            </div>
          </div>
        ))}
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
      ) : groupedProducts.length === 0 ? (
        <p className="text-muted text-sm">No products match your search.</p>
      ) : (
        <div className="space-y-10">
          {groupedProducts.map((group, groupIndex) => (
            <section key={group.name} className="animate-fade-up" style={{ animationDelay: `${groupIndex * 70}ms` }}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">{group.name}</h2>
                  <p className="text-sm text-muted">{group.items.length} product{group.items.length === 1 ? "" : "s"}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setCategory(group.name)}
                  className="text-sm font-semibold text-accent transition hover:text-accent-hover"
                >
                  View all
                </button>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.slice(0, 3).map((p, i) => (
                  <div
                    key={p.id}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-xl hover:shadow-accent/10"
                    style={{ animationDelay: `${i * 40}ms` }}
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
                        <span className="absolute left-3 top-3 rounded-full bg-brand-gradient px-3 py-1 text-[11px] font-bold text-white">
                          ONLY {p.stock} LEFT
                        </span>
                      )}
                    </Link>
                    <div className="flex flex-1 flex-col p-5">
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
                          {formatINR(p.price)}
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
                                : "bg-brand-gradient text-white hover:brightness-110 active:scale-95"
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
            </section>
          ))}
        </div>
      )}

      {showAuthModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] border border-line bg-white p-6 shadow-2xl shadow-black/25">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Account needed</p>
                <h3 className="mt-2 text-2xl font-semibold text-foreground">Please sign in or create an account</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="rounded-full p-2 text-muted transition hover:bg-surface-2 hover:text-foreground"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <p className="mt-3 text-sm leading-7 text-muted">
              You need an account to add items to your cart and continue shopping.
            </p>
            <div className="mt-5 flex flex-col gap-3">
              <Link
                href="/shop/account"
                className="rounded-2xl bg-brand-gradient px-4 py-3 text-center text-sm font-semibold text-white transition hover:brightness-110"
                onClick={() => setShowAuthModal(false)}
              >
                Create account
              </Link>
              <Link
                href="/shop/account"
                className="rounded-2xl border border-line bg-surface px-4 py-3 text-center text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent"
                onClick={() => setShowAuthModal(false)}
              >
                Log in
              </Link>
            </div>
          </div>
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
