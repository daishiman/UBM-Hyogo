# Phase 2: 設計

## メタ情報

| 項目 | 値 |
|------|-----|
| Phase | 2 / 13 |
| 目的 | migration / redaction module / export script / R2 binding / GitHub Actions workflow の topology を確定する |
| 依存 | Phase 1 |

## 目的

本 Phase の目的は本ファイル冒頭メタ情報「目的」欄を参照。

## 実行タスク

以下のセクションで定義する設計・チェックリスト・コマンド・成果物リストを順に実行する。

## 2.1 D1 migration 設計（`0018_add_audit_log_export_manifest.sql`）

```sql
-- Issue #315 (Refs): Application audit_log cold storage 2-phase commit manifest
-- cf_audit_log_export_manifest (0015) のスキーマ構造を踏襲。

CREATE TABLE IF NOT EXISTS audit_log_export_manifest (
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

CREATE INDEX IF NOT EXISTS idx_audit_log_export_manifest_status
  ON audit_log_export_manifest (status, started_at);

CREATE INDEX IF NOT EXISTS idx_audit_log_export_manifest_run
  ON audit_log_export_manifest (export_run_id);
```

不変条件:
- ファイル名は `0018_add_audit_log_export_manifest.sql`（連番。`0017_audit_correlation_findings.sql` が直前）
- `UNIQUE(yyyy, mm, dd)` で同日 export の冪等性確保
- `redaction_policy_version` は `redact.ts` の `REDACTION_POLICY_VERSION` 定数と一致

## 2.2 PII redaction モジュール設計（`apps/api/src/lib/audit/redact.ts`）

責務: 単一の redaction policy で「`/admin/audit` UI 表示」「export 時」両方を賄う。

```ts
export const REDACTION_POLICY_VERSION = "v1" as const;

export type RedactKind = "email" | "phone" | "address" | "actor_email" | "unknown_pii";

export interface RedactedValue {
  redacted: true;
  kind: RedactKind;
}

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const PHONE_RE = /(\+?\d{1,3}[-\s]?)?(\d{2,4}[-\s]?){2,4}\d{2,4}/g;

export function redactString(input: string): string;
export function redactJsonValue(value: unknown): unknown;
export function redactAuditPayload(payload: Record<string, unknown> | null): Record<string, unknown> | null;
export function redactForExport(row: { beforeJson: string | null; afterJson: string | null; actorEmail: string | null; }): {
  beforeJson: string | null;
  afterJson: string | null;
  actorEmailMasked: string | null;
};
```

- email mask: `manju@example.com` → `[REDACTED:email]`
- phone mask: 数字 7 桁以上の連続 → `[REDACTED:phone]`
- `actor_email` は固定的に hash 化せず `[REDACTED:actor_email]` で置換（reversibility 不要）
- 既知の PII key (`email`, `phone`, `address`, `actorEmail`, `actor_email`) は値全体を `RedactedValue` に置換
- 副作用: なし（pure function）

UI 利用パス: `apps/api/src/routes/admin/audit.ts` の list endpoint response 整形時に `redactAuditPayload` を適用（既存実装の masking 散在を集約）。

## 2.3 repository 拡張（`apps/api/src/repository/auditLog.ts`）

追加 export:

```ts
export interface ExportableAuditRow {
  auditId: string;
  actorId: string | null;
  actorEmail: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  beforeJson: string | null;
  afterJson: string | null;
  createdAt: string;
}

export const listForExport = async (
  c: DbCtx,
  range: { fromUtc: string; toUtcExclusive: string; limit: number },
): Promise<ExportableAuditRow[]>;

export const insertExportManifest = async (
  c: DbCtx,
  m: { exportRunId: string; yyyy: number; mm: number; dd: number; objectKey: string; rowCount: number; uncompressedBytes: number; compressedBytes: number; sha256: string; startedAt: string },
): Promise<{ id: string }>;

export const completeExportManifest = async (
  c: DbCtx,
  id: string,
  m: { r2Etag: string | null; completedAt: string },
): Promise<void>;

export const failExportManifest = async (
  c: DbCtx,
  id: string,
  m: { errorMessage: string; completedAt: string },
): Promise<void>;

export const purgeExportedOlderThan = async (
  c: DbCtx,
  thresholdUtc: string, // e.g., now - 90 days
): Promise<{ deleted: number }>;
```

不変条件:
- `purgeExportedOlderThan` は `audit_log_export_manifest.status='completed'` で被覆された日付範囲のみ DELETE 対象（未 export 行を削除しない安全装置）
- append-only 制約は維持（UPDATE/DELETE は本 module 内 export 専用 helper でのみ実施）

## 2.4 export script 設計（`scripts/audit-log/export-to-r2.ts`）

参照: `scripts/cf-audit-log/export-to-r2.ts` の構造を 1:1 でミラー。

主要処理フロー:
1. CLI args parse: `--env staging|production`, `--dry-run`, `--target-date YYYY-MM-DD`（省略時は前日 UTC）
2. D1 binding 経由で `listForExport({ fromUtc, toUtcExclusive: 翌日 00:00Z, limit: 50_000 })`
3. 各 row に `redactForExport()` 適用 → JSONL 整形
4. `gzip()` で圧縮、`sha256` 算出
5. `insertExportManifest({ status: 'pending', sha256, ... })` で 2-phase commit 開始
6. R2 PUT (`UBM_AUDIT_APP_COLD_STORAGE`, key = `application/yyyy=YYYY/mm=MM/dd=DD/audit-log-<exportRunId>.jsonl.gz`)
7. PUT 成功 → `completeExportManifest({ r2Etag })`
8. PUT 失敗 → `failExportManifest({ errorMessage })`、process exit 1（GitHub Actions retry に委譲）
9. `--dry-run` の場合は R2 PUT を skip し、manifest insert/update も skip

