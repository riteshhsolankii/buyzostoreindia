import "server-only";

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

type DatabaseConnection = Database.Database;

const globalStore = globalThis as unknown as {
  __buyzoDatabase?: DatabaseConnection;
};

function resolveDatabasePath(url = process.env.DATABASE_URL): string {
  if (!url) return path.join(process.cwd(), "data", "buyzo.db");
  if (!url.startsWith("file:")) {
    throw new Error("DATABASE_URL must be a local SQLite file: URL.");
  }
  if (url.startsWith("file://")) return fileURLToPath(url);
  return path.resolve(process.cwd(), decodeURIComponent(url.slice("file:".length)));
}

function applyMigrations(database: DatabaseConnection): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS database_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    ) STRICT;
  `);

  const migrationsDir = path.join(process.cwd(), "database", "migrations");
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
  }
}

export function getDatabase(): DatabaseConnection {
  if (globalStore.__buyzoDatabase) return globalStore.__buyzoDatabase;

  const databasePath = resolveDatabasePath();
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });

  const database = new Database(databasePath);
  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = ON");
  database.pragma("busy_timeout = 5000");
  applyMigrations(database);

  globalStore.__buyzoDatabase = database;
  return database;
}

export function transaction<T>(work: () => T): T {
  return getDatabase().transaction(work)();
}
