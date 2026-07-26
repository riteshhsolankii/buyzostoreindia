import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { createClient } from "@libsql/client";

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

// Mirrors src/lib/database.ts: a hosted libSQL/Turso URL or a local file.
function resolveConfig() {
  const url =
    process.env.TURSO_DATABASE_URL ??
    process.env.DATABASE_URL ??
    "file:data/buyzo.db";
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url.startsWith("file:")) {
    if (!authToken) {
      throw new Error(
        "TURSO_AUTH_TOKEN is required for a remote libSQL database URL."
      );
    }
    return { url, authToken };
  }
  return { url };
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

const legacy = JSON.parse(fs.readFileSync(legacyPath, "utf8"));
const config = resolveConfig();
const client = createClient(config);

try {
  const schemaReady = await client.execute(
    "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'app_meta'"
  );
  if (schemaReady.rows.length === 0) {
    throw new Error("Database schema is missing. Run `npm run db:migrate` first.");
  }

  const alreadyImported = await client.execute({
    sql: "SELECT value FROM app_meta WHERE key = ?",
    args: [importMarker],
  });
  if (alreadyImported.rows.length > 0) {
    console.log("Legacy JSON data was already imported; nothing to do.");
    process.exit(0);
  }

  const existing = await client.execute(
    "SELECT (SELECT COUNT(*) FROM products) + (SELECT COUNT(*) FROM customers) + (SELECT COUNT(*) FROM email_outbox) AS count"
  );
  if (existing.rows[0].count > 0) {
    throw new Error(
      "Database already contains application data. Refusing to merge legacy JSON automatically."
    );
  }

  const insertCategory = `
    INSERT INTO categories (id, name, name_key, position, created_at, updated_at)
    VALUES (@id, @name, @nameKey, @position, @createdAt, @updatedAt)
  `;
  const insertProduct = `
    INSERT INTO products (
      id, name, description, price_cents, category_id, stock, emoji, image,
      slug, brand, sku, status, extras_json, display_order, created_at, updated_at
    ) VALUES (
      @id, @name, @description, @priceCents, @categoryId, @stock, @emoji, @image,
      @slug, @brand, @sku, @status, @extrasJson, @displayOrder, @createdAt, @updatedAt
    )
  `;
  const insertCustomer = `
    INSERT INTO customers (
      id, name, email, phone, password_hash, password_algorithm, created_at, updated_at
    ) VALUES (
      @id, @name, @email, @phone, @passwordHash, 'legacy-sha256', @createdAt, @updatedAt
    )
  `;
  const insertOutbox = `
    INSERT INTO email_outbox (to_email, subject, text, sent_at, delivered)
    VALUES (@to, @subject, @text, @sentAt, @delivered)
  `;
  const writeMeta = `
    INSERT INTO app_meta (key, value, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `;

  const tx = await client.transaction("write");
  try {
    const now = new Date().toISOString();
    let categoryPosition = 0;

    const ensureCategory = async (value) => {
      const name = stringValue(value).trim() || "General";
      const nameKey = normalizedKey(name);
      const found = await tx.execute({
        sql: "SELECT id FROM categories WHERE name_key = ?",
        args: [nameKey],
      });
      if (found.rows.length > 0) return found.rows[0].id;

      const id = `cat-${crypto.randomUUID().slice(0, 8)}`;
      await tx.execute({
        sql: insertCategory,
        args: {
          id,
          name,
          nameKey,
          position: categoryPosition++,
          createdAt: now,
          updatedAt: now,
        },
      });
      return id;
    };

    for (const category of Array.isArray(legacy.categories)
      ? legacy.categories
      : []) {
      await ensureCategory(category);
    }

    for (const [displayOrder, rawProduct] of (
      Array.isArray(legacy.products) ? legacy.products : []
    ).entries()) {
      const product = asObject(rawProduct);
      const extras = asObject(product.extras);
      const status = statuses.has(extras.status) ? extras.status : "active";
      const id = optionalText(product.id) ?? `p-${crypto.randomUUID().slice(0, 8)}`;
      const categoryId = await ensureCategory(product.category);

      await tx.execute({
        sql: insertProduct,
        args: {
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
        },
      });
    }

    for (const rawCustomer of Array.isArray(legacy.customers)
      ? legacy.customers
      : []) {
      const customer = asObject(rawCustomer);
      const createdAt = asIsoDate(customer.createdAt);
      await tx.execute({
        sql: insertCustomer,
        args: {
          id: optionalText(customer.id) ?? `c-${crypto.randomUUID().slice(0, 8)}`,
          name: optionalText(customer.name) ?? "Customer",
          email: stringValue(customer.email).trim().toLowerCase(),
          phone: stringValue(customer.phone).trim(),
          passwordHash: stringValue(customer.passwordHash),
          createdAt,
          updatedAt: createdAt,
        },
      });
    }

    for (const rawEmail of Array.isArray(legacy.outbox) ? legacy.outbox : []) {
      const email = asObject(rawEmail);
      await tx.execute({
        sql: insertOutbox,
        args: {
          to: stringValue(email.to),
          subject: stringValue(email.subject),
          text: stringValue(email.text),
          sentAt: asIsoDate(email.sentAt),
          delivered: Boolean(email.delivered) ? 1 : 0,
        },
      });
    }

    await tx.execute({ sql: writeMeta, args: [importMarker, now, now] });
    await tx.execute({ sql: writeMeta, args: [catalogMarker, "legacy-import", now] });
    await tx.commit();
  } catch (error) {
    await tx.rollback().catch(() => {});
    throw error;
  }

  console.log(`Imported legacy Buyzo data into ${config.url}`);
} finally {
  client.close();
}
