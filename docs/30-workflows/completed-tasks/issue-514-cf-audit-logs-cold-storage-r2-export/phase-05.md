# Phase 5: 実装

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 5 / 13 |
| 目的 | D1 migration / exporter / restore-drill / wrangler.toml R2 binding / GitHub Actions workflow / `scripts/cf.sh` 拡張を実装する |
| 状態 | drafted |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Phase 2-4 で確定した契約・データモデル・アーキテクチャ・検証シナリオを所与とし、コードの実体を作成する。本 Phase では以下を実装する:

1. D1 migration（`0015_add_audit_export_manifest.sql`）
2. wrangler.toml R2 binding 追加（production / preview）
3. exporter (`export-to-r2.ts`) と依存モジュール（`r2-client.ts` / `redaction-guard.ts` / `types.ts` 拡張）
4. restore drill (`restore-drill.ts`)
5. GitHub Actions workflow (`cf-audit-log-cold-storage.yml`)
6. `scripts/cf.sh` への `r2 export` / `r2 restore` サブコマンド追加

## 統合テスト連携

NON_VISUAL implementation。Phase 11 の runtime evidence は (a) preview bucket への dry-run + 実 PUT 1 回 (b) D1 manifest 1 行 (c) restore drill row count 一致ログ、で構成する。本 Phase の実装後、Phase 6 で focused unit test を実装する。

## 変更対象ファイル一覧

| パス | 種別 | 内容 |
| --- | --- | --- |
| `apps/api/migrations/0015_add_audit_export_manifest.sql` | 新規 | manifest テーブル DDL（Phase 2 schema 準拠） |
| `apps/api/wrangler.toml` | 編集 | `[[env.production.r2_buckets]]` / `[[env.preview.r2_buckets]]` 追加 |
| `scripts/cf-audit-log/types.ts` | 編集 | `ExportManifestRow` / `ExportWindow` / `R2ObjectKey` / `RedactionViolation` 追加 |
| `scripts/cf-audit-log/redaction-guard.ts` | 新規 | 5 pattern grep の fail-closed 実装 |
| `scripts/cf-audit-log/r2-client.ts` | 新規 | R2 binding 経由の薄い wrapper |
| `scripts/cf-audit-log/manifest-store.ts` | 新規 | D1 manifest INSERT/UPDATE の 2-phase commit 実装 |
| `scripts/cf-audit-log/object-key.ts` | 新規 | UTC fixed の R2 object key builder |
| `scripts/cf-audit-log/export-to-r2.ts` | 新規 | exporter 本体 |
| `scripts/cf-audit-log/restore-drill.ts` | 新規 | restore 検証スクリプト |
| `scripts/cf-audit-log/issue-reporter.ts` | 編集 | redaction violation / restore mismatch / R2 失敗の起票導線追加（既存 reporter を import） |
| `.github/workflows/cf-audit-log-cold-storage.yml` | 新規 | 日次 export + 半期 restore drill workflow |
| `scripts/cf.sh` | 編集 | `r2 export` / `r2 restore` サブコマンド分岐追加 |

## D1 migration

### `apps/api/migrations/0015_add_audit_export_manifest.sql`

```sql
-- Phase 2 schema に基づく manifest テーブル
CREATE TABLE IF NOT EXISTS cf_audit_log_export_manifest (
  id                        TEXT PRIMARY KEY,
  export_run_id             TEXT NOT NULL,
  yyyy                      INTEGER NOT NULL,
  mm                        INTEGER NOT NULL,
  dd                        INTEGER NOT NULL,
  object_key                TEXT NOT NULL,
  row_count                 INTEGER NOT NULL,
  uncompressed_bytes        INTEGER NOT NULL,
  compressed_bytes          INTEGER NOT NULL,
  sha256                    TEXT NOT NULL,
  r2_etag                   TEXT,
  redaction_policy_version  TEXT NOT NULL DEFAULT 'v1',
  status                    TEXT NOT NULL CHECK (status IN ('pending','completed','failed')),
  started_at                TEXT NOT NULL,
  completed_at              TEXT,
  error_message             TEXT,
  UNIQUE (yyyy, mm, dd)
);

CREATE INDEX IF NOT EXISTS idx_cf_audit_export_manifest_status
  ON cf_audit_log_export_manifest (status, started_at);

CREATE INDEX IF NOT EXISTS idx_cf_audit_export_manifest_run
  ON cf_audit_log_export_manifest (export_run_id);
```

