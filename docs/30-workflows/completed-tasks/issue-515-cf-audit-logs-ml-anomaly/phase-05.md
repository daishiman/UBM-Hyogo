# Phase 5: データモデル / D1 migration / feature schema 確定

## 目的

D1 `cf_audit_log` への classifier カラム追加 migration と、feature schema の最終形を確定する。

## D1 migration

### ファイル

`apps/api/migrations/0016_cf_audit_log_classification.sql`。番号は phase-02 で最新+1を実測し、`0015_attendance_analytics_indexes.sql` が存在するため `0015` は使用しない。

### UP SQL

```sql
-- 0016_cf_audit_log_classification.sql
-- Issue #515: classifier metadata columns

ALTER TABLE cf_audit_log
  ADD COLUMN classifier_used TEXT NOT NULL DEFAULT 'threshold';

ALTER TABLE cf_audit_log
  ADD COLUMN classifier_version TEXT NOT NULL DEFAULT 'threshold@1.0.0';

ALTER TABLE cf_audit_log
  ADD COLUMN confidence REAL;

CREATE INDEX IF NOT EXISTS idx_cf_audit_log_classifier
  ON cf_audit_log (classifier_used, classifier_version);
```

### DOWN SQL（rollback ノート / D1 は ALTER DROP COLUMN を 2024 以降サポート）

```sql
-- rollback note: D1 supports DROP COLUMN as of 2024+
-- DROP INDEX IF EXISTS idx_cf_audit_log_classifier;
-- ALTER TABLE cf_audit_log DROP COLUMN confidence;
-- ALTER TABLE cf_audit_log DROP COLUMN classifier_version;
-- ALTER TABLE cf_audit_log DROP COLUMN classifier_used;
```

rollback は forward-safe を原則とし、通常は列を残したまま `CF_AUDIT_CLASSIFIER=threshold` へ戻す。DOWN SQL は migration ファイル内コメントに併記するが、破壊的 rollback はユーザー承認付きの手動操作に限定する。

### 適用範囲

- staging: 本サイクル内で apply（`scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging`）
- production: **本サイクルでは apply しない**（Gate 通過後の別タスク）

## Feature schema 確定

`scripts/cf-audit-log/features/schema.ts`:

```ts
export interface RedactedFeatures {
  readonly ipBucket: string;          // IPv4: 'a.b.c.0' / IPv6: 'xxxx:xxxx:xxxx::'
  readonly hourOfDay: number;         // 0-23 UTC
  readonly dayOfWeek: number;         // 0-6 UTC, 0=Sunday
  readonly actionCategory: ActionCategory;
  readonly statusClass: '2xx' | '3xx' | '4xx' | '5xx' | 'unknown';
  readonly actorRoleHash: string;     // SHA-256 prefix 16 hex
  readonly userAgentCategory: UACategory;
  readonly tokenIdPresent: boolean;
}

export type ActionCategory =
  | 'auth' | 'tokens' | 'dns' | 'workers' | 'd1' | 'kv' | 'r2' | 'other';

export type UACategory =
  | 'cli-wrangler' | 'gh-actions' | 'browser' | 'unknown';

export const REDACTED_FEATURES_JSON_SCHEMA = { /* JSON Schema export */ };
```

## 完了条件

- [ ] migration 番号確定（phase-02 結果に依存）
- [ ] UP / DOWN SQL を `outputs/phase-05/main.md` に記述
- [ ] `RedactedFeatures` の field 8 個を確定
- [ ] JSON Schema を併記（test 用）
- [ ] production apply は **本サイクル外** であることを明記

## 出力

- `outputs/phase-05/main.md`

## 参照資料

- `index.md`
- `phase-02.md` ・ `phase-03.md`
- `apps/api/migrations/0014_create_cf_audit_log.sql`

## 統合テスト連携

- Phase 9 で feature schema の JSON Schema validation test を計画

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 05 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | implemented_local_runtime_pending |

## 実行タスク

- Phase 契約を確定する。
- skill 定義と正本仕様への整合を確認する。

| Task | 内容 |
| --- | --- |
| 05-1 | この Phase の契約を確定する |
| 05-2 | skill 定義と正本仕様への整合を確認する |

## 成果物/実行手順

- Phase 本文の出力パスへ成果物を配置する。
- 実装時は Phase 11 evidence と Phase 12 strict outputs に同期する。

## 依存Phase参照

Phase 1 / Phase 2 / Phase 3 / Phase 4 / Phase 5 / Phase 6 / Phase 7 / Phase 8 / Phase 9 / Phase 10 / Phase 11 / Phase 12 の成果物を上流契約として参照する。
