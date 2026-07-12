import type { Metadata } from "next";
import Link from "next/link";
import { AdminNav } from "./nav";
import { LogoutButton } from "./logout-button";
import { BuyzoMark } from "../shop/site-header";

export const metadata: Metadata = {
  title: "Buyzo Admin",
};

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex-1 flex">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-surface sm:flex">
        <div className="border-b border-line px-5 py-5">
          <Link href="/admin" className="flex items-center gap-2.5">
            <BuyzoMark size={32} />
            <span className="leading-none">
              <span className="block font-extrabold">
                <span className="text-foreground">Buy</span>
                <span className="text-brand-gradient">zo</span>
              </span>
              <span className="mt-0.5 block text-[10px] font-semibold tracking-[0.2em] text-accent/80">
                ADMIN PANEL
              </span>
            </span>
          </Link>
        </div>
        <AdminNav />
        <div className="mt-auto flex flex-col gap-3 border-t border-line p-5">
          <Link
            href="/shop"
            className="text-sm text-muted transition hover:text-accent"
          >
            ↗ View customer portal
          </Link>
          <LogoutButton />
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-line bg-surface px-4 py-3 sm:hidden">
          <Link href="/admin" className="flex items-center gap-2 font-extrabold">
            <BuyzoMark size={26} />
            <span>
              <span className="text-foreground">Buy</span>
              <span className="text-brand-gradient">zo</span>
            </span>
          </Link>
          <nav className="flex gap-4 text-sm text-muted">
            <Link href="/admin" className="hover:text-accent">
              Dashboard
            </Link>
            <Link href="/admin/products" className="hover:text-accent">
              Products
            </Link>
            <Link href="/admin/customers" className="hover:text-accent">
              Customers
            </Link>
          </nav>
        </header>
        <main className="flex-1 p-6 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
