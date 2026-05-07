# Phase 2: データモデル設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 2 / 13 |
| 目的 | R2 object key 構造 / manifest schema / redaction rules / retention metadata の確定 |
| 状態 | drafted |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Phase 1 で固定した契約 (C-1 〜 C-4) を所与とし、以下のデータモデルを確定する。

1. R2 object key の階層構造（UTC 固定・restore drill range クエリ可能）
2. JSONL 1 行の payload schema（fetcher の `cf_audit_log` 行と redaction policy v1 の対応）
3. D1 manifest テーブル `cf_audit_log_export_manifest` の schema（2-phase commit 対応）
4. retention metadata（policy version / hash / row count / object size）

## 統合テスト連携

NON_VISUAL implementation。Phase 11 の restore drill で「manifest.row_count == 復元行数」「manifest.sha256 == 復元 object hash」の照合 evidence を取得する。

## 変更対象ファイル一覧

| パス | 種別 | 内容 |
| --- | --- | --- |
| `apps/api/migrations/0015_add_audit_export_manifest.sql` | 新規 | manifest テーブル DDL |
| `scripts/cf-audit-log/types.ts` | 編集 | export 用型 (`ExportManifestRow`, `R2ObjectKey`, `ExportWindow`) を追加 |
| `apps/api/wrangler.toml` | 編集 | R2 binding `UBM_AUDIT_COLD_STORAGE` を production / preview に追加（実装は Phase 3 / Phase 5） |

> 本 Phase では schema 設計と型定義のみを確定する。SQL / TypeScript の実体は Phase 5 で書く。

## R2 object key 構造

```
audit/
  v1/                              # redaction policy version
    yyyy=YYYY/                     # UTC 西暦（4 桁）
      mm=MM/                       # UTC 月（01-12）
        dd=DD/                     # UTC 日（01-31）
          cf-audit-log-YYYYMMDD.jsonl.gz
```

- 例: `audit/v1/yyyy=2026/mm=05/dd=07/cf-audit-log-20260507.jsonl.gz`
- 1 日 1 オブジェクト。日次 export は 26〜29 日前 window を走査し、manifest completed 済み partition を skip する。
- key が partition style（`yyyy=`, `mm=`, `dd=`）であるため将来 R2 → external 解析（DuckDB / Athena 互換）への移行コストを抑える。
- `Content-Type: application/x-ndjson`、`Content-Encoding: gzip`、`Cache-Control: private, immutable`。

## JSONL payload schema（1 行 = `cf_audit_log` 1 行）

```typescript
type ExportedAuditRow = {
  id: string;                       // cf_audit_log.id (UUID)
  occurred_at: string;              // ISO8601 UTC
  occurred_at_ms: number;           // UTC epoch milliseconds
  actor_email_domain?: string;      // local-part は保存しない
  actor_ip?: string;                // IPv4 /24 or IPv6 /48
  actor_ua?: "redacted-user-agent";
  action_type: string;              // CF audit action 名
  resource_type: string;
  resource_id: string;
  raw_json_redacted: true;
  severity: "HIGH" | "MEDIUM" | "LOW" | "INFO";
  redaction_policy_version: "v1";
};
```

- 既存 `cf_audit_log` 列とは 1:1 対応（マッピングは Phase 5 実装で確定）。
- `raw_json` は R2 object へ保存しない。export 時に `raw_json_redacted: true` を付け、必要な検索軸は正規化済み column だけで保持する。

## manifest テーブル DDL（Phase 5 で実装する SQL のプレビュー）

```sql
-- apps/api/migrations/0015_add_audit_export_manifest.sql
CREATE TABLE IF NOT EXISTS cf_audit_log_export_manifest (
  id                        TEXT PRIMARY KEY,             -- UUID
  export_run_id             TEXT NOT NULL,                -- 1 回の workflow 実行 ID
  yyyy                      INTEGER NOT NULL,
  mm                        INTEGER NOT NULL,
  dd                        INTEGER NOT NULL,
  object_key                TEXT NOT NULL,
  r2_etag                   TEXT,
  row_count                 INTEGER NOT NULL,
  uncompressed_bytes        INTEGER NOT NULL,
  compressed_bytes          INTEGER,
  sha256                    TEXT NOT NULL,                -- JSONL 平文の SHA-256 hex
  redaction_policy_version  TEXT NOT NULL DEFAULT 'v1',
  status                    TEXT NOT NULL,                -- 'pending' | 'completed' | 'failed'
  error_message             TEXT,
  started_at                TEXT NOT NULL,                -- ISO8601 UTC
  completed_at              TEXT,
  UNIQUE (yyyy, mm, dd)
);

CREATE INDEX IF NOT EXISTS idx_cf_audit_export_manifest_partition
  ON cf_audit_log_export_manifest (yyyy, mm, dd);

CREATE INDEX IF NOT EXISTS idx_cf_audit_export_manifest_status
  ON cf_audit_log_export_manifest (status, started_at);
```

