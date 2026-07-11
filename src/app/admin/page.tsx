import Link from "next/link";
import { listProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

export default function AdminDashboard() {
  const products = listProducts();
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const inventoryValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);
  const lowStock = products.filter((p) => p.stock > 0 && p.stock < 10);
  const outOfStock = products.filter((p) => p.stock === 0);

  const stats = [
    { label: "Products", value: products.length.toString(), icon: "📦" },
    { label: "Units in stock", value: totalStock.toString(), icon: "🏷️" },
    {
      label: "Inventory value",
      value: `$${inventoryValue.toLocaleString(undefined, {
        maximumFractionDigits: 0,
      })}`,
      icon: "💰",
    },
    {
      label: "Low / out of stock",
      value: `${lowStock.length} / ${outOfStock.length}`,
      icon: "⚠️",
    },
  ];

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted mt-1">
            Overview of your product catalog.
          </p>
        </div>
        <Link
          href="/admin/products"
          className="rounded-lg bg-accent hover:bg-accent-hover px-4 py-2 text-sm font-medium text-white transition"
        >
          Manage products
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-line bg-surface p-5"
          >
            <div className="text-2xl mb-3">{stat.icon}</div>
            <div className="text-2xl font-semibold">{stat.value}</div>
            <div className="text-sm text-muted mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-semibold mb-4">Stock alerts</h2>
      {lowStock.length === 0 && outOfStock.length === 0 ? (
        <p className="text-sm text-muted">
          All products are sufficiently stocked. 🎉
        </p>
      ) : (
        <div className="rounded-xl border border-line bg-surface divide-y divide-line">
          {[...outOfStock, ...lowStock].map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between px-5 py-4"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{p.emoji}</span>
                <div>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-muted">{p.category}</div>
                </div>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  p.stock === 0
                    ? "bg-red-500/15 text-red-400"
                    : "bg-amber-500/15 text-amber-400"
                }`}
              >
                {p.stock === 0 ? "Out of stock" : `Low stock · ${p.stock} left`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
