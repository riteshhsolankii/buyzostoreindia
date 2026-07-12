import { getDatabase } from "./database";

export type CategoryRow = { name: string; count: number };

function nameKey(name: string): string {
  return name.trim().toLocaleLowerCase("en-US");
}

/** Every stored category with the number of products currently using it. */
export function listCategories(): CategoryRow[] {
  const rows = getDatabase()
    .prepare(
      `SELECT c.name AS name, COUNT(p.id) AS count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id
       GROUP BY c.id
       ORDER BY c.position ASC, c.name ASC`
    )
    .all() as CategoryRow[];
  return rows;
}

function findByKey(key: string): { id: string; name: string } | undefined {
  return getDatabase()
    .prepare("SELECT id, name FROM categories WHERE name_key = ?")
    .get(key) as { id: string; name: string } | undefined;
}

export function addCategory(name: string): "ok" | "exists" | "invalid" {
  const clean = name.trim();
  if (!clean) return "invalid";
  if (findByKey(nameKey(clean))) return "exists";

  const db = getDatabase();
  const now = new Date().toISOString();
  const position = (
    db.prepare("SELECT COALESCE(MAX(position), -1) + 1 AS next FROM categories").get() as {
      next: number;
    }
  ).next;
  db.prepare(
    `INSERT INTO categories (id, name, name_key, position, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(`cat-${crypto.randomUUID().slice(0, 8)}`, clean, nameKey(clean), position, now, now);
  return "ok";
}

/** Rename a category. Products keep their foreign key, so the change cascades
 * automatically — only the category row's name needs to move. */
export function renameCategory(
  from: string,
  to: string
): "ok" | "exists" | "invalid" | "not-found" {
  const clean = to.trim();
  if (!clean) return "invalid";
  const source = findByKey(nameKey(from));
  if (!source) return "not-found";
  // Allow case-only renames of the same category; block collisions otherwise.
  if (nameKey(from) !== nameKey(clean) && findByKey(nameKey(clean))) {
    return "exists";
  }
  getDatabase()
    .prepare(
      "UPDATE categories SET name = ?, name_key = ?, updated_at = ? WHERE id = ?"
    )
    .run(clean, nameKey(clean), new Date().toISOString(), source.id);
  return "ok";
}

export function deleteCategory(name: string): "ok" | "in-use" | "not-found" {
  const target = findByKey(nameKey(name));
  if (!target) return "not-found";
  const inUse = getDatabase()
    .prepare("SELECT 1 FROM products WHERE category_id = ? LIMIT 1")
    .get(target.id);
  if (inUse) return "in-use";
  getDatabase().prepare("DELETE FROM categories WHERE id = ?").run(target.id);
  return "ok";
}
