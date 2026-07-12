"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/lib/products";
import { formatINR } from "@/lib/types";
import { useCart } from "../cart-context";
import { useCustomer } from "../customer-context";
import { useWishlist } from "../wishlist-context";
import { AuthModal } from "../auth-modal";
import { HeartIcon } from "../site-header";

export function ProductDetailView({ productId }: { productId: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { addItem } = useCart();
  const { customer } = useCustomer();
  const { has, toggle } = useWishlist();

  useEffect(() => {
    fetch(`/api/products/${productId}`).then(async (res) => {
      if (!res.ok) {
        setNotFound(true);
        return;
      }
      const nextProduct = (await res.json()) as Product;
      setProduct(nextProduct);
      setSelectedImage(nextProduct.image);
    });
  }, [productId]);

  const galleryImages = useMemo(() => {
    if (!product) return [];
    return Array.from(
      new Set([product.image, product.extras?.hoverImage, ...(product.extras?.gallery ?? [])].filter(Boolean))
    ) as string[];
  }, [product]);

  useEffect(() => {
    if (galleryImages.length > 0) {
      setSelectedImage((current) => (galleryImages.includes(current) ? current : galleryImages[0]));
    }
  }, [galleryImages]);

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
    // The session lives in an httpOnly cookie — the provider asked the server.
    if (!customer) {
      setShowAuthModal(true);
      return;
    }
    addItem(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  const wished = has(product.id);

  return (
    <div>
      <Link href="/shop" className="text-sm text-muted transition hover:text-accent">
        ← Back to products
      </Link>

      <div className="mt-6 grid grid-cols-1 gap-10 md:grid-cols-2">
        <div className="space-y-4">
          <div className="animate-scale-in relative h-[420px] overflow-hidden rounded-3xl border border-line bg-surface shadow-sm">
            <Image
              src={selectedImage || product.image}
              alt={product.name}
              fill
              unoptimized
              className="object-cover"
            />
            <button
              type="button"
              onClick={() => toggle(product)}
              className={`absolute right-4 top-4 rounded-full bg-black/70 p-2.5 backdrop-blur transition hover:scale-110 ${
                wished ? "text-accent" : "text-white/80 hover:text-accent"
              }`}
              aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
            >
              <HeartIcon filled={wished} size={20} />
            </button>
          </div>

          {galleryImages.length > 1 && (
            <div className="flex flex-wrap gap-3">
              {galleryImages.map((image) => (
                <button
                  key={image}
                  type="button"
                  onClick={() => setSelectedImage(image)}
                  className={`relative h-20 w-20 overflow-hidden rounded-2xl border transition ${
                    selectedImage === image ? "border-accent ring-2 ring-accent/20" : "border-line"
                  }`}
                >
                  <Image src={image} alt={product.name} fill unoptimized className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="animate-fade-up flex flex-col">
          <div className="mb-2 text-xs font-bold tracking-[0.2em] text-accent">
            {product.category.toUpperCase()}
          </div>
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="text-muted mt-4 leading-relaxed">{product.description}</p>

          <div className="mt-6 text-3xl font-extrabold">
            <span className="text-brand-gradient">{formatINR(product.price)}</span>
          </div>

          <div className="mt-2 text-sm">
            {product.stock === 0 ? (
              <span className="text-danger">Out of stock</span>
            ) : product.stock < 10 ? (
              <span className="text-warning">Only {product.stock} left in stock</span>
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
                <span className="w-10 text-center text-sm font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  className="px-3.5 py-2.5 text-muted transition hover:text-accent"
                >
                  +
                </button>
              </div>
              <button
                onClick={handleAdd}
                className={`flex-1 rounded-lg px-5 py-3 text-sm font-bold transition-all duration-200 ${
                  added ? "bg-success/20 text-success" : "bg-brand-gradient hover:brightness-110 active:scale-[0.98]"
                }`}
              >
                {added ? "Added to cart ✓" : "Add to cart"}
              </button>
            </div>
          )}
        </div>
      </div>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
}
