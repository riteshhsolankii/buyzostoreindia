"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Product } from "@/lib/products";
import { formatINR } from "@/lib/types";

const statusStyles: Record<string, string> = {
  draft: "bg-warning/15 text-warning",
  active: "bg-success/15 text-success",
  "out-of-stock": "bg-danger/15 text-danger",
  archived: "bg-surface-2 text-muted",
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  active: "Active",
  "out-of-stock": "Out of Stock",
  archived: "Archived",
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadProducts() {
    const res = await fetch("/api/products");
    setProducts(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function handleDelete(product: Product) {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    await fetch(`/api/products/${product.id}`, { method: "DELETE" });
    await loadProducts();
  }

  return (
    <div className="w-full">
      <div className="animate-fade-up mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="mt-1 text-sm text-muted">
            {products.length} product{products.length === 1 ? "" : "s"} in the
            catalog.
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-lg bg-brand-gradient px-4 py-2 text-sm font-bold text-white transition hover:brightness-110 active:scale-95"
        >
          + Add product
        </Link>
      </div>

      {loading ? (
        <div className="h-72 animate-pulse rounded-2xl border border-line bg-surface" />
      ) : (
        <div className="animate-fade-up overflow-x-auto rounded-2xl border border-line bg-surface" style={{ animationDelay: "100ms" }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-muted">
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Price</th>
                <th className="px-5 py-3 font-medium">Stock</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {products.map((p, i) => {
                const status = p.extras?.status ?? "active";
                return (
                  <tr
                    key={p.id}
                    className="animate-fade-up transition hover:bg-surface-2"
                    style={{ animationDelay: `${150 + Math.min(i, 10) * 50}ms` }}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-11 w-14 shrink-0 overflow-hidden rounded-md border border-line bg-surface-2">
                          <Image
                            src={p.image}
                            alt={p.name}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-medium">{p.name}</div>
                          <div className="line-clamp-1 max-w-xs text-xs text-muted">
                            {p.extras?.sku ? `SKU: ${p.extras.sku}` : p.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-muted">{p.category}</td>
                    <td className="px-5 py-4 font-medium">{formatINR(p.price)}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          p.stock === 0
                            ? "bg-danger/15 text-danger"
                            : p.stock < 10
                              ? "bg-warning/15 text-warning"
                              : "bg-success/15 text-success"
                        }`}
                      >
                        {p.stock === 0 ? "Out" : p.stock}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[status]}`}
                      >
                        {statusLabels[status]}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-right">
                      <Link
                        href={`/admin/products/${p.id}/edit`}
                        className="mr-4 font-medium text-accent transition hover:text-accent-hover"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(p)}
                        className="text-danger transition hover:brightness-125"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
              {products.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-muted">
                    No products yet. Click “Add product” to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
