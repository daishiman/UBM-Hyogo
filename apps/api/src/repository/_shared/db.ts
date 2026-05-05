import type { Env } from "../../env";

export interface D1Stmt {
  bind(...values: unknown[]): D1Stmt;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<{ results: T[] }>;
  run(): Promise<{ success: boolean; meta: { changes: number; last_row_id: number } }>;
}

// D1Db は Cloudflare の D1Database と構造互換な局所 alias として維持する
// (02c で導入した既存 unit test fixture との互換のため)。
export interface D1Db {
  prepare(sql: string): D1Stmt;
  exec(sql: string): Promise<{ count: number; duration: number }>;
  batch?(statements: D1Stmt[]): Promise<unknown[]>;
}

export interface DbCtx {
  readonly db: D1Db;
}

export const ctx = (env: Pick<Env, "DB">): DbCtx => ({
  db: env.DB as unknown as D1Db,
});

export const isUniqueConstraintError = (err: unknown): boolean => {
  if (!(err instanceof Error)) return false;
  const m = err.message;
  return m.includes("UNIQUE constraint") || m.includes("constraint failed");
};

export const intToBool = (v: number | null | undefined): boolean => v === 1;
export const boolToInt = (v: boolean): number => (v ? 1 : 0);
