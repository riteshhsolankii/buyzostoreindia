import Image from "next/image";
import Link from "next/link";
import { listProducts } from "@/lib/products";
import { listCustomers } from "@/lib/customers";

export const dynamic = "force-dynamic";

export default function AdminDashboard() {
  const products = listProducts();
  const customers = listCustomers();
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const inventoryValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);
  const lowStock = products.filter((p) => p.stock > 0 && p.stock < 10);
  const outOfStock = products.filter((p) => p.stock === 0);
  const recentLeads = customers.slice(0, 5);

  const stats = [
    {
      label: "Products",
      value: products.length.toString(),
      sub: `${totalStock} units in stock`,
    },
    {
      label: "Inventory value",
      value: `$${inventoryValue.toLocaleString(undefined, {
        maximumFractionDigits: 0,
      })}`,
      sub: "across the catalog",
    },
    {
      label: "Customer leads",
      value: customers.length.toString(),
      sub: "registered via the shop",
    },
    {
      label: "Stock alerts",
      value: `${lowStock.length + outOfStock.length}`,
      sub: `${lowStock.length} low · ${outOfStock.length} out`,
    },
  ];

  return (
    <div className="max-w-5xl">
      <div className="animate-fade-up mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="mt-1 text-sm text-muted">
            Overview of your store — catalog, inventory and customer leads.
          </p>
        </div>
        <Link
          href="/admin/products"
          className="rounded-lg bg-brand-gradient px-4 py-2 text-sm font-bold text-black transition hover:brightness-110"
        >
          Manage products
        </Link>
      </div>

      <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className="animate-fade-up group rounded-2xl border border-line bg-surface p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="text-sm text-muted">{stat.label}</div>
            <div className="text-brand-gradient mt-2 text-3xl font-extrabold">
              {stat.value}
            </div>
            <div className="mt-1 text-xs text-muted">{stat.sub}</div>
            <div className="mt-3 h-1 w-8 rounded-full bg-brand-gradient opacity-40 transition-all duration-300 group-hover:w-16 group-hover:opacity-100" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Recent leads */}
        <section className="animate-fade-up" style={{ animationDelay: "200ms" }}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Latest customer leads</h2>
            <Link
              href="/admin/customers"
              className="text-sm text-accent transition hover:underline"
            >
              View all →
            </Link>
          </div>
          {recentLeads.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-surface px-5 py-10 text-center text-sm text-muted">
              No customer accounts yet. When someone registers in the shop,
              their lead shows up here.
            </div>
          ) : (
            <div className="divide-y divide-line rounded-2xl border border-line bg-surface">
              {recentLeads.map((c, i) => (
                <div
                  key={c.id}
                  className="animate-fade-up flex items-center gap-3 px-5 py-3.5"
                  style={{ animationDelay: `${240 + i * 60}ms` }}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-sm font-extrabold text-black">
                    {c.name.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{c.name}</div>
                    <div className="truncate text-xs text-muted">{c.email}</div>
                  </div>
                  <span className="text-xs text-muted">
                    {new Date(c.createdAt).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Stock alerts */}
        <section className="animate-fade-up" style={{ animationDelay: "260ms" }}>
          <h2 className="mb-4 text-lg font-semibold">Stock alerts</h2>
          {lowStock.length === 0 && outOfStock.length === 0 ? (
            <p className="text-sm text-muted">
              All products are sufficiently stocked. 🎉
            </p>
          ) : (
            <div className="divide-y divide-line rounded-2xl border border-line bg-surface">
              {[...outOfStock, ...lowStock].map((p, i) => (
                <div
                  key={p.id}
                  className="animate-fade-up flex items-center justify-between px-5 py-3.5"
                  style={{ animationDelay: `${300 + i * 60}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-12 overflow-hidden rounded-md border border-line bg-surface-2">
                      <Image
                        src={p.image}
                        alt={p.name}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <div className="text-sm font-medium">{p.name}</div>
                      <div className="text-xs text-muted">{p.category}</div>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      p.stock === 0
                        ? "bg-danger/15 text-danger"
                        : "bg-warning/15 text-warning"
                    }`}
                  >
                    {p.stock === 0 ? "Out of stock" : `${p.stock} left`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
