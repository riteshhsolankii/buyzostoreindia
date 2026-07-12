import fs from "node:fs";
import path from "node:path";
import type { Customer, Product, SentEmail } from "./types";

// Simple file-backed JSON database living inside the project. Everything the
// store needs (catalog, customer leads, mail outbox) persists across server
// restarts — no external database required.

export type DbShape = {
  seeded: boolean;
  products: Product[];
  categories: string[];
  customers: Customer[];
  outbox: SentEmail[];
};

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "buyzo-db.json");

const globalStore = globalThis as unknown as { __buyzoDb?: DbShape };

function load(): DbShape {
  try {
    const raw = fs.readFileSync(DB_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<DbShape>;
    return {
      seeded: parsed.seeded ?? false,
      products: parsed.products ?? [],
      categories: parsed.categories ?? [],
      customers: parsed.customers ?? [],
      outbox: parsed.outbox ?? [],
    };
  } catch {
    // First run (or unreadable file) — start empty; products.ts seeds it.
    return {
      seeded: false,
      products: [],
      categories: [],
      customers: [],
      outbox: [],
    };
  }
}

export function getDb(): DbShape {
  if (!globalStore.__buyzoDb) {
    globalStore.__buyzoDb = load();
  }
  return globalStore.__buyzoDb;
}

/** Atomically write the current state to data/buyzo-db.json. */
export function saveDb(): void {
  const db = getDb();
  fs.mkdirSync(DB_DIR, { recursive: true });
  const tmp = `${DB_PATH}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), "utf8");
  fs.renameSync(tmp, DB_PATH);
}
