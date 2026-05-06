# Phase 11: 手動テスト検証（NON_VISUAL）

## メタ情報
| 項目 | 値 |
| --- | --- |
| Source | `outputs/phase-11/phase-11.md` |
| visualEvidence | NON_VISUAL |

## 目的
staging で retention purge cron job を手動 trigger し、dry-run → 1メンバー分 apply → audit_log 確認までの runtime evidence を取得する。

## 実行タスク
詳細は `outputs/phase-11/phase-11.md` を正本とする。

## 統合テスト連携
本 Phase が retention purge job の NON_VISUAL runtime evidence 統合検証ポイントである。

## 参照資料
- `outputs/phase-11/phase-11.md`

## 成果物
- `outputs/phase-11/phase-11.md`
- `outputs/phase-11/seed-fixture.sql`
- `outputs/phase-11/pre-apply-bookmark.txt`
- `outputs/phase-11/dry-run-report.json`
- `outputs/phase-11/apply-result.json`
- `outputs/phase-11/audit-log-diff.json`
- `outputs/phase-11/invariant-check.log`
- `outputs/phase-11/cron-trigger-log.txt`

## 完了条件
- Phase 11 正本ファイルと上記 7 runtime evidence ファイルが存在する。
- runtime evidence 取得までは `blocked_runtime_evidence_pending` とし、PASS 表記しない。