apply 経路: `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production`（Phase 11 runtime gate）。

## wrangler.toml R2 binding

```toml
# apps/api/wrangler.toml — production env
[[env.production.r2_buckets]]
binding = "UBM_AUDIT_COLD_STORAGE"
bucket_name = "ubm-hyogo-audit-cold-storage-prod"

# preview env（fixture / dry-run / 統合テスト）
[[env.preview.r2_buckets]]
binding = "UBM_AUDIT_COLD_STORAGE"
bucket_name = "ubm-hyogo-audit-cold-storage-preview"
preview_bucket_name = "ubm-hyogo-audit-cold-storage-preview"
```

bucket 作成は Phase 11 の runtime gate（`bash scripts/cf.sh r2 bucket create ubm-hyogo-audit-cold-storage-prod --env production`）。

## モジュール構造とシグネチャ

### `scripts/cf-audit-log/types.ts`（追加分）

```typescript
export type ExportWindow = {
  fromUtc: Date;   // inclusive
  toUtc: Date;     // exclusive (now - 26d)
};

export type R2ObjectKey = {
  policyVersion: "v1";
  yyyy: number;
  mm: number;
  dd: number;
  toString(): string;  // "audit/v1/yyyy=2026/mm=05/dd=07/cf-audit-log-20260507.jsonl.gz"
};

export type ExportManifestRow = {
  id: string;
  exportRunId: string;
  yyyy: number;
  mm: number;
  dd: number;
  objectKey: string;
  rowCount: number;
  uncompressedBytes: number;
  compressedBytes: number;
  sha256: string;
  redactionPolicyVersion: "v1";
  status: "pending" | "completed" | "failed";
  startedAt: string;
  completedAt: string | null;
  errorMessage: string | null;
};

export type RedactionViolation = {
  pattern: "api-token" | "ipv4-full" | "ipv6-full" | "user-agent-plain" | "email-plain";
  sample: string;  // 先頭 32 文字 + "...redacted"
};

export class RedactionViolationError extends Error {
  constructor(public readonly violations: RedactionViolation[]) {
    super(`redaction violation: ${violations.length} pattern(s) hit`);
    this.name = "RedactionViolationError";
  }
}
```

### `scripts/cf-audit-log/object-key.ts`

```typescript
import type { R2ObjectKey } from "./types";

export function buildObjectKey(date: Date): R2ObjectKey;
// UTC fixed。toString() で "audit/v1/yyyy=YYYY/mm=MM/dd=DD/cf-audit-log-YYYYMMDD.jsonl.gz" を返す
```

入力: UTC `Date`。出力: `R2ObjectKey`。副作用: なし。

### `scripts/cf-audit-log/redaction-guard.ts`

```typescript
import type { RedactionViolation } from "./types";

const PATTERNS: Array<{ name: RedactionViolation["pattern"]; regex: RegExp }> = [
  { name: "api-token", regex: /\b(?:Bearer\s+)?cf_(?:pat|api)_[A-Za-z0-9_-]{20,}\b/g },
  { name: "ipv4-full", regex: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g },
  { name: "ipv6-full", regex: /\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b/g },
  { name: "user-agent-plain", regex: /Mozilla\/[0-9.]+\s*\([^)]*\)\s*[A-Za-z]+\/[0-9.]+/g },
  { name: "email-plain", regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g },
];

export function guardJsonlOrThrow(jsonl: string): void;
// hit 0 件で return、1 件以上で RedactionViolationError を throw
// truncated IP（/24 / /48）は最終 octet が 0 または "::/48" 表記なので上記 regex にヒットしない設計
```

> 注: `ipv4-full` は truncated `203.0.113.0/24` 表記の `0/24` を含んだ文字列にもヒットしうるため、guard 実装内で truncated mark (`/24` / `/48`) を含む match は **violation から除外** するヒューリスティクスを入れる。詳細は実装時に決定。

入力: JSONL 文字列。出力: void or throw。副作用: なし。

### `scripts/cf-audit-log/r2-client.ts`

