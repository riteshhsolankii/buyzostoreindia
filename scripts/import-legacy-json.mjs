import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import Database from "better-sqlite3";

const root = process.cwd();
dotenv.config({ path: path.join(root, ".env.local"), quiet: true });
dotenv.config({ path: path.join(root, ".env"), quiet: true });

const legacyPath = path.join(root, "data", "buyzo-db.json");
const importMarker = "legacy_json_import_v1";
const catalogMarker = "catalog_seeded_v1";
const fallbackImage = "/products/default.svg";
const seedImages = new Map(
  ["p-1", "p-2", "p-3", "p-4", "p-5", "p-6"].map((id) => [
    id,
    `/products/${id}.svg`,
  ])
);
const statuses = new Set(["draft", "active", "out-of-stock", "archived"]);

function databasePath(url = process.env.DATABASE_URL) {
  if (!url) return path.join(root, "data", "buyzo.db");
  if (!url.startsWith("file:")) {
    throw new Error("DATABASE_URL must be a local SQLite file: URL.");
  }
  if (url.startsWith("file://")) return fileURLToPath(url);
  return path.resolve(root, decodeURIComponent(url.slice("file:".length)));
}

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function stringValue(value, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function optionalText(value) {
  const text = stringValue(value).trim();
  return text || null;
}

function normalizedKey(value) {
  return stringValue(value).trim().toLocaleLowerCase("en-US");
}

function asIsoDate(value) {
  const date = new Date(stringValue(value));
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function nonNegativeInteger(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.trunc(number)) : 0;
}

function priceCents(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) return 0;
  return Math.round(number * 100);
}

if (!fs.existsSync(legacyPath)) {
  throw new Error(`Legacy data file not found: ${legacyPath}`);
}

const resolvedDatabasePath = databasePath();
if (!fs.existsSync(resolvedDatabasePath)) {
  throw new Error(
    "SQLite database not found. Run `npm run db:migrate` before importing legacy data."
  );
}

const legacy = JSON.parse(fs.readFileSync(legacyPath, "utf8"));
const database = new Database(resolvedDatabasePath);
database.pragma("foreign_keys = ON");
database.pragma("busy_timeout = 5000");

try {
  const schemaReady = database
    .prepare(
      "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'app_meta'"
    )
    .get();
  if (!schemaReady) {
    throw new Error("SQLite schema is missing. Run `npm run db:migrate` first.");
  }

  const alreadyImported = database
    .prepare("SELECT value FROM app_meta WHERE key = ?")
    .get(importMarker);
  if (alreadyImported) {
    console.log("Legacy JSON data was already imported; nothing to do.");
    process.exit(0);
  }

  const existing = database
    .prepare(
      "SELECT (SELECT COUNT(*) FROM products) + (SELECT COUNT(*) FROM customers) + (SELECT COUNT(*) FROM email_outbox) AS count"
    )
    .get();
  if (existing.count > 0) {
    throw new Error(
      "SQLite database already contains application data. Refusing to merge legacy JSON automatically."
    );
  }

  const insertCategory = database.prepare(`
    INSERT INTO categories (id, name, name_key, position, created_at, updated_at)
    VALUES (@id, @name, @nameKey, @position, @createdAt, @updatedAt)
  `);
  const findCategory = database.prepare(
    "SELECT id FROM categories WHERE name_key = ?"
  );
  const insertProduct = database.prepare(`
    INSERT INTO products (
      id, name, description, price_cents, category_id, stock, emoji, image,
      slug, brand, sku, status, extras_json, display_order, created_at, updated_at
    ) VALUES (
      @id, @name, @description, @priceCents, @categoryId, @stock, @emoji, @image,
      @slug, @brand, @sku, @status, @extrasJson, @displayOrder, @createdAt, @updatedAt
    )
  `);
  const insertCustomer = database.prepare(`
    INSERT INTO customers (
      id, name, email, phone, password_hash, password_algorithm, created_at, updated_at
    ) VALUES (
      @id, @name, @email, @phone, @passwordHash, 'legacy-sha256', @createdAt, @updatedAt
    )
  `);
  const insertOutbox = database.prepare(`
    INSERT INTO email_outbox (to_email, subject, text, sent_at, delivered)
    VALUES (@to, @subject, @text, @sentAt, @delivered)
  `);
  const writeMeta = database.prepare(`
    INSERT INTO app_meta (key, value, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `);

  const importLegacy = database.transaction(() => {
    const now = new Date().toISOString();
    let categoryPosition = 0;

    const ensureCategory = (value) => {
      const name = stringValue(value).trim() || "General";
      const nameKey = normalizedKey(name);
      const existingCategory = findCategory.get(nameKey);
      if (existingCategory) return existingCategory.id;

      const id = `cat-${crypto.randomUUID().slice(0, 8)}`;
      insertCategory.run({
        id,
        name,
        nameKey,
        position: categoryPosition++,
        createdAt: now,
        updatedAt: now,
      });
      return id;
    };

    for (const category of Array.isArray(legacy.categories)
      ? legacy.categories
      : []) {
      ensureCategory(category);
    }

    for (const [displayOrder, rawProduct] of (
      Array.isArray(legacy.products) ? legacy.products : []
    ).entries()) {
      const product = asObject(rawProduct);
      const extras = asObject(product.extras);
      const status = statuses.has(extras.status) ? extras.status : "active";
      const id = optionalText(product.id) ?? `p-${crypto.randomUUID().slice(0, 8)}`;
      const categoryId = ensureCategory(product.category);

      insertProduct.run({
        id,
        name: optionalText(product.name) ?? "Untitled product",
        description: stringValue(product.description),
        priceCents: priceCents(product.price),
        categoryId,
        stock: nonNegativeInteger(product.stock),
        emoji: optionalText(product.emoji) ?? "📦",
        image:
          optionalText(product.image) ?? seedImages.get(id) ?? fallbackImage,
        slug: optionalText(extras.slug),
        brand: optionalText(extras.brand),
        sku: optionalText(extras.sku),
        status,
        extrasJson: JSON.stringify(extras),
        displayOrder,
        createdAt: asIsoDate(product.createdAt),
        updatedAt: now,
      });
    }

    for (const rawCustomer of Array.isArray(legacy.customers)
      ? legacy.customers
      : []) {
      const customer = asObject(rawCustomer);
      const createdAt = asIsoDate(customer.createdAt);
      insertCustomer.run({
        id: optionalText(customer.id) ?? `c-${crypto.randomUUID().slice(0, 8)}`,
        name: optionalText(customer.name) ?? "Customer",
        email: stringValue(customer.email).trim().toLowerCase(),
        phone: stringValue(customer.phone).trim(),
        passwordHash: stringValue(customer.passwordHash),
        createdAt,
        updatedAt: createdAt,
      });
    }

    for (const rawEmail of Array.isArray(legacy.outbox) ? legacy.outbox : []) {
      const email = asObject(rawEmail);
      insertOutbox.run({
        to: stringValue(email.to),
        subject: stringValue(email.subject),
        text: stringValue(email.text),
        sentAt: asIsoDate(email.sentAt),
        delivered: Boolean(email.delivered) ? 1 : 0,
      });
    }

    writeMeta.run(importMarker, now, now);
    writeMeta.run(catalogMarker, "legacy-import", now);
  });

  importLegacy();
  console.log("Imported legacy Buyzo data into the local SQLite database.");
} finally {
  database.close();
}
