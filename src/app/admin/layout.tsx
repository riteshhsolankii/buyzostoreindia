import type { Metadata } from "next";
import Link from "next/link";
import { AdminNav } from "./nav";
import { LogoutButton } from "./logout-button";

export const metadata: Metadata = {
  title: "Buyzo Admin",
};

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex-1 flex">
      <aside className="w-60 shrink-0 border-r border-line bg-surface hidden sm:flex flex-col">
        <div className="px-5 py-5 border-b border-line">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="text-xl">🛠️</span>
            <span>
              Buyzo{" "}
              <span className="text-violet-400 text-sm font-medium">Admin</span>
            </span>
          </Link>
        </div>
        <AdminNav />
        <div className="mt-auto p-5 border-t border-line flex flex-col gap-3">
          <Link
            href="/shop"
            className="text-sm text-muted hover:text-foreground transition"
          >
            ↗ View customer portal
          </Link>
          <LogoutButton />
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sm:hidden border-b border-line bg-surface px-4 py-3 flex items-center justify-between">
          <Link href="/" className="font-semibold">
            🛠️ Buyzo Admin
          </Link>
          <nav className="flex gap-4 text-sm text-muted">
            <Link href="/admin" className="hover:text-foreground">
              Dashboard
            </Link>
            <Link href="/admin/products" className="hover:text-foreground">
              Products
            </Link>
          </nav>
        </header>
        <main className="flex-1 p-6 sm:p-8">{children}</main>
      </div>
    </div>
  );
}