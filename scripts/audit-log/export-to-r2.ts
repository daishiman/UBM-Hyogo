// Issue #315: application audit_log cold storage exporter
// D1 audit_log → redact → gzip → R2 PUT → 2-phase commit manifest (D1)
// 純粋関数として deps を inject。CLI と test 双方で利用する。

import { createHash, randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gzip } from "node:zlib";
import { promisify } from "node:util";
import { redactForExport } from "../../apps/api/src/lib/audit/redact.ts";

const gzipAsync = promisify(gzip);
const execFileAsync = promisify(execFile);
const SELECT_BATCH_SIZE = 1000;
const RAW_EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
const RAW_PHONE_RE = /\b(?:\+?\d{1,3}[-\s]?)?(?:\(?\d{2,4}\)?[-\s]?)\d{2,4}[-\s]?\d{3,4}\b/;
const RAW_ADDRESS_RE =
  /(?:〒\s*)?\d{3}-?\d{4}\s*[^\s,，。]*|(?:北海道|東京都|大阪府|京都府|.{2,3}県)[^\s,，。]{2,}(?:市|区|町|村)[^\s,，。]*/;

// --- 局所 D1 / R2 interface（Workers runtime と互換、CLI からも diff なく動く） ---

export interface D1PreparedLike {
  bind(...values: unknown[]): D1PreparedLike;
  run(): Promise<unknown>;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<{ results: T[] }>;
}

export interface D1Like {
  prepare(sql: string): D1PreparedLike;
}

export interface R2PutResult {
  etag: string;
}

export interface R2Client {
  putObject(
    key: string,
    body: Uint8Array,
    opts: {
      contentType: string;
      contentEncoding: string;
      metadata: Record<string, string>;
    },
  ): Promise<R2PutResult>;
}

// --- 型 ---

export type ExportManifestStatus = "pending" | "completed" | "failed";

export interface ExportRunResult {
  exportRunId: string;
  partitionKey: string; // YYYY-MM-DD
  status: ExportManifestStatus | "skipped";
  rowCount: number;
  uncompressedBytes: number;
  compressedBytes: number;
  sha256: string;
  objectKey: string | null;
  errorMessage: string | null;
}

export interface ExportOptions {
  targetDate?: Date; // 既定: 前日 (UTC)
  exportRunId?: string;
  dryRun?: boolean;
}

export interface ExportDeps {
  db: D1Like;
  r2: R2Client;
  now?: () => Date;
}

// --- helpers ---

const DAY_MS = 24 * 60 * 60 * 1000;

const normalizeUtcDay = (d: Date): Date => {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
};

const defaultTargetDate = (now: Date): Date => {
  const today = normalizeUtcDay(now);
  return new Date(today.getTime() - DAY_MS);
};

const fmtDay = (d: Date): { yyyy: number; mm: number; dd: number } => ({
  yyyy: d.getUTCFullYear(),
  mm: d.getUTCMonth() + 1,
  dd: d.getUTCDate(),
});

const buildObjectKey = (
  yyyy: number,
  mm: number,
  dd: number,
  exportRunId: string,
): string =>
  `application/yyyy=${yyyy}/mm=${String(mm).padStart(2, "0")}/dd=${String(
    dd,
  ).padStart(2, "0")}/audit-log-${exportRunId}.jsonl.gz`;

// audit_log 行を redact し、JSONL の 1 行へ整形する
const formatRowToJsonl = (row: {
  audit_id: string;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  before_json: string | null;
  after_json: string | null;
  created_at: string;
}): string => {
  const redacted = redactForExport({
    beforeJson: row.before_json,
    afterJson: row.after_json,
    actorEmail: row.actor_email,
  });
  return JSON.stringify({
    auditId: row.audit_id,
    actorId: row.actor_id,
    actorEmailMasked: redacted.actorEmailMasked,
    action: row.action,
    targetType: row.target_type,
    targetId: row.target_id,
    beforeJson: redacted.beforeJson,
    afterJson: redacted.afterJson,
    createdAt: row.created_at,
  });
};

