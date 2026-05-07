# Phase 11: 手動テスト検証（NON_VISUAL）

## メタ情報
| 項目 | 値 |
| --- | --- |
| Source | `outputs/phase-11/phase-11.md` |
| visualEvidence | NON_VISUAL |
| 状態語彙 | `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` |

## 目的
staging で 10,000 行 fixture を流し、remaining-scan vs cursor の比較 evidence を取得する。batch CPU 時間 / 残行数推移 / retry_count / `EXPLAIN QUERY PLAN` / DLQ 投入有無を記録し、採用 / 不採用判断を `decision-record.md` で確定する。**user gate** が解除されるまでは `blocked_runtime_evidence_pending` 状態を維持する。

## 実行タスク
詳細は `outputs/phase-11/phase-11.md` を正本とする。

## 統合テスト連携
本 Phase が schema alias back-fill cursor 採用判断の NON_VISUAL runtime evidence 統合検証ポイントである。staging vs production の D1 schema parity verification を併せて取得する。

## 参照資料
- `outputs/phase-11/phase-11.md`
- `apps/api/src/workflows/schemaAliasBackfillBatch.ts`

## 成果物
- `outputs/phase-11/phase-11.md`
- `outputs/phase-11/main.md`
- `outputs/phase-11/staging-evidence-remaining-scan.md`
- `outputs/phase-11/staging-evidence-cursor.md`
- `outputs/phase-11/decision-record.md`
- `outputs/phase-11/d1-schema-parity.md`
- `outputs/phase-11/lint-evidence.log`

## 完了条件
- runtime evidence 取得まで `blocked_runtime_evidence_pending` / `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` を維持し、`PASS` 単独表記は使用しない。
- Phase 1 SSOT の E1 + E4 採用条件に対する判定結果が `decision-record.md` に記録。
- staging vs production の `migrations list` / `PRAGMA table_info` 比較結果が `d1-schema-parity.md` に記録。
