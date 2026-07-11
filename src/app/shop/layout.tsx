import type { Metadata } from "next";
import Link from "next/link";
import { CartProvider } from "./cart-context";
import { CartBadge } from "./cart-badge";

export const metadata: Metadata = {
  title: "Buyzo Shop",
};

export default function ShopLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <CartProvider>
      <div className="flex-1 flex flex-col">
        <header className="sticky top-0 z-40 border-b border-line bg-surface/80 backdrop-blur">
          <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
            <Link href="/shop" className="flex items-center gap-2 font-semibold">
              <span className="text-xl">🛍️</span>
              <span>
                Buyzo{" "}
                <span className="text-fuchsia-400 text-sm font-medium">
                  Shop
                </span>
              </span>
            </Link>
            <nav className="flex items-center gap-6 text-sm">
              <Link
                href="/shop"
                className="text-muted hover:text-foreground transition"
              >
                Products
              </Link>
              <CartBadge />
            </nav>
          </div>
        </header>
        <main className="flex-1 mx-auto w-full max-w-6xl px-6 py-8">
          {children}
        </main>
        <footer className="border-t border-line py-6 text-center text-sm text-muted">
          Buyzo — demo storefront
        </footer>
      </div>
    </CartProvider>
  );
}