```typescript
import type { R2Bucket } from "@cloudflare/workers-types";

export interface R2Client {
  putObject(key: string, body: Uint8Array, opts: {
    contentType: string;
    contentEncoding?: string;
    metadata: Record<string, string>;
    ifNoneMatch?: "*";
  }): Promise<{ etag: string }>;

  getObject(key: string): Promise<{ body: Uint8Array; metadata: Record<string, string> }>;

  listObjects(prefix: string): Promise<Array<{ key: string; size: number; etag: string }>>;
}

export function createR2Client(bucket: R2Bucket): R2Client;
```

副作用: R2 binding 経由の I/O のみ。直接 S3 互換 API は使用しない。

### `scripts/cf-audit-log/manifest-store.ts`

```typescript
import type { D1Database } from "@cloudflare/workers-types";
import type { ExportManifestRow } from "./types";

export interface ManifestStore {
  insertPending(row: Omit<ExportManifestRow, "status" | "completedAt" | "errorMessage"> & {
    status: "pending";
  }): Promise<void>;

  markCompleted(id: string, completedAt: string): Promise<void>;

  markFailed(id: string, completedAt: string, errorMessage: string): Promise<void>;

  findByPartition(yyyy: number, mm: number, dd: number): Promise<ExportManifestRow | null>;

  listForRandomPick(limit: number): Promise<ExportManifestRow[]>;
}

export function createManifestStore(db: D1Database): ManifestStore;
```

副作用: D1 INSERT / UPDATE / SELECT。`(yyyy, mm, dd)` UNIQUE 違反時は `findByPartition` で既存行を返し、status が `completed` なら冪等 skip、`failed` なら retry を許可する。

### `scripts/cf-audit-log/export-to-r2.ts`

```typescript
import { gzip } from "node:zlib";
import { promisify } from "node:util";
import { createHash, randomUUID } from "node:crypto";
import { guardJsonlOrThrow, RedactionViolationError } from "./redaction-guard";
import { buildObjectKey } from "./object-key";
import type { R2Client } from "./r2-client";
import type { ManifestStore } from "./manifest-store";
import type { D1Database } from "@cloudflare/workers-types";
import type { ExportManifestRow, ExportWindow } from "./types";

const gzipAsync = promisify(gzip);

export type ExportToR2Deps = {
  db: D1Database;
  r2: R2Client;
  manifest: ManifestStore;
  reportIssue: (input: { title: string; body: string; labels: string[] }) => Promise<void>;
  now?: () => Date;  // テスト注入
};

export type ExportToR2Options = {
  windowFromUtc?: Date;       // 既定: now - 29d (UTC 00:00 切り捨て)
  windowToUtc?: Date;         // 既定: now - 26d (UTC 00:00 切り捨て)
  exportRunId?: string;       // 既定: randomUUID()
  dryRun?: boolean;           // 既定 false
};

export type ExportToR2Result = {
  manifests: ExportManifestRow[];
  failedPartitions: Array<{ yyyy: number; mm: number; dd: number; error: string }>;
  totalRowCount: number;
  totalCompressedBytes: number;
};

export async function exportToR2(
  deps: ExportToR2Deps,
  opts?: ExportToR2Options,
): Promise<ExportToR2Result>;
```

#### 内部フロー

1. `windowFromUtc` / `windowToUtc` を `Date` で正規化（UTC 00:00 切り捨て、半開区間）
2. window を 1 日単位 partition に分割（最大 4 day）
3. 各 partition について:
   1. `manifest.findByPartition`: completed 済みなら skip、failed なら retry、pending（前回 PUT 後 UPDATE 失敗）なら R2 ifNoneMatch で skip + UPDATE のみ
   2. D1 SELECT cursor: `SELECT * FROM cf_audit_log WHERE occurred_at >= ? AND occurred_at < ? ORDER BY occurred_at_ms ASC, id ASC LIMIT 1000 OFFSET ?`
   3. JSONL build（行毎 JSON.stringify + `\n`）
   4. `guardJsonlOrThrow(jsonl)` — fail-closed
   5. sha256 計算
   6. `gzipAsync(Buffer.from(jsonl))`
   7. dry-run: ログ出力のみで次 partition へ
   8. `manifest.insertPending(...)`（UNIQUE 違反は前段で除外済み）
   9. `r2.putObject(objectKey, gzipped, { contentType: "application/x-ndjson", contentEncoding: "gzip", metadata: { "row-count", "sha256", "policy-version", "export-run-id" }, ifNoneMatch: "*" })`
   10. `manifest.markCompleted(id, now())`
