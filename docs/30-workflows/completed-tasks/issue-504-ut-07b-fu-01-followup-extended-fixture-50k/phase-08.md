# Phase 8: runbook 実装（`docs/runbooks/schema-alias-backfill-50k-stress-trial.md`）

## メタ情報
| 項目 | 値 |
| --- | --- |
| Source | `outputs/phase-8/phase-8.md` |
| 変更対象 | `docs/runbooks/schema-alias-backfill-50k-stress-trial.md`（新規） |

## 目的
50k stress trial の手動実行手順 / 中止条件 / cleanup 義務を runbook として明文化する。CI / 自動化が利用不能な場合の fallback 経路。

## 実行タスク
1. 新規 runbook を以下のセクションで構成:
   - **前提条件**（staging D1 / Queue / DLQ access、user 承認）
   - **実行ステップ**（generate → seed → run-stress-trial → cleanup の 4 段）
   - **観測ポイント**（D1 query で `backfill_status` 遷移、Queue depth、DLQ count）
   - **中止条件**（`retry_count > 3`、`dlq_count > 0`、`cpu_ms > 250000`、または timeout 1800s で abort して cleanup へ進む）
   - **cleanup 義務**（trial 終了後 fixture を必ず削除。staging quota 圧迫防止）
   - **redaction チェック**（evidence file に PII / token / 実 ID が含まれないことの grep 確認）
   - **rollback**（staging のため cleanup のみで完結）
2. 各ステップに具体コマンド（`scripts/cf.sh` ラッパー経由）を貼り付け。

## 統合テスト連携
runbook は実装の正本ではないが、Phase 11 の runtime evidence 取得はこの runbook に従う。

## 参照資料
- `outputs/phase-3/cli-spec.md`
- `outputs/phase-7/phase-7.md`
- 既存 runbook テンプレ: `docs/runbooks/release-create.md`（issue-348 で導入）

## 成果物
- `docs/runbooks/schema-alias-backfill-50k-stress-trial.md`
- `outputs/phase-8/phase-8.md`

## 完了条件
- runbook が前提 / 実行 / 観測 / 中止 / cleanup / redaction / rollback を網羅。
- 実コマンドが全て `scripts/cf.sh` または `scripts/schema-alias-backfill/*` を経由（`wrangler` 直接呼び出し禁止 — CLAUDE.md 準拠）。
- production への bulk INSERT が runbook 上も「permanent ban」と明示。
