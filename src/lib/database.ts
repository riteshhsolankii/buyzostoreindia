import "server-only";

import { createClient, type Client, type InArgs } from "@libsql/client";

const globalStore = globalThis as unknown as {
  __buyzoDatabase?: Client;
};

/**
 * Resolve the database to talk to. Accepts a hosted libSQL/Turso URL
 * (`libsql://…`, needs TURSO_AUTH_TOKEN) or a local SQLite file (`file:…`),
 * so the same code runs on Vercel and on a laptop.
 */
function resolveConfig(): { url: string; authToken?: string } {
  const configured =
    process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL ?? null;

  // A local SQLite file cannot work on a serverless host: the filesystem is
  // read-only and per-invocation, and data/ is git-ignored so it is not even
  // deployed. Failing here beats an opaque "unable to open database file".
  if (!configured && process.env.VERCEL) {
    throw new Error(
      "TURSO_DATABASE_URL is not set. A hosted libSQL database is required on Vercel — add TURSO_DATABASE_URL and TURSO_AUTH_TOKEN to the project's environment variables."
    );
  }

  const url = configured ?? "file:data/buyzo.db";
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url.startsWith("file:") && !authToken) {
    throw new Error(
      "TURSO_AUTH_TOKEN is required for a remote libSQL database URL."
    );
  }
  return authToken ? { url, authToken } : { url };
}

export function getDatabase(): Client {
  if (globalStore.__buyzoDatabase) return globalStore.__buyzoDatabase;
  globalStore.__buyzoDatabase = createClient(resolveConfig());
  return globalStore.__buyzoDatabase;
}

/** Every row this app reads maps cleanly onto a plain object. */
type QueryRunner = {
  all<T>(sql: string, args?: InArgs): Promise<T[]>;
  one<T>(sql: string, args?: InArgs): Promise<T | undefined>;
  /** Returns the number of rows the statement changed. */
  run(sql: string, args?: InArgs): Promise<number>;
};

function runnerFor(execute: Client["execute"]): QueryRunner {
  return {
    async all<T>(sql: string, args: InArgs = []): Promise<T[]> {
      const result = await execute({ sql, args });
      return result.rows as unknown as T[];
    },
    async one<T>(sql: string, args: InArgs = []): Promise<T | undefined> {
      const result = await execute({ sql, args });
      return result.rows[0] as unknown as T | undefined;
    },
    async run(sql: string, args: InArgs = []): Promise<number> {
      const result = await execute({ sql, args });
      return result.rowsAffected;
    },
  };
}

function clientRunner(): QueryRunner {
  const client = getDatabase();
  return runnerFor((stmt) => client.execute(stmt));
}

export function all<T>(sql: string, args?: InArgs): Promise<T[]> {
  return clientRunner().all<T>(sql, args);
}

export function one<T>(sql: string, args?: InArgs): Promise<T | undefined> {
  return clientRunner().one<T>(sql, args);
}

export function run(sql: string, args?: InArgs): Promise<number> {
  return clientRunner().run(sql, args);
}

/**
 * Run `work` inside a write transaction. The callback gets its own runner —
 * every read and write must go through it, otherwise the statement lands
 * outside the transaction on a separate connection.
 */
export async function transaction<T>(
  work: (tx: QueryRunner) => Promise<T>
): Promise<T> {
  const tx = await getDatabase().transaction("write");
  try {
    const result = await work(runnerFor((stmt) => tx.execute(stmt)));
    await tx.commit();
    return result;
  } catch (error) {
    // A failed stream can make rollback throw too; the original error matters.
    await tx.rollback().catch(() => {});
    throw error;
  }
}

export type { QueryRunner };