export class RedactionGuardError extends Error {
  constructor(public readonly pattern: "email" | "phone" | "address") {
    super(`redaction guard failed: raw ${pattern} pattern remains in export JSONL`);
    this.name = "RedactionGuardError";
  }
}

export const guardExportJsonlOrThrow = (jsonl: string): void => {
  if (RAW_EMAIL_RE.test(jsonl)) throw new RedactionGuardError("email");
  if (RAW_PHONE_RE.test(jsonl)) throw new RedactionGuardError("phone");
  if (RAW_ADDRESS_RE.test(jsonl)) throw new RedactionGuardError("address");
};

// --- core ---

export async function exportAuditLogToR2(
  deps: ExportDeps,
  opts: ExportOptions = {},
): Promise<ExportRunResult> {
  const now = (deps.now ?? (() => new Date()))();
  const target = opts.targetDate
    ? normalizeUtcDay(opts.targetDate)
    : defaultTargetDate(now);
  const next = new Date(target.getTime() + DAY_MS);
  const { yyyy, mm, dd } = fmtDay(target);
  const partKey = `${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
  const exportRunId = opts.exportRunId ?? randomUUID();
  const dryRun = opts.dryRun === true;

  // 既存 manifest の冪等 skip
  const existing = await deps.db
    .prepare(
      `SELECT id, status, object_key AS objectKey FROM audit_log_export_manifest WHERE yyyy=?1 AND mm=?2 AND dd=?3 LIMIT 1`,
    )
    .bind(yyyy, mm, dd)
    .first<{ id: string; status: ExportManifestStatus; objectKey: string }>();
  if (existing && existing.status === "completed") {
    return {
      exportRunId,
      partitionKey: partKey,
      status: "skipped",
      rowCount: 0,
      uncompressedBytes: 0,
      compressedBytes: 0,
      sha256: "",
      objectKey: null,
      errorMessage: null,
    };
  }

  // D1 SELECT (batched)
  const rows: Array<{
    audit_id: string;
    actor_id: string | null;
    actor_email: string | null;
    action: string;
    target_type: string;
    target_id: string | null;
    before_json: string | null;
    after_json: string | null;
    created_at: string;
  }> = [];
  let offset = 0;
  while (true) {
    const res = await deps.db
      .prepare(
        `SELECT audit_id, actor_id, actor_email, action, target_type, target_id, before_json, after_json, created_at
         FROM audit_log
         WHERE created_at >= ?1 AND created_at < ?2
         ORDER BY created_at ASC, audit_id ASC
         LIMIT ?3 OFFSET ?4`,
      )
      .bind(target.toISOString(), next.toISOString(), SELECT_BATCH_SIZE, offset)
      .all<(typeof rows)[number]>();
    rows.push(...res.results);
    if (res.results.length < SELECT_BATCH_SIZE) break;
    offset += SELECT_BATCH_SIZE;
  }

  const jsonl =
    rows.map(formatRowToJsonl).join("\n") + (rows.length > 0 ? "\n" : "");
  guardExportJsonlOrThrow(jsonl);
  const sha256 = createHash("sha256").update(jsonl).digest("hex");
  const uncompressedBytes = Buffer.byteLength(jsonl, "utf8");
  const gzipped = await gzipAsync(Buffer.from(jsonl, "utf8"));
  const compressedBytes = gzipped.byteLength;
  const objectKey =
    existing && existing.status !== "completed"
      ? existing.objectKey
      : buildObjectKey(yyyy, mm, dd, exportRunId);
  const startedAt = now.toISOString();

  if (dryRun) {
    return {
      exportRunId,
      partitionKey: partKey,
      status: "pending",
      rowCount: rows.length,
      uncompressedBytes,
      compressedBytes,
      sha256,
      objectKey,
      errorMessage: null,
    };
  }

  // 2-phase commit: pending insert
  const id = existing?.id ?? randomUUID();
  if (!existing) {
    await deps.db
      .prepare(
        `INSERT INTO audit_log_export_manifest
         (id, export_run_id, yyyy, mm, dd, object_key, row_count, uncompressed_bytes, compressed_bytes, sha256, redaction_policy_version, status, started_at)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,'v1','pending',?11)`,
      )
      .bind(
        id,
        exportRunId,
        yyyy,
        mm,
        dd,
        objectKey,
        rows.length,
        uncompressedBytes,
        compressedBytes,
        sha256,
        startedAt,
      )
      .run();
  } else {
    await deps.db
      .prepare(
        `UPDATE audit_log_export_manifest
         SET export_run_id=?2, row_count=?3, uncompressed_bytes=?4, compressed_bytes=?5, sha256=?6, redaction_policy_version='v1', status='pending', started_at=?7, completed_at=NULL, error_message=NULL
         WHERE id=?1`,
      )
      .bind(
        id,
        exportRunId,
        rows.length,
        uncompressedBytes,
        compressedBytes,
        sha256,
        startedAt,
      )
      .run();
  }

  try {
    const put = await deps.r2.putObject(objectKey, new Uint8Array(gzipped), {
      contentType: "application/x-ndjson",
      contentEncoding: "gzip",
      metadata: {
        "row-count": String(rows.length),
        sha256,
        "policy-version": "v1",
        "export-run-id": exportRunId,
      },
    });

    const completedAt = new Date().toISOString();
    await deps.db
      .prepare(
        `UPDATE audit_log_export_manifest
         SET status='completed', r2_etag=?2, completed_at=?3, error_message=NULL
         WHERE id=?1`,
      )
      .bind(id, put.etag, completedAt)
      .run();

    return {
      exportRunId,
      partitionKey: partKey,
      status: "completed",
      rowCount: rows.length,
      uncompressedBytes,
      compressedBytes,
      sha256,
      objectKey,
      errorMessage: null,
    };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    const completedAt = new Date().toISOString();
    try {
      await deps.db
        .prepare(
          `UPDATE audit_log_export_manifest
           SET status='failed', error_message=?2, completed_at=?3
           WHERE id=?1`,
        )
        .bind(id, errMsg, completedAt)
        .run();
    } catch {
      // suppress nested failure
    }
    return {
      exportRunId,
      partitionKey: partKey,
      status: "failed",
      rowCount: rows.length,
      uncompressedBytes,
      compressedBytes,
      sha256,
      objectKey,
      errorMessage: errMsg,
    };
  }
}

type CliArgs = {
  env: "staging" | "production";
  dryRun: boolean;
  targetDate?: Date;
};

function parseCliArgs(argv: string[]): CliArgs {
  let env: CliArgs["env"] = "staging";
  let dryRun = true;
  let targetDate: Date | undefined;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === "--env" && next) {
      if (next !== "staging" && next !== "production") {
        throw new Error(`invalid --env: ${next}`);
      }
      env = next;
      i++;
    } else if (arg === "--dry-run") {
      dryRun = true;
    } else if (arg === "--apply") {
      dryRun = false;
    } else if (arg === "--target-date" && next) {
      const parsed = new Date(`${next}T00:00:00.000Z`);
      if (Number.isNaN(parsed.getTime())) {
        throw new Error(`invalid --target-date: ${next}`);
      }
      targetDate = parsed;
      i++;
    }
  }
  return { env, dryRun, ...(targetDate ? { targetDate } : {}) };
}

async function runCli(): Promise<void> {
  const args = parseCliArgs(process.argv.slice(2));
  const target = args.targetDate?.toISOString().slice(0, 10) ?? undefined;
  const result = await exportAuditLogToR2(
    {
      db: createWranglerD1(args.env),
      r2: createWranglerR2(args.env, args.dryRun),
    },
    {
      dryRun: args.dryRun,
      ...(args.targetDate ? { targetDate: args.targetDate } : {}),
    },
  );
  process.stdout.write(
    `${JSON.stringify(
      {
        ok: true,
        mode: args.dryRun ? "dry-run" : "apply",
        env: args.env,
        targetDate: target ?? result.partitionKey,
        result,
      },
      null,
      2,
    )}\n`,
  );
}

const shellSqlString = (value: unknown): string => {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return String(value);
  return `'${String(value).replace(/'/g, "''")}'`;
};

