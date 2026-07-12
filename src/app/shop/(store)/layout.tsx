"use client";

import Link from "next/link";
import { SiteHeader, BuyzoMark } from "../site-header";

export default function StoreLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">{children}</main>
      <footer className="border-t border-line bg-[linear-gradient(135deg,#0f1d3c_0%,#173b78_100%)] text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 lg:grid-cols-[1.1fr_0.7fr_0.7fr]">
          <div>
            <div className="flex items-center gap-3">
              <span className="rounded-2xl bg-white/10 p-2">
                <BuyzoMark size={32} />
              </span>
              <div>
                <div className="text-xl font-extrabold leading-none">
                  Buy<span className="text-accent-2">zo</span>
                </div>
                <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">
                  Smarter shopping starts here
                </div>
              </div>
            </div>
            <p className="mt-5 max-w-md text-sm leading-7 text-white/70">
              Curated electronics, premium wearables, and everyday essentials delivered with a calm and elevated shopping experience.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-white/50">Shop</h3>
            <div className="mt-4 flex flex-col gap-2 text-sm text-white/80">
              <Link href="/shop" className="transition hover:text-white">Featured products</Link>
              <Link href="/shop?cat=Wearables" className="transition hover:text-white">Wearables</Link>
              <Link href="/shop?cat=Audio" className="transition hover:text-white">Audio</Link>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-white/50">Support</h3>
            <div className="mt-4 flex flex-col gap-2 text-sm text-white/80">
              <Link href="/shop/account" className="transition hover:text-white">My account</Link>
              <Link href="/shop/cart" className="transition hover:text-white">Cart</Link>
              <Link href="/shop" className="transition hover:text-white">Contact us</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 px-6 py-4 text-center text-sm text-white/50">
          © 2026 Buyzo — demo storefront
        </div>
      </footer>
    </div>
  );
}
