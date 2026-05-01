# Phase 7 出力: AC マトリクスサマリ

## 1. 目的

AC-1〜AC-9 と Phase 4 verify suite と Phase 5 runbook step と Phase 6 failure case を 1 対 1 以上で対応させ、空白セルを 0 にする。

## 2. 集計

| 区分 | セル数 | 空白 |
| --- | --- | --- |
| positive AC matrix（9 AC × 5 列） | 45 | 0 |
| negative AC matrix（12 failure × 5 列） | 60 | 0 |
| 合計 | 105 | **0** |

詳細表は `ac-matrix.md` 参照。

## 3. 不変条件 完全担保

| 不変条件 | AC | 担保箇所 |
| --- | --- | --- |
| #5 | AC-7 | rollback A〜D が apps/api 経由のみ + F-12 が apps/web bundle に D1 import を検出 |
| #6 | AC-8 | U-1 grep で apps script trigger 0 hit + cron 設計が Workers Cron Triggers 限定 |
| #10 | AC-9 | Phase 9 試算 121 req/day + F-6/F-7 で接近時の mitigation |
| #15 | rollback A〜D 全件 | rollback-procedures § attendance 整合性確認 |

## 4. blocker 候補（Phase 10 へ）

- B-3（04c の `POST /admin/sync/*` 認可）と B-1（03b running guard）は上流 task。本 wave では blocker 列挙のみで解消は上流側で行う

## 5. 次 Phase への引き継ぎ

- Phase 8 で DRY 化（用語 / URL / snippet 統一）
- Phase 10 GO/NO-GO 判定のとき、本 matrix を「AC matrix 5 軸」の根拠とする
