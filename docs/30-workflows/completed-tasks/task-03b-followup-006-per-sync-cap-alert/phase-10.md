[実装区分: 実装仕様書]

# Phase 10: リリース計画 — task-03b-followup-006-per-sync-cap-alert

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 10 / 13 |
| task_id | TASK-03B-FOLLOWUP-006-PER-SYNC-CAP-ALERT |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | implemented-local |

## 目的

この Phase の責務を、per-sync cap alert 仕様の実装承認前に検証可能な粒度へ固定する。

## 実行タスク

- 本 Phase の契約、境界、成果物を確認する。
- 後続 Phase が参照する前提を明文化する。
- user 承認が必要な実装、commit、push、PR、deploy を実行しない。

## 参照資料

- index.md
- artifacts.json
- phase-09.md

## 成果物

- phase-10.md

## 統合テスト連携

| 判定項目 | 結果 |
| --- | --- |
| NON_VISUAL spec-created gate | DOC_PASS |
| Runtime test execution | PENDING_IMPLEMENTATION_APPROVAL |

## リリース順序

1. PR 作成（user 承認後）→ CI green を確認
2. main マージ → staging 自動 deploy（既存 CD パイプライン）
3. staging で 24 時間観測（cron 96 回分の `writeCapHit` 値を確認）
4. production deploy（user 明示指示後のみ）

## 観測項目

| 項目 | 取得手段 | 期待値 |
| --- | --- | --- |
| `writeCapHit` 記録率 | D1 query (deploy 後 LIMIT 96) | deploy 後の成功 job は全行で 0 or 1（旧行 NULL は許容） |
| `sync_write_cap_consecutive_hit` emit 数 | Analytics Engine query / dashboard fallback | 通常 0 件 / cap hit が未達から達成へ遷移した時のみ非ゼロ |
| sync 本体 latency | 既存 metrics | regression なし |
| D1 write/day | 既存 metrics | cap 由来上限見積もり 19,200 write/day を基準に増減を評価 |

## ロールアウト戦略

- 段階的 deploy なし（feature flag 不要 / 後方互換のみ）
- 異常検知時は即 rollback（phase-09 §4）

## 完了条件

- リリース順序 / 観測項目 / ロールアウト戦略が明示される
- production deploy は user 承認まで保留
