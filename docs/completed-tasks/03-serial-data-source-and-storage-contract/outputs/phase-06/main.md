# Phase 6 / main.md — 異常系検証 サマリ

## 概要

Sheets API 障害 / D1 partial write / backfill 重複 / audit 整合性 / schema drift の 7 シナリオを `failure-cases.md` に整備し、AC-4（Sheets を真として D1 再構築）と一致させた。

## 完了条件チェック

- [x] failure-cases.md に最低 7 件記載（A1〜A7）
- [x] 各シナリオに「検出 SQL/コマンド」「期待挙動」「復旧手順」が揃う
- [x] AC-4 復旧基準と全シナリオの整合性が取れている
- [x] audit log enum 値が runbook と一致

## audit reason enum（不変）

`SHEETS_RATE_LIMIT / SHEETS_5XX / SHEETS_AUTH / D1_TX_FAIL / MAPPING_INVALID / PARTIAL_ABORT / SCHEMA_DRIFT_IGNORED`

## 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | OK | 障害時に Sheets/D1 どちらを直すか即決可能 |
| 実現性 | OK | 検証は最小 fixture + audit クエリで完結 |
| 整合性 | OK | AC-4 と全シナリオが整合 |
| 運用性 | OK | failure-cases が runbook と双方向に紐付く |

## 観測項目 handoff（05a）

- failed 直近 24h
- reason distribution
- Sheets HTTP code distribution

## blocker / handoff

- blocker: なし
- 引き継ぎ: failure-cases.md を Phase 7 の AC × 検証項目 trace matrix へ取り込む
- ブロック条件解除: AC-4 と矛盾するシナリオなし

## 成果物

- `outputs/phase-06/failure-cases.md`
