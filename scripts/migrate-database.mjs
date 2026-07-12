import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import Database from "better-sqlite3";

const root = process.cwd();
dotenv.config({ path: path.join(root, ".env.local") });
dotenv.config({ path: path.join(root, ".env") });

function databasePath(url = process.env.DATABASE_URL) {
  if (!url) return path.join(root, "data", "buyzo.db");
  if (!url.startsWith("file:")) {
    throw new Error("DATABASE_URL must be a local SQLite file: URL.");
  }
  if (url.startsWith("file://")) return fileURLToPath(url);
  return path.resolve(root, decodeURIComponent(url.slice("file:".length)));
}

function runMigrations(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS database_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    ) STRICT;
  `);

  const migrationsDir = path.join(root, "database", "migrations");
  const migrations = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();
  const findApplied = database.prepare(
    "SELECT 1 FROM database_migrations WHERE id = ?"
  );
  const recordApplied = database.prepare(
    "INSERT INTO database_migrations (id, applied_at) VALUES (?, ?)"
  );

  for (const id of migrations) {
    if (findApplied.get(id)) continue;
    const sql = fs.readFileSync(path.join(migrationsDir, id), "utf8");
    database.transaction(() => {
      database.exec(sql);
      recordApplied.run(id, new Date().toISOString());
    })();
    console.log(`Applied ${id}`);
  }
}

const resolvedPath = databasePath();
fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
const database = new Database(resolvedPath);

try {
  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = ON");
  database.pragma("busy_timeout = 5000");
  runMigrations(database);
  console.log(`SQLite database is ready at ${resolvedPath}`);
} finally {
  database.close();
}
