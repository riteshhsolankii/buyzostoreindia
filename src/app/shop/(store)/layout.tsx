import Link from "next/link";
import { SiteHeader, BuyzoMark } from "../site-header";

export default function StoreLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex-1 flex flex-col">
      <SiteHeader />
      <main className="flex-1 mx-auto w-full max-w-7xl px-6 py-8">
        {children}
      </main>
      <footer className="border-t border-line bg-[#0d0d0d]">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-6 py-10 text-center md:flex-row md:justify-between md:text-left">
          <div className="flex items-center gap-3">
            <BuyzoMark size={34} />
            <div>
              <div className="font-extrabold leading-none">
                <span className="text-white">Buy</span>
                <span className="text-brand-gradient">zo</span>
              </div>
              <div className="mt-1 text-[10px] font-medium tracking-[0.18em] text-white/40">
                SHOP MORE. PAY LESS. LIVE BETTER.
              </div>
            </div>
          </div>
          <nav className="flex items-center gap-6 text-sm text-muted">
            <Link href="/shop" className="transition hover:text-accent">
              Shop
            </Link>
            <Link href="/shop/account" className="transition hover:text-accent">
              My account
            </Link>
            <Link href="/shop/cart" className="transition hover:text-accent">
              Cart
            </Link>
          </nav>
          <p className="text-xs text-white/35">
            © 2026 Buyzo — demo storefront
          </p>
        </div>
      </footer>
    </div>
  );
}