4. 失敗時: `manifest.markFailed` + `reportIssue` + 当該 partition を `failedPartitions` に push、他 partition は続行
5. 戻り値構築

#### 副作用

- D1: `cf_audit_log` SELECT (read-only) + `cf_audit_log_export_manifest` INSERT/UPDATE
- R2: PutObject
- stdout: 進捗ログ（partition / row count / sha256 / object key / 推定 size）
- failure: redaction guard hit / R2 PUT 失敗 / D1 制約違反 → process exit code 非 0 + Issue 起票

### `scripts/cf-audit-log/restore-drill.ts`

```typescript
import { gunzip } from "node:zlib";
import { promisify } from "node:util";
import { createHash } from "node:crypto";
import type { D1Database } from "@cloudflare/workers-types";
import type { R2Client } from "./r2-client";
import type { ManifestStore } from "./manifest-store";

const gunzipAsync = promisify(gunzip);

export type RestoreDrillDeps = {
  db: D1Database;
  r2: R2Client;
  manifest: ManifestStore;
  reportIssue: (input: { title: string; body: string; labels: string[] }) => Promise<void>;
  now?: () => Date;
  random?: () => number;
};

export type RestoreDrillOptions = {
  randomPick?: number;    // 既定 1
  verify?: boolean;       // 既定 true
  forceRun?: boolean;     // true の場合は半期判定を無視（手動実行用）
};

export type RestoreDrillResult = {
  drilled: Array<{
    objectKey: string;
    expectedRowCount: number;
    actualRowCount: number;
    sha256Match: boolean;
  }>;
  ok: boolean;
  skipped?: "non-semiannual";
};

export async function restoreDrill(
  deps: RestoreDrillDeps,
  opts?: RestoreDrillOptions,
): Promise<RestoreDrillResult>;
```

#### 内部フロー

1. UTC 月を取得し、1 / 7 月以外かつ `forceRun !== true` なら `{ drilled: [], ok: true, skipped: "non-semiannual" }` で early return
2. `manifest.listForRandomPick(100)` から `randomPick` 件をランダム抽選
3. 各 object について:
   1. `r2.getObject(objectKey)`
   2. `gunzipAsync(body)` → JSONL 文字列
   3. row count 計算（`split('\n').filter(Boolean).length`）
   4. sha256 再計算
   5. tmp テーブル CREATE: `CREATE TABLE IF NOT EXISTS cf_audit_log_restore_tmp_<runId> (...)`
   6. INSERT 全行（batch 100）
   7. SELECT COUNT(*) で expected と一致確認
   8. DROP tmp テーブル
   9. drilled に push
4. いずれか不一致または例外時: `ok=false`、Issue 起票、exit 非 0
5. 全件一致: `ok=true`、exit 0

#### 副作用

- D1: tmp テーブル CREATE / INSERT / DROP（同一 runId で冪等。CREATE 前に DROP IF EXISTS で衝突回避）
- R2: GetObject
- stdout: 進捗ログ
- failure: GitHub Issue 起票（`priority:high / type:security` for hash mismatch、`type:operations` for 404 / network）

## GitHub Actions workflow

### `.github/workflows/cf-audit-log-cold-storage.yml`

```yaml
name: cf-audit-log-cold-storage

on:
  schedule:
    - cron: '0 2 * * *'   # 毎日 UTC 02:00
  workflow_dispatch:
    inputs:
      force_restore_drill:
        description: '半期外でも restore drill を実行する'
        type: boolean
        default: false

permissions:
  contents: read
  issues: write

concurrency:
  group: cf-audit-log-cold-storage
  cancel-in-progress: false

jobs:
  export:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v4
      - uses: jdx/mise-action@v2
      - name: Install deps
        run: mise exec -- pnpm install --frozen-lockfile
      - name: Export to R2
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CF_AUDIT_R2_TOKEN_PROD }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: bash scripts/cf.sh r2 export --env production

  restore-drill:
    needs: export
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v4
      - uses: jdx/mise-action@v2
      - name: Install deps
        run: mise exec -- pnpm install --frozen-lockfile
      - name: Restore drill (semiannual judgment in script)
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CF_AUDIT_R2_TOKEN_PROD }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          FORCE_RESTORE_DRILL: ${{ inputs.force_restore_drill || 'false' }}
        run: bash scripts/cf.sh r2 restore --random-pick 1 --verify --env production
```

