import { getDb, saveDb } from "./db";

export type CategoryRow = { name: string; count: number };

/** Stored categories merged with the ones derived from products. */
export function listCategories(): CategoryRow[] {
  const db = getDb();
  const counts = new Map<string, number>();
  for (const c of db.categories) counts.set(c, 0);
  for (const p of db.products) {
    counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
  }
  return Array.from(counts, ([name, count]) => ({ name, count }));
}

function exists(name: string): boolean {
  const lower = name.toLowerCase();
  return listCategories().some((c) => c.name.toLowerCase() === lower);
}

export function addCategory(name: string): "ok" | "exists" | "invalid" {
  const clean = name.trim();
  if (!clean) return "invalid";
  if (exists(clean)) return "exists";
  getDb().categories.push(clean);
  saveDb();
  return "ok";
}

/** Rename a category and cascade the change to every product using it. */
export function renameCategory(
  from: string,
  to: string
): "ok" | "exists" | "invalid" | "not-found" {
  const clean = to.trim();
  if (!clean) return "invalid";
  if (!exists(from)) return "not-found";
  if (from.toLowerCase() !== clean.toLowerCase() && exists(clean)) {
    return "exists";
  }
  const db = getDb();
  db.categories = db.categories.filter((c) => c !== from);
  if (!db.categories.includes(clean)) db.categories.push(clean);
  for (const p of db.products) {
    if (p.category === from) p.category = clean;
  }
  saveDb();
  return "ok";
}

export function deleteCategory(name: string): "ok" | "in-use" | "not-found" {
  const db = getDb();
  if (!exists(name)) return "not-found";
  if (db.products.some((p) => p.category === name)) return "in-use";
  db.categories = db.categories.filter((c) => c !== name);
  saveDb();
  return "ok";
}
