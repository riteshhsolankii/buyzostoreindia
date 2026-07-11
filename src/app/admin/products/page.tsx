"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/lib/products";

type FormState = {
  name: string;
  description: string;
  price: string;
  category: string;
  stock: string;
  emoji: string;
};

const emptyForm: FormState = {
  name: "",
  description: "",
  price: "",
  category: "",
  stock: "0",
  emoji: "📦",
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  async function loadProducts() {
    const res = await fetch("/api/products");
    setProducts(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setModalOpen(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      category: product.category,
      stock: String(product.stock),
      emoji: product.emoji,
    });
    setError(null);
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || form.price === "") {
      setError("Name and price are required.");
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      category: form.category.trim() || "General",
      stock: Number(form.stock) || 0,
      emoji: form.emoji.trim() || "📦",
    };
    const res = editing
      ? await fetch(`/api/products/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Something went wrong.");
      return;
    }
    setModalOpen(false);
    await loadProducts();
  }

  async function handleDelete(product: Product) {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    await fetch(`/api/products/${product.id}`, { method: "DELETE" });
    await loadProducts();
  }

  function field(key: keyof FormState) {
    return {
      value: form[key],
      onChange: (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      ) => setForm((f) => ({ ...f, [key]: e.target.value })),
    };
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm text-muted mt-1">
            {products.length} product{products.length === 1 ? "" : "s"} in the
            catalog.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="rounded-lg bg-accent hover:bg-accent-hover px-4 py-2 text-sm font-medium text-white transition"
        >
          + Add product
        </button>
      </div>

      {loading ? (
        <p className="text-muted text-sm">Loading products…</p>
      ) : (
        <div className="rounded-xl border border-line bg-surface overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-muted">
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Price</th>
                <th className="px-5 py-3 font-medium">Stock</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-surface-2 transition">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{p.emoji}</span>
                      <div>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-muted line-clamp-1 max-w-xs">
                          {p.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-muted">{p.category}</td>
                  <td className="px-5 py-4">${p.price.toFixed(2)}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        p.stock === 0
                          ? "bg-red-500/15 text-red-400"
                          : p.stock < 10
                            ? "bg-amber-500/15 text-amber-400"
                            : "bg-emerald-500/15 text-emerald-400"
                      }`}
                    >
                      {p.stock === 0 ? "Out" : p.stock}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => openEdit(p)}
                      className="text-violet-400 hover:text-violet-300 mr-4 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(p)}
                      className="text-red-400 hover:text-red-300 transition"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-muted">
                    No products yet. Click “Add product” to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-line bg-surface p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-5">
              {editing ? `Edit ${editing.name}` : "Add product"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_5rem] gap-4">
                <label className="block">
                  <span className="text-sm text-muted">Name *</span>
                  <input
                    {...field("name")}
                    className="mt-1 w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm outline-none focus:border-violet-500"
                    placeholder="Aurora Headphones"
                  />
                </label>
                <label className="block">
                  <span className="text-sm text-muted">Emoji</span>
                  <input
                    {...field("emoji")}
                    className="mt-1 w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm outline-none focus:border-violet-500 text-center"
                  />
                </label>
              </div>
              <label className="block">
                <span className="text-sm text-muted">Description</span>
                <textarea
                  {...field("description")}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm outline-none focus:border-violet-500 resize-none"
                  placeholder="Short product description…"
                />
              </label>
              <div className="grid grid-cols-3 gap-4">
                <label className="block">
                  <span className="text-sm text-muted">Price ($) *</span>
                  <input
                    {...field("price")}
                    type="number"
                    min="0"
                    step="0.01"
                    className="mt-1 w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm outline-none focus:border-violet-500"
                  />
                </label>
                <label className="block">
                  <span className="text-sm text-muted">Stock</span>
                  <input
                    {...field("stock")}
                    type="number"
                    min="0"
                    step="1"
                    className="mt-1 w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm outline-none focus:border-violet-500"
                  />
                </label>
                <label className="block">
                  <span className="text-sm text-muted">Category</span>
                  <input
                    {...field("category")}
                    className="mt-1 w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm outline-none focus:border-violet-500"
                    placeholder="Audio"
                  />
                </label>
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-line px-4 py-2 text-sm text-muted hover:text-foreground hover:bg-surface-2 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-accent hover:bg-accent-hover px-4 py-2 text-sm font-medium text-white transition disabled:opacity-60"
                >
                  {saving ? "Saving…" : editing ? "Save changes" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