const bindSql = (sql: string, values: unknown[]): string => {
  let out = sql;
  [...values].forEach((_, reverseIndex) => {
    const index = values.length - reverseIndex - 1;
    out = out.replaceAll(`?${index + 1}`, shellSqlString(values[index]));
  });
  return out;
};

const parseD1Json = <T>(stdout: string): { results: T[]; meta?: { changes?: number } } => {
  const parsed = JSON.parse(stdout) as unknown;
  const first = Array.isArray(parsed) ? parsed[0] : parsed;
  const record = first as { results?: T[]; result?: { results?: T[] }; meta?: { changes?: number } };
  return {
    results: record.results ?? record.result?.results ?? [],
    ...(record.meta ? { meta: record.meta } : {}),
  };
};

const createWranglerD1 = (env: CliArgs["env"]): D1Like => ({
  prepare(sql: string): D1PreparedLike {
    let values: unknown[] = [];
    const runCommand = async () => {
      const command = bindSql(sql, values);
      const { stdout } = await execFileAsync("pnpm", [
        "exec",
        "wrangler",
        "d1",
        "execute",
        env === "production" ? "ubm-hyogo-db-prod" : "ubm-hyogo-db-staging",
        "--config",
        "apps/api/wrangler.toml",
        "--env",
        env,
        "--remote",
        "--json",
        "--command",
        command,
      ]);
      return stdout;
    };
    const prepared: D1PreparedLike = {
      bind(...nextValues: unknown[]) {
        values = nextValues;
        return prepared;
      },
      async run() {
        const stdout = await runCommand();
        return parseD1Json(stdout);
      },
      async first<T = unknown>() {
        const stdout = await runCommand();
        return parseD1Json<T>(stdout).results[0] ?? null;
      },
      async all<T = unknown>() {
        const stdout = await runCommand();
        return { results: parseD1Json<T>(stdout).results };
      },
    };
    return prepared;
  },
});

