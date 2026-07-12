"use client";

import { useEffect, useState } from "react";
import type { CategoryRow } from "@/lib/categories";

const inputClass =
  "rounded-lg border border-line bg-surface-2 px-3.5 py-2.5 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    fetch("/api/categories", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) return;
        const data = (await res.json().catch(() => null)) as
          | CategoryRow[]
          | null;
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function request(method: string, body: object) {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/categories", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    setBusy(false);
    if (!res.ok) {
      setError(data?.error ?? "Something went wrong.");
      return false;
    }
    setCategories(data as CategoryRow[]);
    return true;
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    if (await request("POST", { name: newName })) setNewName("");
  }

  async function handleRename(from: string) {
    if (!editValue.trim() || editValue.trim() === from) {
      setEditing(null);
      return;
    }
    if (await request("PUT", { from, to: editValue })) setEditing(null);
  }

  async function handleDelete(name: string, count: number) {
    if (count > 0) {
      setError(
        `"${name}" mein ${count} product${count === 1 ? " hai" : "s hain"} — pehle unhe move ya delete karo.`
      );
      return;
    }
    if (!confirm(`Delete category "${name}"?`)) return;
    await request("DELETE", { name });
  }

  const totalProducts = categories.reduce((sum, c) => sum + c.count, 0);

  return (
    <div className="w-full">
      <div className="animate-fade-up mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="mt-1 text-sm text-muted">
            {categories.length} categor{categories.length === 1 ? "y" : "ies"} ·{" "}
            {totalProducts} product{totalProducts === 1 ? "" : "s"} assigned.
          </p>
        </div>
      </div>

      {/* Add new */}
      <form
        onSubmit={handleAdd}
        className="animate-fade-up mb-6 flex gap-2.5"
        style={{ animationDelay: "80ms" }}
      >
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className={`${inputClass} flex-1`}
          placeholder="Enter new category name"
        />
        <button
          type="submit"
          disabled={busy || !newName.trim()}
          className="rounded-lg bg-brand-gradient px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          + Add category
        </button>
      </form>

      {error && (
        <p className="animate-fade-in mb-4 rounded-lg border border-danger/40 bg-danger/10 px-4 py-2.5 text-sm text-danger">
          {error}
        </p>
      )}

      {loading ? (
        <div className="h-64 animate-pulse rounded-2xl border border-line bg-surface" />
      ) : categories.length === 0 ? (
        <div
          className="animate-fade-up rounded-2xl border border-dashed border-line bg-surface px-6 py-16 text-center"
          style={{ animationDelay: "140ms" }}
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-2xl">
            🏷️
          </div>
          <h2 className="font-semibold">No categories yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            Upar se pehli category add karo — product form ke dropdown mein
            turant dikhne lagegi.
          </p>
        </div>
      ) : (
        <div
          className="animate-fade-up divide-y divide-line rounded-2xl border border-line bg-surface"
          style={{ animationDelay: "140ms" }}
        >
          {categories.map((c, i) => (
            <div
              key={c.name}
              className="animate-fade-up flex items-center gap-3 px-5 py-3.5"
              style={{ animationDelay: `${180 + Math.min(i, 10) * 50}ms` }}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/12 text-sm font-extrabold text-accent">
                {c.name.slice(0, 1).toUpperCase()}
              </span>

              {editing === c.name ? (
                <div className="flex flex-1 items-center gap-2">
                  <input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename(c.name);
                      if (e.key === "Escape") setEditing(null);
                    }}
                    autoFocus
                    className={`${inputClass} flex-1 py-1.5`}
                  />
                  <button
                    onClick={() => handleRename(c.name)}
                    disabled={busy}
                    className="rounded-lg bg-brand-gradient px-3 py-1.5 text-xs font-bold text-white transition hover:brightness-110"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditing(null)}
                    className="rounded-lg border border-line px-3 py-1.5 text-xs text-muted transition hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{c.name}</div>
                    <div className="text-xs text-muted">
                      {c.count} product{c.count === 1 ? "" : "s"}
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      c.count > 0
                        ? "bg-success/15 text-success"
                        : "bg-surface-2 text-muted"
                    }`}
                  >
                    {c.count > 0 ? "In use" : "Empty"}
                  </span>
                  <button
                    onClick={() => {
                      setEditing(c.name);
                      setEditValue(c.name);
                      setError(null);
                    }}
                    className="ml-2 text-sm font-medium text-accent transition hover:text-accent-hover"
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => handleDelete(c.name, c.count)}
                    disabled={busy}
                    className="text-sm text-danger transition hover:brightness-125 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="mt-4 text-[11px] text-muted">
        Rename karne pe us category ke saare products bhi update ho jaate hain.
        Jis category mein products hain use delete nahi kiya ja sakta.
      </p>
    </div>
  );
}
