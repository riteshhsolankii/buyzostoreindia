"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { formatINR } from "@/lib/types";
import { useCart } from "../../cart-context";
import { useCustomer } from "../../customer-context";
import { useWishlist } from "../../wishlist-context";
import { AuthModal } from "../../auth-modal";
import { HeartIcon } from "../../site-header";

export default function WishlistPage() {
  const { items, remove } = useWishlist();
  const { addItem } = useCart();
  const { customer } = useCustomer();
  const [addedId, setAddedId] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  function handleAdd(productId: string) {
    const product = items.find((p) => p.id === productId);
    if (!product) return;
    if (!customer) {
      setShowAuthModal(true);
      return;
    }
    addItem(product);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1200);
  }

  if (items.length === 0) {
    return (
      <div className="animate-fade-up py-20 text-center">
        <p className="mb-4 flex justify-center text-accent">
          <HeartIcon size={56} />
        </p>
        <h1 className="mb-2 text-2xl font-bold">Your wishlist is empty</h1>
        <p className="text-muted mb-6">
          Tap the heart on any product to save it here for later.
        </p>
        <Link
          href="/shop"
          className="rounded-lg bg-brand-gradient px-6 py-2.5 text-sm font-bold transition hover:brightness-110"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="animate-fade-up mb-8">
        <span className="text-xs font-bold tracking-[0.2em] text-accent">SAVED FOR LATER</span>
        <h1 className="mt-1 text-3xl font-bold">
          Wishlist{" "}
          <span className="text-lg font-semibold text-muted">
            · {items.length} item{items.length === 1 ? "" : "s"}
          </span>
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p, i) => (
          <div
            key={p.id}
            className="animate-fade-up group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-xl hover:shadow-accent/10"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <Link href={`/shop/products/${p.id}`} className="relative block h-52 overflow-hidden bg-surface-2">
              <Image
                src={p.image}
                alt={p.name}
                fill
                unoptimized
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  remove(p.id);
                }}
                className="absolute right-3 top-3 rounded-full bg-black/70 p-2 text-accent backdrop-blur transition hover:scale-110"
                aria-label={`Remove ${p.name} from wishlist`}
              >
                <HeartIcon filled size={18} />
              </button>
            </Link>
            <div className="flex flex-1 flex-col p-5">
              <div className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-accent">{p.category}</div>
              <Link href={`/shop/products/${p.id}`} className="font-semibold transition hover:text-accent">
                {p.name}
              </Link>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-lg font-bold">{formatINR(p.price)}</span>
                {p.stock === 0 ? (
                  <span className="text-danger text-xs font-medium">Out of stock</span>
                ) : (
                  <button
                    onClick={() => handleAdd(p.id)}
                    className={`rounded-lg px-3.5 py-2 text-sm font-bold transition-all duration-200 ${
                      addedId === p.id
                        ? "bg-success/20 text-success"
                        : "bg-brand-gradient hover:brightness-110 active:scale-95"
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

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
}