const createWranglerR2 = (env: CliArgs["env"], dryRun: boolean): R2Client => {
  const bucket =
    env === "production"
      ? "ubm-audit-cold-storage-app-prod"
      : "ubm-audit-cold-storage-app-staging";
  return {
    async putObject(key, body, opts) {
      if (dryRun) return { etag: "dry-run" };
      const dir = await mkdtemp(join(tmpdir(), "audit-log-r2-"));
      const file = join(dir, "audit-log.jsonl.gz");
      try {
        await writeFile(file, body);
        const { stdout } = await execFileAsync("pnpm", [
          "exec",
          "wrangler",
          "r2",
          "object",
          "put",
          `${bucket}/${key}`,
          "--config",
          "apps/api/wrangler.toml",
          "--env",
          env,
          "--remote",
          "--file",
          file,
          "--content-type",
          opts.contentType,
          "--content-encoding",
          opts.contentEncoding,
          "--force",
        ]);
        const etag = /etag[:=]\s*"?([^"\s]+)"?/i.exec(stdout)?.[1] ?? "wrangler-r2-put";
        return { etag };
      } finally {
        await rm(dir, { recursive: true, force: true });
      }
    },
  };
};

if (process.argv[1]?.endsWith("scripts/audit-log/export-to-r2.ts")) {
  runCli().catch((err) => {
    process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
    process.exit(1);
  });
}