> 半期判定は `restore-drill.ts` 内で UTC 月を取得して分岐する（Phase 3 で確定済み）。YAML 側の `if` 表現は month 取得が脆いため使わない。

## `scripts/cf.sh` 拡張

既存の `cf.sh` の case 分岐に以下を追加（実体は Phase 5 実装）:

```bash
# scripts/cf.sh — 抜粋
case "$1" in
  r2)
    shift
    case "$1" in
      export)
        shift
        op run --env-file=.env -- mise exec -- pnpm tsx scripts/cf-audit-log/cli/export.ts "$@"
        ;;
      restore)
        shift
        op run --env-file=.env -- mise exec -- pnpm tsx scripts/cf-audit-log/cli/restore.ts "$@"
        ;;
      *) echo "usage: cf.sh r2 {export|restore} [opts]"; exit 1 ;;
    esac
    ;;
  # 既存の whoami / d1 / deploy / rollback はそのまま
esac
```

CLI ラッパー `scripts/cf-audit-log/cli/export.ts` / `cli/restore.ts` は `--env`、`--dry-run`、`--random-pick`、`--verify`、`--force` を `process.argv` から parse して `exportToR2` / `restoreDrill` を呼ぶ薄い層。

## 入力・出力・副作用（Phase 全体まとめ）

- 入力: D1 `cf_audit_log` 行（read-only SELECT）、`CLOUDFLARE_API_TOKEN`（1Password / GitHub Secrets）、CLI args
- 出力: R2 object（最大 30/月）、D1 manifest 行、GitHub Actions log、（異常時のみ）GitHub Issue
- 副作用: redaction violation / R2 失敗 / restore mismatch 時の Issue 起票

## テスト方針

Phase 6 で実装する focused unit test:

| spec ファイル | カバー対象 | ケース数 |
| --- | --- | --- |
| `__tests__/export-to-r2.spec.ts` | exporter 本体（window 境界 / dry-run / 異常系） | 8 |
| `__tests__/restore-drill.spec.ts` | restore drill 本体（正常 / 異常 / 半期外） | 6 |
| `__tests__/redaction-guard.spec.ts` | 5 pattern grep | 10 |
| `__tests__/redaction-guard.integration.spec.ts` | preview env round-trip | 1 |

合計 25 ケース（Phase 4 で確定済み）。

## ローカル実行・検証コマンド

```bash
# 1. 型整合
mise exec -- pnpm typecheck

# 2. lint
mise exec -- pnpm lint

# 3. focused test（Phase 6 後に有効）
mise exec -- pnpm vitest run scripts/cf-audit-log/__tests__/

# 4. dry-run export（preview env, R2 PUT 0 回）
bash scripts/cf.sh r2 export --env preview --dry-run

# 5. wrangler 構文チェック
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env preview --dry-run

# 6. migration apply (preview, dry-run)
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-preview --env preview
```

## DoD（Phase 5 完了条件）

- [ ] `apps/api/migrations/0015_add_audit_export_manifest.sql` が Phase 2 schema に整合する形で作成されている
- [ ] `apps/api/wrangler.toml` に R2 binding `UBM_AUDIT_COLD_STORAGE` が production / preview 両 env で追加されている
- [ ] `scripts/cf-audit-log/types.ts` に Phase 2 / 3 確定の型が追加されている
- [ ] `redaction-guard.ts` / `r2-client.ts` / `manifest-store.ts` / `object-key.ts` / `export-to-r2.ts` / `restore-drill.ts` が Phase 3 シグネチャに準拠して実装されている
- [ ] `.github/workflows/cf-audit-log-cold-storage.yml` が `schedule: '0 2 * * *'` で稼働する形で作成されている
- [ ] `scripts/cf.sh` に `r2 export` / `r2 restore` サブコマンドが追加されている
- [ ] CLI ラッパー (`cli/export.ts` / `cli/restore.ts`) が `--env` / `--dry-run` / `--random-pick` / `--verify` / `--force` を parse する
- [ ] `pnpm typecheck` / `pnpm lint` が green
- [ ] R2 bucket 作成 / migration apply / 初回 PUT は Phase 11 runtime gate に retain
