"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { FALLBACK_IMAGE, type Product } from "@/lib/types";
import { useToast } from "../toast-context";

type WishlistContextValue = {
  items: Product[];
  count: number;
  has: (productId: string) => boolean;
  toggle: (product: Product) => void;
  remove: (productId: string) => void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

const STORAGE_KEY = "buyzo-wishlist";

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Product[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const { success, info } = useToast();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = (JSON.parse(raw) as Product[]).map((product) => ({
          ...product,
          image: product.image || FALLBACK_IMAGE,
        }));
        setItems(parsed);
      }
    } catch {
      // ignore corrupted wishlist
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const has = useCallback(
    (productId: string) => items.some((p) => p.id === productId),
    [items]
  );

  const toggle = useCallback(
    (product: Product) => {
      // Read the direction before updating so the message matches the result.
      const wasWished = items.some((p) => p.id === product.id);
      setItems((prev) =>
        prev.some((p) => p.id === product.id)
          ? prev.filter((p) => p.id !== product.id)
          : [...prev, product]
      );
      if (wasWished) info(`${product.name} removed from your wishlist.`);
      else success(`${product.name} saved to your wishlist.`, { title: "Wishlisted" });
    },
    [items, info, success]
  );

  const remove = useCallback(
    (productId: string) => {
      const removed = items.find((p) => p.id === productId);
      setItems((prev) => prev.filter((p) => p.id !== productId));
      if (removed) info(`${removed.name} removed from your wishlist.`);
    },
    [items, info]
  );

  return (
    <WishlistContext.Provider
      value={{ items, count: items.length, has, toggle, remove }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
