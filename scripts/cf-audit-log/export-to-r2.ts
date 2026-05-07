import { createHash, randomUUID } from "node:crypto";
import { gzip } from "node:zlib";
import { promisify } from "node:util";
import { buildObjectKey, enumerateDayPartitions, normalizeUtcDay } from "./object-key.ts";
import { guardJsonlOrThrow } from "./redaction-guard.ts";
import { RedactionViolationError, type ExportManifestRow } from "./types.ts";
import type { R2Client } from "./r2-client.ts";
import type { D1Like } from "./manifest-store.ts";
import type { ManifestStore } from "./manifest-store.ts";

const gzipAsync = promisify(gzip);
const SELECT_BATCH_SIZE = 1000;

export type ReportIssueFn = (input: {
  title: string;
  body: string;
  labels: string[];
}) => Promise<void>;

export type ExportToR2Deps = {
  db: D1Like;
  r2: R2Client;
  manifest: ManifestStore;
  reportIssue: ReportIssueFn;
  now?: () => Date;
};

export type ExportToR2Options = {
  windowFromUtc?: Date;
  windowToUtc?: Date;
  exportRunId?: string;
  dryRun?: boolean;
};

export type ExportToR2Result = {
  manifests: ExportManifestRow[];
  failedPartitions: Array<{ yyyy: number; mm: number; dd: number; error: string }>;
  totalRowCount: number;
  totalCompressedBytes: number;
  exportRunId: string;
};

