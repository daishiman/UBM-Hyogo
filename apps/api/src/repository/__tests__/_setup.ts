// in-memory D1 fixture loader（02a / 02b / 02c 共通）
// AC-9: setupD1() が共通利用可能。signature 統一。
//
// 注意: Cloudflare Workers の D1Database 型に厳密に揃えると types のバージョンずれが起きるため、
//       type-cast で吸収する。test 専用なので type-safety は loadFixtures 側で確保する。
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Miniflare } from "miniflare";
import type { D1Database } from "@cloudflare/workers-types";
import { ctx, type DbCtx } from "../_shared/db";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, "../../../../..");
const MIGRATIONS_DIR = join(REPO_ROOT, "apps/api/migrations");

export interface InMemoryD1 {
  ctx: DbCtx;
  db: D1Database;
  loadFixtures: (loaders: FixtureLoader[]) => Promise<void>;
  reset: () => Promise<void>;
  dispose: () => Promise<void>;
}

export type FixtureLoader = (db: D1Database) => Promise<void>;

const readMigrations = (): string[] => {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  return files.map((f) => readFileSync(join(MIGRATIONS_DIR, f), "utf8"));
};

const stripComments = (sql: string): string =>
  sql
    .split("\n")
    .map((line) => {
      // 行頭 / 行内の `-- comment` を除去（文字列リテラル中の '--' は無視できる前提の単純化）
      const idx = line.indexOf("--");
      return idx >= 0 ? line.slice(0, idx) : line;
    })
    .join("\n");

const splitStatements = (sql: string): string[] => {
  // 行頭コメントを落としてから ; 分割。CREATE VIEW 等で BEGIN..END を含む場合は要注意。
  return stripComments(sql)
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
};

const TABLES = [
  "identity_conflict_dismissals",
  "identity_aliases",
  "identity_merge_audit",
  "audit_log",
  "schema_aliases",
  "magic_tokens",
  "sync_jobs",
  "sync_job_logs",
  "sync_locks",
  "admin_users",
  "deleted_members",
  "admin_member_notes",
  "tag_assignment_queue",
  "member_tags",
  "tag_definitions",
  "member_attendance",
  "meeting_sessions",
  "member_status",
  "member_identities",
  "member_field_visibility",
  "response_fields",
  "response_sections",
  "member_responses",
  "schema_aliases",
  "schema_diff_queue",
  "schema_questions",
  "schema_versions",
];

let mfInstance: Miniflare | null = null;

const ensureMiniflare = async (): Promise<Miniflare> => {
  if (mfInstance) return mfInstance;
  mfInstance = new Miniflare({
    modules: true,
    script: "export default { fetch() { return new Response('ok'); } };",
    d1Databases: ["DB"],
  });
  return mfInstance;
};

export const setupD1 = async (): Promise<InMemoryD1> => {
  const mf = await ensureMiniflare();
  const db = (await mf.getD1Database("DB")) as unknown as D1Database;

  // migration を idempotent に流す（IF NOT EXISTS / IF EXISTS 前提）
  const migrations = readMigrations();
  for (const sql of migrations) {
    for (const stmt of splitStatements(sql)) {
      try {
        await db.exec(stmt.replace(/\n/g, " "));
      } catch (err) {
        // 既に存在する場合などは skip（再利用する instance のため）
        const msg = (err as Error).message ?? "";
        if (!/already exists|duplicate/i.test(msg)) throw err;
      }
    }
  }

  // 全テーブルを毎回 truncate（in-memory なので速い）
  await truncateAll(db);

  return {
    ctx: ctx({ DB: db }),
    db,
    loadFixtures: async (loaders) => {
      for (const fn of loaders) await fn(db);
    },
    reset: async () => {
      await truncateAll(db);
    },
    dispose: async () => {
      // 各 test で dispose しない（次の test 用に残す）。process 終了時に自動解放。
    },
  };
};

const truncateAll = async (db: D1Database): Promise<void> => {
  for (const t of TABLES) {
    try {
      await db.exec(`DELETE FROM ${t}`);
    } catch {
      // テーブルが未作成の場合は無視
    }
  }
};

// プロセス終了時に Miniflare を停止
if (typeof process !== "undefined") {
  process.on("beforeExit", async () => {
    if (mfInstance) {
      await mfInstance.dispose();
      mfInstance = null;
    }
  });
}
