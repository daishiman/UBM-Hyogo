# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 07c-parallel-meeting-attendance-and-admin-audit-log-workflow |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビュー |
| 作成日 | 2026-04-26 |
| 前 Phase | 9 (品質保証) |
| 次 Phase | 11 (手動 smoke) |
| 状態 | completed |

## 目的

Phase 1〜9 の成果物を総点検し、GO / NO-GO を判定する。NO-GO 要因（依存先 wave AC 未達、不変条件違反候補、blocker）を列挙し、解消後に Phase 11 へ進む。

## 実行タスク

- [ ] Phase 1〜9 成果物の存在確認
- [ ] AC × 不変条件 × 上流 wave AC のクロスチェック
- [ ] blocker 一覧 / リスクスコア
- [ ] GO / NO-GO 判定

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-01〜09/main.md | レビュー対象 |
| 必須 | docs/30-workflows/02-application-implementation/04c-parallel-admin-backoffice-api-endpoints/index.md | 上流 AC |
| 必須 | docs/30-workflows/02-application-implementation/06c-parallel-admin-dashboard-members-tags-schema-meetings-pages/index.md | 上流 AC |
| 必須 | docs/30-workflows/02-application-implementation/02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary/index.md | 上流 AC |
| 必須 | docs/30-workflows/02-application-implementation/02b-parallel-meeting-tag-queue-and-schema-diff-repository/index.md | 上流 AC |
| 必須 | docs/30-workflows/02-application-implementation/03b-parallel-forms-response-sync-and-current-response-resolver/index.md | 上流 AC |

## 上流 wave AC 達成チェック

| 上流 task | 必要な AC | 状態 | NO-GO 該当 |
| --- | --- | --- | --- |
| 04c admin API | `/admin/meetings/*` endpoint signature 確定 | 確認要 | yes (未達なら本 task NO-GO) |
| 06c admin pages | `/admin/meetings` UI のクリック発火点定義 | 確認要 | yes |
| 02c admin notes / audit / sync repo | `audit_log` repository signature 確定 | 確認要 | yes |
| 02b meeting / queue repo | `member_attendance` UNIQUE 制約 migration 済み | 確認要 | yes |
| 03b response sync | `member_status.isDeleted` 反映 | 確認要 | yes |

上流のいずれかが未完なら本タスクは **NO-GO**。同 wave 並列の 07a / 07b は本タスク完了に依存しない（互いに独立）。

## 内部 blocker チェック

| 観点 | チェック | 状態 |
| --- | --- | --- |
| AC-1〜7 全 PASS | Phase 7 matrix 全行埋まり | TBD |
| 不変条件 #5 / #7 / #11 / #13 / #15 カバー | Phase 7 不変条件 table | TBD |
| failure cases 9 以上 | Phase 6 list | TBD |
| 無料枠 PASS | Phase 9 見積 | TBD |
| secret hygiene PASS | 新規 secret なし + sanitize | TBD |
| a11y PASS | aria 属性表 | TBD |
| 命名 DRY 化 | Phase 8 Before/After | TBD |
| 擬似コード完全 | Phase 5 hook + 3 endpoint + resolver | TBD |

## リスクスコア

| リスク | 影響 | 確率 | スコア | 緩和策 |
| --- | --- | --- | --- | --- |
| audit_log 漏れ（hook 注入忘れ） | 高 | 中 | 高 | Phase 8 共通化 + Phase 4 contract test で全 endpoint カバー |
| 削除済み会員に attendance 付与 | 中 | 低 | 中 | candidates 除外 + service 422 二重防御 |
| race condition による二重 INSERT | 低 | 低 | 低 | UNIQUE 制約 |
| sync 失敗時 audit 残らない | 中 | 中 | 中 | Phase 6 partial 例外で audit 残置 |
| payload に secret 漏れ | 高 | 低 | 中 | sanitize helper 強制 |

## GO / NO-GO 判定

- **GO 条件**: 上流 5 task の AC 全 PASS、内部 blocker 全 PASS、リスクスコア「高」が緩和策付きで残らない
- **NO-GO 候補**: 上流のいずれか未達、または `auditHook` 共通化が Phase 8 で未確定、または UNIQUE 制約 migration が 02b で未 apply

判定結果（記入）: TBD

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | GO 後に manual smoke 実施 |
| 下流 08a / 08b | 本 task GO が前提 |

## 多角的チェック観点

- 不変条件 **#5** / **#7** / **#11** / **#13** / **#15** の最終照査
- 不変条件 **#6** apps/web → D1 直接 import なきこと（lint 観点、Wave 02c が担保）
- 無料枠と secret hygiene を再点検

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 上流 wave AC 確認 | 10 | pending | 5 上流 task |
| 2 | 内部 blocker チェック | 10 | pending | 8 観点 |
| 3 | リスクスコア記述 | 10 | pending | 5 リスク |
| 4 | GO / NO-GO 判定 | 10 | pending | 結果記入 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/main.md | レビュー結果 |
| メタ | artifacts.json | phase 10 status |

## 完了条件

- [ ] 上流 5 task の AC PASS / NO-GO 確認済み
- [ ] 内部 blocker 8 観点 全 PASS
- [ ] GO 判定（NO-GO なら戻し）

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] 成果物配置済み
- [ ] GO 判定済み
- [ ] artifacts.json の phase 10 を completed

## 次 Phase

- 次: Phase 11 (手動 smoke)
- 引き継ぎ: GO 判定結果、residual risk
- ブロック条件: NO-GO 判定なら Phase 11 不可、blocker 解消後再判定