不変条件:
- raw `beforeJson` / `afterJson` / `actorEmail` がメモリ上以外（log / R2 / stdout）に出現しない
- gzip stream は temp ファイル経由ではなく Buffer 上で完結（Cloudflare Workers compatibility）
- `--target-date` 既指定で同 `(yyyy, mm, dd)` の manifest が `completed` の場合は idempotent skip

## 2.5 wrangler.toml R2 binding 差分

```toml
# apps/api/wrangler.toml に追加

[[r2_buckets]]
binding = "UBM_AUDIT_APP_COLD_STORAGE"
bucket_name = "ubm-audit-cold-storage-app-dev"

[[env.staging.r2_buckets]]
binding = "UBM_AUDIT_APP_COLD_STORAGE"
bucket_name = "ubm-audit-cold-storage-app-staging"

[[env.production.r2_buckets]]
binding = "UBM_AUDIT_APP_COLD_STORAGE"
bucket_name = "ubm-audit-cold-storage-app-prod"
```

注意: 既存 `UBM_AUDIT_COLD_STORAGE` (cf 用) を変更しない。

## 2.6 GitHub Actions workflow 設計（`.github/workflows/audit-log-cold-storage.yml`）

```yaml
name: audit-log-cold-storage
on:
  schedule:
    - cron: '0 3 * * *'   # JST 12:00。cf-audit-log-cold-storage (0 2 * * *) と時間帯分離
  workflow_dispatch:
    inputs:
      dry_run:
        type: boolean
        default: true
      target_date:
        type: string
        required: false
permissions:
  contents: read
concurrency:
  group: audit-log-cold-storage
  cancel-in-progress: false
jobs:
  export:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v4
      - uses: jdx/mise-action@v2
      - run: mise exec -- pnpm install --frozen-lockfile
      - name: Export application audit_log to R2
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CF_AUDIT_R2_TOKEN_PROD }}
          DRY_RUN: ${{ inputs.dry_run || 'true' }}
          TARGET_DATE: ${{ inputs.target_date || '' }}
        run: |
          set -euo pipefail
          args="--env production"
          if [ "${DRY_RUN}" = "true" ]; then args="$args --dry-run"; fi
          if [ -n "${TARGET_DATE}" ]; then args="$args --target-date ${TARGET_DATE}"; fi
          CF_SH_SKIP_WITH_ENV=1 mise exec -- pnpm tsx scripts/audit-log/export-to-r2.ts $args
```

## 2.7 改ざん検知方式の決定（採用: R2 Object Lock COMPLIANCE）

| 方式 | 採否 | 理由 |
|------|------|------|
| R2 Object Lock COMPLIANCE mode + retention 7 年 | **採用** | API レベルで削除/上書き不可。Cloudflare 純正で実装複雑度低、運用負荷低 |
| hash chain (各 row に `prev_hash` + `row_hash`) | 不採用 | 実装複雑度高。Object Lock で immutability 担保済のため redundancy 過大 |
| WORM 外部ストレージ (Backblaze B2 等) | 不採用 | 追加 SaaS 不要。R2 で同等機能 |

決定根拠 ADR 化: `outputs/phase-2/tamper-detection-decision.md` に full context を記録。

## 2.8 retention runbook 設計（`docs/30-workflows/issue-315-audit-log-application-cold-storage/operations/audit-log-retention-runbook.md`）

最小目次:
1. 概要 / 不変条件 / RTO/RPO 想定
2. D1 内 90 日 retention policy（`purgeExportedOlderThan` 実行条件・安全装置）
3. R2 Object Lock 7 年 retention（COMPLIANCE mode 解除不可・期間内削除不可）
4. semi-annual restore drill 手順（任意 1 日分を R2 から GET → gunzip → sha256 verify）
5. failure escalation（24h 連続失敗で `gh issue create` 自動発火、severity P2）
6. retention 期間超過後の手動削除手順（Object Lock 期限満了後のみ）

## 検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging
```

## 成果物

- `outputs/phase-2/migration-0018-design.md`
- `outputs/phase-2/redact-module-design.md`
- `outputs/phase-2/export-script-design.md`
- `outputs/phase-2/wrangler-binding-diff.md`
- `outputs/phase-2/workflow-cron-design.md`
- `outputs/phase-2/tamper-detection-decision.md`（Object Lock 採用 ADR）

## 完了条件

- [ ] 6 設計成果物すべてに「シグネチャ / 入出力 / 副作用 / 不変条件」が記述されている
- [ ] migration ファイル番号が `0018_*` で連番である
- [ ] R2 binding 名 `UBM_AUDIT_APP_COLD_STORAGE` が既存 `UBM_AUDIT_COLD_STORAGE` と衝突しない
- [ ] cron 時間帯が `0 3 * * *` で cf 系 `0 2 * * *` と分離
- [ ] Object Lock 採用根拠が ADR 形式で記録されている

## 参照資料

- `apps/api/migrations/0015_add_audit_export_manifest.sql`（構造踏襲元）
- `scripts/cf-audit-log/export-to-r2.ts`（実装パターン踏襲元）
- `.claude/skills/aiworkflow-requirements/references/` audit / r2 関連 spec