### 2-phase commit の流れ

1. `INSERT ... status='pending'` を先に発行（`(yyyy, mm, dd)` UNIQUE で重複防止）。
2. R2 に PUT 成功 → `UPDATE status='completed', r2_etag=?, completed_at=?`。
3. PUT 失敗 → `UPDATE status='failed', error_message=?`。`pending` は残さない。
4. 同月再実行時、`status='completed'` 行が既存なら skip（冪等）。

## 型定義（`scripts/cf-audit-log/types.ts` への追加）

```typescript
export type R2ObjectKey = `audit/v1/yyyy=${number}/mm=${number}/dd=${number}/cf-audit-log-${number}.jsonl.gz`;

export type ExportWindow = {
  fromUtc: Date;  // inclusive
  toUtc: Date;    // exclusive
};

export type ExportManifestStatus = "pending" | "completed" | "failed";

export type ExportManifestRow = {
  id: string;
  exportRunId: string;
  yyyy: number;
  mm: number;
  dd: number;
  objectKey: R2ObjectKey;
  r2Etag: string | null;
  rowCount: number;
  uncompressedBytes: number;
  compressedBytes: number | null;
  sha256: string;
  redactionPolicyVersion: "v1";
  status: ExportManifestStatus;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string | null;
};
```

## redaction rules（Phase 1 契約 C-3 の実装表）

| 検査項目 | パターン | ヒット時挙動 |
| --- | --- | --- |
| API Token prefix | `/v1\.0-[A-Za-z0-9_-]{40,}/` | export fail-closed |
| 完全 IPv4 | `/\b(\d{1,3}\.){3}\d{1,3}\b/`（末尾 octet が 0 以外） | export fail-closed |
| 完全 IPv6 | `/\b([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b/` | export fail-closed |
| 平文 User-Agent | `/Mozilla\/|curl\/|wrangler\//`（fetcher で hash 化済みのはず） | export fail-closed |
| email local-part 平文 | `/[a-zA-Z0-9._%+-]+@/`（hash 化済みなら局所一致しない想定） | export fail-closed |

ヒット時は workflow を fail させ GitHub Issue を `priority:high / type:security` で起票する（Issue #408 の `issue-reporter.ts` 経由）。

## retention metadata

- 各 manifest 行が retention の単一情報源。R2 object 側にもメタデータとして以下を付与:
  - `x-amz-meta-export-run-id`
  - `x-amz-meta-redaction-policy-version: v1`
  - `x-amz-meta-row-count`
  - `x-amz-meta-sha256`
- D1 が破損しても R2 object メタデータから retention を再構成できる冗長設計。

## 入力・出力・副作用

- 入力: Phase 1 で固定した契約 + 既存 `cf_audit_log` schema。
- 出力: 上記 schema / 型 / DDL のテキスト仕様。
- 副作用: なし（Phase 5 で実 DDL / 型コミット）。

## テスト方針

Phase 5 で実装する `__tests__` 内に以下のテストファイルを追加する想定:

- `scripts/cf-audit-log/__tests__/export-manifest.spec.ts`
  - manifest 2-phase commit の状態遷移（pending → completed / failed）
  - `(yyyy, mm, dd)` UNIQUE での重複 INSERT の reject
  - object key generator が UTC 固定 / partition 形式を維持
  - redaction grep が pattern 全件で fail-closed する

本 Phase 2 ではテスト追加なし（schema の決定のみ）。

## ローカル実行・検証コマンド

```bash
# 既存 cf_audit_log の列構造を確認（mapping 整合性の事前チェック）
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production \
  --command "PRAGMA table_info(cf_audit_log)"

# 既存 migration 番号の重複確認
ls apps/api/migrations | sort | uniq -c | awk '$1 > 1'

# 型チェック（Phase 5 で types.ts を更新したあと再実行）
mise exec -- pnpm typecheck
```

## DoD（Phase 2 完了条件）

- [ ] R2 object key 構造（UTC 固定 / partition 形式 / 1 日 1 object）が確定
- [ ] JSONL payload schema が `cf_audit_log` 列と 1:1 で対応している
- [ ] manifest テーブル DDL が 2-phase commit / `(yyyy, mm, dd)` UNIQUE / status enum を満たす
- [ ] redaction rules 5 項目が pattern + fail-closed 挙動付きで列挙されている
- [ ] retention metadata が D1 manifest と R2 object の二重保持構造になっている
- [ ] Phase 5 の test 追加対象ファイルが特定されている
