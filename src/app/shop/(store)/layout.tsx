"use client";

import Link from "next/link";
import { SiteHeader, BuyzoLockup } from "../site-header";

export default function StoreLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">{children}</main>
      <footer className="border-t border-line bg-surface text-foreground">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 lg:grid-cols-[1.1fr_0.7fr_0.7fr]">
          <div>
            {/* The full artwork already carries the wordmark and tagline. */}
            <BuyzoLockup height={56} tagline />

            <p className="mt-5 max-w-md text-sm leading-7 text-muted">
              Curated electronics, premium wearables, and everyday essentials delivered with a calm and elevated shopping experience.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted">Shop</h3>
            <div className="mt-4 flex flex-col gap-2 text-sm text-foreground/80">
              <Link href="/shop" className="transition hover:text-accent">Featured products</Link>
              <Link href="/shop?cat=Wearables" className="transition hover:text-accent">Wearables</Link>
              <Link href="/shop?cat=Audio" className="transition hover:text-accent">Audio</Link>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted">Support</h3>
            <div className="mt-4 flex flex-col gap-2 text-sm text-foreground/80">
              <Link href="/shop/account" className="transition hover:text-accent">My account</Link>
              <Link href="/shop/wishlist" className="transition hover:text-accent">Wishlist</Link>
              <Link href="/shop/cart" className="transition hover:text-accent">Cart</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-line px-6 py-4 text-center text-sm text-muted">
          © 2026 Buyzo — demo storefront
        </div>
      </footer>
    </div>
  );
}
