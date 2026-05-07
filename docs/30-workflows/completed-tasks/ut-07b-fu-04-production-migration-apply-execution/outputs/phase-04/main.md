# Phase 4: 実装計画詳細 — ut-07b-fu-04-production-migration-apply-execution

[実装区分: 実装仕様書（operations verification + evidence writing）]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 4 / 13 |
| 作成日 | 2026-05-04 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| issue | #424 (CLOSED) |

## 目的

既適用検証 実行時のコマンド列、approval gate の通過順序、evidence ファイル名・配置・redaction policy を Phase 11 で迷いなく実行できる粒度に確定する。

## 実行コマンド列（spec 確定）

```bash
# Step 0: 認証
bash scripts/cf.sh whoami
# 期待: Cloudflare account に認証済み（値は redact）

# Step 1: preflight (既適用確認)
bash scripts/d1/preflight.sh ubm-hyogo-db-prod --env production \
  --migration 0008_schema_alias_hardening --expect applied --json \
  | tee outputs/phase-11/preflight-list.log.raw

# Step 2: ユーザー明示承認の取得 → outputs/phase-11/user-approval-record.md に記録

# Step 3: duplicate apply prohibition（mutation 禁止）
printf 'FORBIDDEN - duplicate production migration apply is not executed.\n' \
  | tee outputs/phase-11/apply.log.raw

# Step 4: post-check
bash scripts/d1/postcheck.sh ubm-hyogo-db-prod --env production \
  | tee -a outputs/phase-11/post-check.log.raw

# Step 5: redaction 後に *.log.raw → *.log へリネーム保存（手動 redaction を経由）
```

## evidence ファイル設計

| ファイル | 内容 | redaction 対象 |
| --- | --- | --- |
| outputs/phase-11/preflight-list.log | preflight 実行ログ（command/exit/stdout redacted/stderr redacted/timestamp） | account_id / token / DB UUID |
| outputs/phase-11/apply.log | duplicate apply prohibitionログ | account_id / token / DB UUID |
| outputs/phase-11/post-check.log | `schema_diff_queue` hardening columns の実行結果 | account_id / token / DB UUID |
| outputs/phase-11/user-approval-record.md | ユーザー明示承認の記録（日時・依頼文の要約） | 個人情報 |
| outputs/phase-11/redaction-checklist.md | 各 log の redaction 完了チェック | - |

## redaction policy

- account_id（32桁 hex）→ `<account_id>`
- D1 database UUID → `<d1-uuid>`
- API token / OAuth token / cookie 値 → `<redacted-secret>`
- email / name / phone 等 PII → `<redacted-pii>`
- 出力中の `wrangler` バナー、CLI 進捗、durations 等は保持してよい

## sequence と approval gate の対応

| Step | gate | 通過条件 |
| --- | --- | --- |
| Step 0 | wrapper-auth-gate | `bash scripts/cf.sh whoami` 成功 |
| Step 1 | preflight-gate | migrations list または正本既存 evidence で `0008_schema_alias_hardening` が既適用 |
| Step 2 | user-approval-gate | ユーザーから「production already-applied verification 実行」明示承認 |
| Step 3 | duplicate-apply-prohibition-gate | `d1 migrations apply` が実行されていない |
| Step 4 | post-check-gate | `schema_diff_queue.backfill_cursor` / `backfill_status` が存在 |
| Step 5 | redaction-gate | redaction-checklist 全 PASS |

## 参照資料

- .claude/skills/aiworkflow-requirements/references/workflow-ut-07b-fu-03-production-migration-apply-runbook-artifact-inventory.md
- scripts/cf.sh
- apps/api/migrations/0008_schema_alias_hardening.sql

## 多角的チェック観点

- duplicate apply は実行しない
- preflight 失敗時は正本 fact drift としてエスカレーションする
- post-check FAIL 時は forward-fix / fact correction をエスカレーションする
- redaction 漏れがあると evidence は採用しない
- `tee` で raw を保存し redaction は別ファイルへ複製する二段構成で誤上書きを防ぐ

## サブタスク管理

- [ ] 実行コマンド列を確定
- [ ] evidence ファイル設計を確定
- [ ] redaction policy を確定
- [ ] approval gate 一覧を確定
- [ ] outputs/phase-04/main.md を作成

## 成果物

- outputs/phase-04/main.md

## 完了条件

- 実行コマンド列、evidence ファイル設計、redaction policy、approval gate 一覧が確定

## タスク100%実行確認

- [ ] apply は実行しない
- [ ] redaction policy が網羅的
- [ ] secret 値を含めていない

## 次 Phase への引き渡し

Phase 5 へ、コマンド列と evidence 配置を渡す。
## 実行タスク

1. 既適用 verification path を primary path として固定する。
2. duplicate apply を forbidden path として AC / gate に反映する。
3. evidence shape を `command / exit / stdout / stderr / timestamp` の 5 セクションへ統一する。
4. Phase 11 runtime verification が未承認の場合の placeholder を定義する。

## 統合テスト連携

本 Phase は実装計画であり test command は実行しない。検証は Phase 11 placeholder と Phase 12 compliance check で行う。
