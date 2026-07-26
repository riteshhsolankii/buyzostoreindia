import { all, one, run, transaction, type QueryRunner } from "./database";

export type CategoryRow = { name: string; count: number };

function nameKey(name: string): string {
  return name.trim().toLocaleLowerCase("en-US");
}

/** Every stored category with the number of products currently using it. */
export function listCategories(): Promise<CategoryRow[]> {
  return all<CategoryRow>(
    `SELECT c.name AS name, COUNT(p.id) AS count
     FROM categories c
     LEFT JOIN products p ON p.category_id = c.id
     GROUP BY c.id
     ORDER BY c.position ASC, c.name ASC`
  );
}

function findByKey(
  tx: Pick<QueryRunner, "one">,
  key: string
): Promise<{ id: string; name: string } | undefined> {
  return tx.one<{ id: string; name: string }>(
    "SELECT id, name FROM categories WHERE name_key = ?",
    [key]
  );
}

export async function addCategory(
  name: string
): Promise<"ok" | "exists" | "invalid"> {
  const clean = name.trim();
  if (!clean) return "invalid";

  // Read-then-write against a remote database, so hold a transaction to keep
  // two concurrent adds from creating duplicate categories.
  return transaction(async (tx) => {
    if (await findByKey(tx, nameKey(clean))) return "exists";

    const now = new Date().toISOString();
    const next = await tx.one<{ next: number }>(
      "SELECT COALESCE(MAX(position), -1) + 1 AS next FROM categories"
    );
    await tx.run(
      `INSERT INTO categories (id, name, name_key, position, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        `cat-${crypto.randomUUID().slice(0, 8)}`,
        clean,
        nameKey(clean),
        next?.next ?? 0,
        now,
        now,
      ]
    );
    return "ok";
  });
}

/** Rename a category. Products keep their foreign key, so the change cascades
 * automatically — only the category row's name needs to move. */
export async function renameCategory(
  from: string,
  to: string
): Promise<"ok" | "exists" | "invalid" | "not-found"> {
  const clean = to.trim();
  if (!clean) return "invalid";

  return transaction(async (tx) => {
    const source = await findByKey(tx, nameKey(from));
    if (!source) return "not-found";
    // Allow case-only renames of the same category; block collisions otherwise.
    if (
      nameKey(from) !== nameKey(clean) &&
      (await findByKey(tx, nameKey(clean)))
    ) {
      return "exists";
    }
    await tx.run(
      "UPDATE categories SET name = ?, name_key = ?, updated_at = ? WHERE id = ?",
      [clean, nameKey(clean), new Date().toISOString(), source.id]
    );
    return "ok";
  });
}

export async function deleteCategory(
  name: string
): Promise<"ok" | "in-use" | "not-found"> {
  const target = await findByKey({ one }, nameKey(name));
  if (!target) return "not-found";
  const inUse = await one("SELECT 1 FROM products WHERE category_id = ? LIMIT 1", [
    target.id,
  ]);
  if (inUse) return "in-use";
  await run("DELETE FROM categories WHERE id = ?", [target.id]);
  return "ok";
}
