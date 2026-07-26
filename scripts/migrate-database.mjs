import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { createClient } from "@libsql/client";

const root = process.cwd();
dotenv.config({ path: path.join(root, ".env.local"), quiet: true });
dotenv.config({ path: path.join(root, ".env"), quiet: true });

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
  // Local file: make sure the directory exists before the client opens it.
  const filePath = path.resolve(root, url.slice("file:".length));
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  return { url };
}

/**
 * A migration file may hold several statements. libSQL executes one statement
 * per call, so split on semicolons that sit outside string literals, quoted
 * identifiers and comments. Comments matter: an apostrophe in prose ("somebody
 * else's") would otherwise look like the start of a string literal and swallow
 * every following semicolon.
 */
export function splitStatements(sql) {
  const statements = [];
  let current = "";
  let quote = null; // "'" or '"' while inside a literal/identifier

  for (let i = 0; i < sql.length; i += 1) {
    const char = sql[i];
    const next = sql[i + 1];

    if (!quote) {
      if (char === "-" && next === "-") {
        const end = sql.indexOf("\n", i);
        i = end === -1 ? sql.length : end - 1;
        continue;
      }
      if (char === "/" && next === "*") {
        const end = sql.indexOf("*/", i + 2);
        i = end === -1 ? sql.length : end + 1;
        continue;
      }
      if (char === "'" || char === '"') {
        quote = char;
      } else if (char === ";") {
        if (current.trim()) statements.push(current.trim());
        current = "";
        continue;
      }
    } else if (char === quote) {
      // A doubled quote is an escaped one, not a terminator.
      if (next === quote) {
        current += char + next;
        i += 1;
        continue;
      }
      quote = null;
    }

    current += char;
  }

  if (quote) {
    throw new Error("Unterminated string literal in migration SQL.");
  }
  if (current.trim()) statements.push(current.trim());
  return statements;
}

async function migrate() {
  const config = resolveConfig();
  const client = createClient(config);

  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS database_migrations (
        id TEXT PRIMARY KEY,
        applied_at TEXT NOT NULL
      ) STRICT
    `);

    const migrationsDir = path.join(root, "database", "migrations");
    const migrations = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    let applied = 0;
    for (const id of migrations) {
      const existing = await client.execute({
        sql: "SELECT 1 FROM database_migrations WHERE id = ?",
        args: [id],
      });
      if (existing.rows.length > 0) continue;

      const sql = fs.readFileSync(path.join(migrationsDir, id), "utf8");
      const tx = await client.transaction("write");
      try {
        for (const statement of splitStatements(sql)) {
          await tx.execute(statement);
        }
        await tx.execute({
          sql: "INSERT INTO database_migrations (id, applied_at) VALUES (?, ?)",
          args: [id, new Date().toISOString()],
        });
        await tx.commit();
      } catch (error) {
        await tx.rollback().catch(() => {});
        throw new Error(`Migration ${id} failed: ${error.message}`, {
          cause: error,
        });
      }
      console.log(`Applied ${id}`);
      applied += 1;
    }

    console.log(
      applied === 0
        ? `Database is already up to date (${config.url})`
        : `Applied ${applied} migration(s) to ${config.url}`
    );
  } finally {
    client.close();
  }
}

// Only migrate when run as a script, so tests can import splitStatements.
if (import.meta.main) {
  await migrate();
}
