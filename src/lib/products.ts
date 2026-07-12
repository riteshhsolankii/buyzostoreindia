import { getDatabase, transaction } from "./database";
import {
  FALLBACK_IMAGE,
  type Product,
  type ProductExtras,
  type ProductStatus,
  type ProductInput,
} from "./types";

export type { Product, ProductInput } from "./types";
export { FALLBACK_IMAGE } from "./types";

const CATALOG_SEED_MARKER = "catalog_seeded_v1";
const STATUSES = new Set<ProductStatus>([
  "draft",
  "active",
  "out-of-stock",
  "archived",
]);

const seed: Product[] = [
  {
    id: "p-1",
    name: "Aurora Headphones",
    description:
      "Wireless over-ear headphones with active noise cancellation and 40-hour battery life.",
    price: 199.99,
    category: "Audio",
    stock: 24,
    emoji: "🎧",
    image: "/products/p-1.svg",
    createdAt: "2026-07-01T10:00:00.000Z",
  },
  {
    id: "p-2",
    name: "Nebula Mechanical Keyboard",
    description:
      "Hot-swappable 75% mechanical keyboard with RGB backlight and gasket mount.",
    price: 129.0,
    category: "Peripherals",
    stock: 41,
    emoji: "⌨️",
    image: "/products/p-2.svg",
    createdAt: "2026-07-02T10:00:00.000Z",
  },
  {
    id: "p-3",
    name: "Pulse Smartwatch",
    description:
      "Fitness tracking, heart-rate monitoring, and a bright AMOLED display in a slim case.",
    price: 249.5,
    category: "Wearables",
    stock: 12,
    emoji: "⌚",
    image: "/products/p-3.svg",
    createdAt: "2026-07-03T10:00:00.000Z",
  },
  {
    id: "p-4",
    name: "Orbit Wireless Mouse",
    description:
      "Ergonomic 8K-DPI wireless mouse with silent clicks and USB-C fast charging.",
    price: 59.99,
    category: "Peripherals",
    stock: 87,
    emoji: "🖱️",
    image: "/products/p-4.svg",
    createdAt: "2026-07-04T10:00:00.000Z",
  },
  {
    id: "p-5",
    name: "Lumen Desk Lamp",
    description:
      "Adjustable LED desk lamp with wireless charging pad and three color temperatures.",
    price: 79.0,
    category: "Home",
    stock: 5,
    emoji: "💡",
    image: "/products/p-5.svg",
    createdAt: "2026-07-05T10:00:00.000Z",
  },
  {
    id: "p-6",
    name: "Vertex 4K Monitor",
    description:
      "27-inch 4K IPS monitor with 144Hz refresh rate and 99% DCI-P3 color coverage.",
    price: 449.0,
    category: "Displays",
    stock: 0,
    emoji: "🖥️",
    image: "/products/p-6.svg",
    createdAt: "2026-07-06T10:00:00.000Z",
  },
];

// Shape of a joined products row as it comes back from SQLite.
type ProductRow = {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  category_name: string;
  stock: number;
  emoji: string;
  image: string;
  status: string;
  extras_json: string | null;
  created_at: string;
};

function toProduct(row: ProductRow): Product {
  const extras = parseExtras(row.extras_json, row.status);
  const product: Product = {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price_cents / 100,
    category: row.category_name,
    stock: row.stock,
    emoji: row.emoji,
    image: row.image || FALLBACK_IMAGE,
    createdAt: row.created_at,
  };
  if (Object.keys(extras).length > 0) product.extras = extras;
  return product;
}

function parseExtras(json: string | null, status: string): ProductExtras {
  let extras: ProductExtras = {};
  if (json) {
    try {
      const parsed = JSON.parse(json);
      if (parsed && typeof parsed === "object") extras = parsed as ProductExtras;
    } catch {
      extras = {};
    }
  }
  // The status column is the source of truth; mirror it into extras so the
  // admin form (which reads extras.status) always sees the stored value.
  if (STATUSES.has(status as ProductStatus)) {
    extras.status = status as ProductStatus;
  }
  return extras;
}

function priceCents(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.round(value * 100);
}

function optionalText(value: unknown): string | null {
  const text = typeof value === "string" ? value.trim() : "";
  return text || null;
}