type AuditLogRow = {
  id: string;
  occurred_at: string;
  occurred_at_ms: number;
  [k: string]: unknown;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function defaultWindow(now: Date): { fromUtc: Date; toUtc: Date } {
  const day0 = normalizeUtcDay(now);
  return {
    fromUtc: new Date(day0.getTime() - 29 * DAY_MS),
    toUtc: new Date(day0.getTime() - 26 * DAY_MS),
  };
}

async function selectPartitionRows(
  db: D1Like,
  startUtc: Date,
  endUtc: Date,
): Promise<AuditLogRow[]> {
  const rows: AuditLogRow[] = [];
  let offset = 0;
  while (true) {
    const res = await db
      .prepare(
        `SELECT * FROM cf_audit_log
           WHERE occurred_at >= ? AND occurred_at < ?
           ORDER BY occurred_at_ms ASC, id ASC
           LIMIT ? OFFSET ?`,
      )
      .bind(startUtc.toISOString(), endUtc.toISOString(), SELECT_BATCH_SIZE, offset)
      .all<AuditLogRow>();
    rows.push(...res.results);
    if (res.results.length < SELECT_BATCH_SIZE) break;
    offset += SELECT_BATCH_SIZE;
  }
  return rows;
}

function redactIpForColdStorage(ip: string): string {
  if (ip.includes(":")) {
    const parts = ip.split(":").filter(Boolean);
    const prefix = parts.slice(0, 3).join(":") || "ipv6";
    return `${prefix}::/48`;
  }
  const parts = ip.split(".");
  if (parts.length !== 4) return "redacted-ip";
  return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
}

function emailDomain(email: string): string {
  const at = email.lastIndexOf("@");
  return at >= 0 ? email.slice(at + 1).toLowerCase() : "redacted";
}

function toColdStorageRow(row: AuditLogRow): Record<string, unknown> {
  const out: Record<string, unknown> = { ...row };

  if (typeof row.actor_ip === "string") {
    out.actor_ip = redactIpForColdStorage(row.actor_ip);
  }
  if (typeof row.actor_ua === "string") {
    out.actor_ua = "redacted-user-agent";
  }
  if (typeof row.actor_email === "string") {
    out.actor_email_domain = emailDomain(row.actor_email);
    delete out.actor_email;
  }

  // raw_json may contain full IPs, emails, user agents, or token-shaped values.
  delete out.raw_json;
  out.raw_json_redacted = true;

  return out;
}

export async function exportToR2(
  deps: ExportToR2Deps,
  opts: ExportToR2Options = {},
): Promise<ExportToR2Result> {
  const now = (deps.now ?? (() => new Date()))();
  const { fromUtc: defaultFrom, toUtc: defaultTo } = defaultWindow(now);
  const windowFromUtc = opts.windowFromUtc
    ? normalizeUtcDay(opts.windowFromUtc)
    : defaultFrom;
  const windowToUtc = opts.windowToUtc ? normalizeUtcDay(opts.windowToUtc) : defaultTo;
  const exportRunId = opts.exportRunId ?? randomUUID();
  const dryRun = opts.dryRun === true;

  const partitions = enumerateDayPartitions(windowFromUtc, windowToUtc);
  const manifests: ExportManifestRow[] = [];
  const failed: ExportToR2Result["failedPartitions"] = [];
  let totalRowCount = 0;
  let totalCompressedBytes = 0;

  for (const part of partitions) {
    const partKey = `${part.yyyy}-${String(part.mm).padStart(2, "0")}-${String(part.dd).padStart(2, "0")}`;
    try {
      const existing = await deps.manifest.findByPartition(part.yyyy, part.mm, part.dd);
      if (existing && existing.status === "completed") {
        // 冪等 skip
        manifests.push(existing);
        continue;
      }

      const rows = await selectPartitionRows(deps.db, part.startUtc, part.endUtc);
      const exportRows = rows.map(toColdStorageRow);
      const jsonl = exportRows.map((r) => JSON.stringify(r)).join("\n") +
        (exportRows.length > 0 ? "\n" : "");

      // fail-closed redaction guard
      guardJsonlOrThrow(jsonl);

      const sha256 = createHash("sha256").update(jsonl).digest("hex");
      const uncompressedBytes = Buffer.byteLength(jsonl, "utf8");
      const gzipped = await gzipAsync(Buffer.from(jsonl, "utf8"));
      const compressedBytes = gzipped.byteLength;
      const objectKey = buildObjectKey(part.startUtc).toString();

      // eslint-disable-next-line no-console
      console.log(
        `[export-to-r2] partition=${partKey} rows=${rows.length} sha256=${sha256.slice(0, 12)}… key=${objectKey} bytes=${compressedBytes}`,
      );

      if (dryRun) {
        manifests.push({
          id: `dryrun-${partKey}`,
          exportRunId,
          yyyy: part.yyyy,
          mm: part.mm,
          dd: part.dd,
          objectKey,
          rowCount: rows.length,
          uncompressedBytes,
          compressedBytes,
          sha256,
          r2Etag: null,
          redactionPolicyVersion: "v1",
          status: "pending",
          startedAt: now.toISOString(),
          completedAt: null,
          errorMessage: null,
        });
        totalRowCount += rows.length;
        totalCompressedBytes += compressedBytes;
        continue;
      }

      const id = existing?.id ?? randomUUID();
      const startedAt = now.toISOString();

      // 既存 failed の retry または新規 pending insert
      if (!existing) {
        await deps.manifest.insertPending({
          id,
          exportRunId,
          yyyy: part.yyyy,
          mm: part.mm,
          dd: part.dd,
          objectKey,
          rowCount: rows.length,
          uncompressedBytes,
          compressedBytes,
          sha256,
          startedAt,
        });
      }
      // existing が pending/failed の場合は同 id を再利用し markCompleted/markFailed で更新する

      const putResult = await deps.r2.putObject(objectKey, new Uint8Array(gzipped), {
        contentType: "application/x-ndjson",
        contentEncoding: "gzip",
        metadata: {
          "row-count": String(rows.length),
          sha256,
          "policy-version": "v1",
          "export-run-id": exportRunId,
        },
        ifNoneMatch: "*",
      });

      const completedAt = new Date().toISOString();
      await deps.manifest.markCompleted(id, completedAt, putResult.etag);

      manifests.push({
        id,
        exportRunId,
        yyyy: part.yyyy,
        mm: part.mm,
        dd: part.dd,
        objectKey,
        rowCount: rows.length,
        uncompressedBytes,
        compressedBytes,
        sha256,
        r2Etag: putResult.etag,
        redactionPolicyVersion: "v1",
        status: "completed",
        startedAt,
        completedAt,
        errorMessage: null,
      });
      totalRowCount += rows.length;
      totalCompressedBytes += compressedBytes;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      const isRedaction = err instanceof RedactionViolationError;
      const labels = isRedaction
        ? ["priority:high", "type:security", "area:cf-audit-log"]
        : ["priority:high", "type:operations", "area:cf-audit-log"];

      // best-effort で failed に更新（pending insert 後の失敗時のみ）
      try {
        const existing = await deps.manifest.findByPartition(part.yyyy, part.mm, part.dd);
        if (existing && existing.status !== "completed") {
          await deps.manifest.markFailed(existing.id, new Date().toISOString(), errMsg);
        }
      } catch {
        // suppress nested failure
      }

      try {
        await deps.reportIssue({
          title: `[cf-audit-log] R2 export failed: ${partKey}`,
          body: `partition=${partKey}\nexportRunId=${exportRunId}\nreason=${errMsg}`,
          labels,
        });
      } catch {
        // suppress reporter failure
      }

      failed.push({ yyyy: part.yyyy, mm: part.mm, dd: part.dd, error: errMsg });
      // 他 partition は続行
    }
  }

  return {
    manifests,
    failedPartitions: failed,
    totalRowCount,
    totalCompressedBytes,
    exportRunId,
  };
}
