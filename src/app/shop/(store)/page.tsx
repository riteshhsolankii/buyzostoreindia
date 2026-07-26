"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Product } from "@/lib/products";
import { formatINR } from "@/lib/types";
import { useCart } from "../cart-context";
import { useCustomer } from "../customer-context";
import { useWishlist } from "../wishlist-context";
import { AuthModal } from "../auth-modal";
import { HeroBanner } from "../hero-banner";
import { HeartIcon } from "../site-header";

function TruckIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M2.5 6h11v11h-11zM13.5 10h4.2l3.8 3.8V17h-8" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="7" cy="18.5" r="1.8" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17.5" cy="18.5" r="1.8" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 2.8 20 6v6c0 5-3.4 8.3-8 9.2C7.4 20.3 4 17 4 12V6l8-3.2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="m8.8 12 2.2 2.2 4.2-4.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M13 2.5 4.5 13.5H11l-1 8 9.5-11.5H13l1-7.5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M20 12a8 8 0 1 1-2.3-5.6M20 3v4h-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const PERKS = [
  { icon: TruckIcon, title: "Free shipping", sub: "On orders above ₹999" },
  { icon: ShieldIcon, title: "Secure checkout", sub: "256-bit encrypted payments" },
  { icon: BoltIcon, title: "Fast delivery", sub: "Same-day dispatch" },
  { icon: RefreshIcon, title: "Easy returns", sub: "7-day return window" },
];

function ProductCard({
  product,
  index,
  added,
  onAdd,
}: {
  product: Product;
  index: number;
  added: boolean;
  onAdd: (product: Product) => void;
}) {
  const { has, toggle } = useWishlist();
  const wished = has(product.id);

  return (
    <div
      className="animate-fade-up group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-xl hover:shadow-accent/10"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <Link href={`/shop/products/${product.id}`} className="relative block h-52 overflow-hidden bg-surface-2">
        <Image
          src={product.image}
          alt={product.name}
          fill
          unoptimized
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {product.stock === 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-danger/90 px-3 py-1 text-[11px] font-bold text-black">
            SOLD OUT
          </span>
        )}
        {product.stock > 0 && product.stock < 10 && (
          <span className="absolute left-3 top-3 rounded-full bg-brand-gradient px-3 py-1 text-[11px] font-bold">
            ONLY {product.stock} LEFT
          </span>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            toggle(product);
          }}
          className={`absolute right-3 top-3 rounded-full bg-black/70 p-2 backdrop-blur transition hover:scale-110 ${
            wished ? "text-accent" : "text-white/80 hover:text-accent"
          }`}
          aria-label={wished ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
        >
          <HeartIcon filled={wished} size={18} />
        </button>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-accent">{product.category}</div>
        <Link href={`/shop/products/${product.id}`} className="font-semibold transition hover:text-accent">
          {product.name}
        </Link>
        <p className="text-muted mt-1 line-clamp-2 flex-1 text-sm">{product.description}</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-lg font-bold">{formatINR(product.price)}</span>
          {product.stock === 0 ? (
            <span className="text-danger text-xs font-medium">Out of stock</span>
          ) : (
            <button
              onClick={() => onAdd(product)}
              className={`rounded-lg px-3.5 py-2 text-sm font-bold transition-all duration-200 ${
                added
                  ? "bg-success/20 text-success"
                  : "bg-brand-gradient hover:brightness-110 active:scale-95"
              }`}
            >
              {added ? "Added ✓" : "Add to cart"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ShopPageContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const cat = searchParams.get("cat") ?? "All";
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(q);
  const [category, setCategory] = useState(cat);
  const { addItem } = useCart();
  const { customer } = useCustomer();
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

  const featured = useMemo(
    () =>
      groupedProducts
        .flatMap((group) => group.items)
        .filter((p) => p.stock > 0)
        .slice(0, 3),
    [groupedProducts]
  );

  function handleAdd(product: Product) {
    // The session lives in an httpOnly cookie — the provider asked the server.
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
      <div className="mb-10">
        <HeroBanner />
      </div>

      {/* Store perks strip */}
      <div className="mb-12 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {PERKS.map((perk, i) => {
          const Icon = perk.icon;
          return (
            <div
              key={perk.title}
              className="animate-fade-up flex items-center gap-3.5 rounded-2xl border border-line bg-surface px-4 py-4"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <Icon />
              </span>
              <span>
                <span className="block text-sm font-bold">{perk.title}</span>
                <span className="block text-xs text-muted">{perk.sub}</span>
              </span>
            </div>
          );
        })}
      </div>

      <div className="mb-8 flex items-end justify-between">
        <div className="animate-fade-up">
          <span className="text-xs font-bold tracking-[0.2em] text-accent">OUR CATALOG</span>
          <h1 className="mt-1 text-3xl font-bold">Browse products</h1>
          <p className="text-muted mt-1">Find something you love from our catalog.</p>
        </div>
      </div>

      <div className="mb-10 flex flex-wrap gap-2">
        {["All", ...Array.from(new Set(products.map((p) => p.category)))].map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-full px-4 py-2 text-sm transition-all duration-200 ${
              category === c
                ? "bg-brand-gradient font-bold shadow-lg shadow-accent/20"
                : "border border-line bg-surface text-muted hover:border-accent/40 hover:text-foreground"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-80 animate-pulse rounded-2xl border border-line bg-surface" />
          ))}
        </div>
      ) : groupedProducts.length === 0 ? (
        <p className="text-muted text-sm">No products match your search.</p>
      ) : (
        <div className="space-y-12">
          {featured.length > 0 && (
            <section className="animate-fade-up">
              <div className="mb-4 flex items-center gap-3">
                <h2 className="text-xl font-semibold text-foreground">Featured picks</h2>
                <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-[11px] font-bold text-accent">HOT</span>
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} added={addedId === p.id} onAdd={handleAdd} />
                ))}
              </div>
            </section>
          )}

          {groupedProducts.map((group, groupIndex) => (
            <section key={group.name} className="animate-fade-up" style={{ animationDelay: `${groupIndex * 70}ms` }}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">{group.name}</h2>
                  <p className="text-sm text-muted">
                    {group.items.length} product{group.items.length === 1 ? "" : "s"}
                  </p>
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
                  <ProductCard key={p.id} product={p} index={i} added={addedId === p.id} onAdd={handleAdd} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
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