/** Resolve a category name to its id, creating the category if needed. */
function ensureCategoryId(name: string): string {
  const db = getDatabase();
  const clean = name.trim() || "General";
  const nameKey = clean.toLocaleLowerCase("en-US");
  const existing = db
    .prepare("SELECT id FROM categories WHERE name_key = ?")
    .get(nameKey) as { id: string } | undefined;
  if (existing) return existing.id;

  const now = new Date().toISOString();
  const position =
    (
      db.prepare("SELECT COALESCE(MAX(position), -1) + 1 AS next FROM categories").get() as {
        next: number;
      }
    ).next;
  const id = `cat-${crypto.randomUUID().slice(0, 8)}`;
  db.prepare(
    `INSERT INTO categories (id, name, name_key, position, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, clean, nameKey, position, now, now);
  return id;
}

// Seed the demo catalog on a fresh database. Skipped if the legacy import
// already ran (it sets the same marker) or the catalog was seeded before.
function ensureSeeded(): void {
  const db = getDatabase();
  const marked = db
    .prepare("SELECT 1 FROM app_meta WHERE key = ?")
    .get(CATALOG_SEED_MARKER);
  if (marked) return;

  transaction(() => {
    const now = new Date().toISOString();
    const hasProducts = (
      db.prepare("SELECT COUNT(*) AS count FROM products").get() as {
        count: number;
      }
    ).count;
    if (hasProducts === 0) {
      const insert = db.prepare(
        `INSERT INTO products (
           id, name, description, price_cents, category_id, stock, emoji, image,
           slug, brand, sku, status, extras_json, display_order, created_at, updated_at
         ) VALUES (
           @id, @name, @description, @priceCents, @categoryId, @stock, @emoji, @image,
           NULL, NULL, NULL, 'active', NULL, @displayOrder, @createdAt, @createdAt
         )`
      );
      seed.forEach((product, displayOrder) => {
        insert.run({
          id: product.id,
          name: product.name,
          description: product.description,
          priceCents: priceCents(product.price),
          categoryId: ensureCategoryId(product.category),
          stock: product.stock,
          emoji: product.emoji,
          image: product.image,
          displayOrder,
          createdAt: product.createdAt,
        });
      });
    }
    db.prepare(
      `INSERT INTO app_meta (key, value, updated_at) VALUES (?, 'demo-seed', ?)
       ON CONFLICT(key) DO NOTHING`
    ).run(CATALOG_SEED_MARKER, now);
  });
}

const SELECT_PRODUCT = `
  SELECT p.id, p.name, p.description, p.price_cents, p.stock, p.emoji, p.image,
         p.status, p.extras_json, p.created_at, c.name AS category_name
  FROM products p
  JOIN categories c ON c.id = p.category_id
`;

export function listProducts(): Product[] {
  ensureSeeded();
  const rows = getDatabase()
    .prepare(`${SELECT_PRODUCT} ORDER BY p.display_order ASC, p.created_at DESC`)
    .all() as ProductRow[];
  return rows.map(toProduct);
}

export function getProduct(id: string): Product | undefined {
  ensureSeeded();
  const row = getDatabase()
    .prepare(`${SELECT_PRODUCT} WHERE p.id = ?`)
    .get(id) as ProductRow | undefined;
  return row ? toProduct(row) : undefined;
}

export function createProduct(input: ProductInput): Product {
  ensureSeeded();
  const db = getDatabase();
  const id = `p-${crypto.randomUUID().slice(0, 8)}`;
  const createdAt = new Date().toISOString();
  const extras = input.extras ?? {};
  const status = STATUSES.has(extras.status as ProductStatus)
    ? (extras.status as ProductStatus)
    : "active";

  transaction(() => {
    const categoryId = ensureCategoryId(input.category);
    // New products sort to the front (mirrors the old unshift behaviour).
    const topOrder =
      (
        db.prepare("SELECT COALESCE(MIN(display_order), 0) - 1 AS top FROM products").get() as {
          top: number;
        }
      ).top;
    db.prepare(
      `INSERT INTO products (
         id, name, description, price_cents, category_id, stock, emoji, image,
         slug, brand, sku, status, extras_json, display_order, created_at, updated_at
       ) VALUES (
         @id, @name, @description, @priceCents, @categoryId, @stock, @emoji, @image,
         @slug, @brand, @sku, @status, @extrasJson, @displayOrder, @createdAt, @createdAt
       )`
    ).run({
      id,
      name: input.name,
      description: input.description,
      priceCents: priceCents(input.price),
      categoryId,
      stock: Math.max(0, Math.trunc(input.stock)),
      emoji: input.emoji || "📦",
      image: input.image || FALLBACK_IMAGE,
      slug: optionalText(extras.slug),
      brand: optionalText(extras.brand),
      sku: optionalText(extras.sku),
      status,
      extrasJson: Object.keys(extras).length > 0 ? JSON.stringify(extras) : null,
      displayOrder: topOrder,
      createdAt,
    });
  });

  return getProduct(id)!;
}

export function updateProduct(
  id: string,
  input: Partial<ProductInput>
): Product | undefined {
  const existing = getProduct(id);
  if (!existing) return undefined;

  // Merge onto the current product so partial patches keep prior values.
  const merged: Product = { ...existing, ...input };
  const extras = input.extras ?? existing.extras ?? {};
  const status = STATUSES.has(extras.status as ProductStatus)
    ? (extras.status as ProductStatus)
    : "active";
  const db = getDatabase();

  transaction(() => {
    const categoryId = ensureCategoryId(merged.category);
    db.prepare(
      `UPDATE products SET
         name = @name, description = @description, price_cents = @priceCents,
         category_id = @categoryId, stock = @stock, emoji = @emoji, image = @image,
         slug = @slug, brand = @brand, sku = @sku, status = @status,
         extras_json = @extrasJson, updated_at = @updatedAt
       WHERE id = @id`
    ).run({
      id,
      name: merged.name,
      description: merged.description,
      priceCents: priceCents(merged.price),
      categoryId,
      stock: Math.max(0, Math.trunc(merged.stock)),
      emoji: merged.emoji || "📦",
      image: merged.image || FALLBACK_IMAGE,
      slug: optionalText(extras.slug),
      brand: optionalText(extras.brand),
      sku: optionalText(extras.sku),
      status,
      extrasJson: Object.keys(extras).length > 0 ? JSON.stringify(extras) : null,
      updatedAt: new Date().toISOString(),
    });
  });

  return getProduct(id);
}

export function deleteProduct(id: string): boolean {
  const info = getDatabase().prepare("DELETE FROM products WHERE id = ?").run(id);
  return info.changes > 0;
}
