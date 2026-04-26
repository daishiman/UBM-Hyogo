# Phase 7: AC マトリクス

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-backoffice-api-endpoints |
| Phase 番号 | 7 / 13 |
| Phase 名称 | AC マトリクス |
| Wave | 4 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 6 (異常系検証) |
| 次 Phase | 8 (DRY 化) |
| 状態 | pending |

## 目的

Phase 1 で確定した AC-1〜AC-11 を、Phase 4 verify suite と Phase 5 runbook step に一対一対応させ、抜け漏れがないことを matrix で保証する。Phase 6 の failure case を AC trace に組み込む。

## AC matrix

| AC | 要件（Phase 1） | 検証（Phase 4） | 実装 step（Phase 5） | failure cover（Phase 6） | 不変条件 |
| --- | --- | --- | --- | --- | --- |
| AC-1 | admin_users 登録 user のみ通過 | admin-gate.ts unit / authz 3 シナリオ | Step 1 | F-1, F-2, F-3 | #11 |
| AC-2 | 本文 PATCH endpoint 不在 | route 一覧 type test | Step 3 (mount しない) | F-4 | #4, #11 |
| AC-3 | notes 公開非露出 | view-model-builder.ts unit / GET /admin/members に notes 不在 zod | Step 5-1 | F-8, F-16 | #12 |
| AC-4 | 認可境界 6 ケース | authz 6 シナリオ | Step 1, Step 2 | F-1, F-2, F-3 | #11 |
| AC-5 | publish_state vs isDeleted 分離 | schemas/admin/status.ts type test | Step 4-2 | F-7 | - |
| AC-6 | tag は queue 経由 | type test | Step 3 (PATCH /tags mount しない), Step 4-3 | F-5 | #13 |
| AC-7 | schema /admin/schema 集約 | route 一覧 test | Step 3, Step 4-4 | F-6 | #14 |
| AC-8 | attendance 重複 / 削除済み | POST attendance 409 / 422 contract | Step 4-5 | F-9, F-10 | #15 |
| AC-9 | audit_log who/what/when/target | audit-trail.ts unit / integration mutation 後の audit | Step 2 | - | - |
| AC-10 | sync trigger 202 + 409 | sync-job-launcher.ts unit / contract POST /admin/sync/* | Step 4-6, Step 5-2 | F-12, F-13, F-14 | - |
| AC-11 | response schema 一致 | schemas/admin/*.ts contract | Step 4 全般 | F-19 | - |

## 不変条件 → AC 逆引き

| 不変条件 | 対応 AC |
| --- | --- |
| #1 (schema 固定しすぎない) | AC-7（schema diff/aliases endpoint で柔軟性） |
| #4 (本文 D1 編集禁止) | AC-2 |
| #5 (apps/web → D1 禁止) | 構造的に保証 |
| #7 (responseId vs memberId) | AC-11 (zod) |
| #11 (他人本文 PATCH 禁止) | AC-1, AC-2, AC-4 |
| #12 (notes 公開非露出) | AC-3 |
| #13 (tag queue 経由) | AC-6 |
| #14 (schema 集約) | AC-7 |
| #15 (attendance 制約) | AC-8 |

## トレース完全性チェック

- [ ] AC-1〜AC-11 のすべてに verify suite が紐づく
- [ ] AC-1〜AC-11 のすべてに runbook step が紐づく
- [ ] F-1〜F-20 のすべてが少なくとも 1 つの AC に紐づく
- [ ] 不変条件 #1, #4, #5, #7, #11, #12, #13, #14, #15 がすべて AC か構造で保証

## 実行タスク

- [ ] この Phase の成果物を作成する
- [ ] 参照資料、成果物、完了条件の整合を確認する
- [ ] artifacts.json の対象 Phase 状態更新条件を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/00-getting-started-manual/specs/11-admin-management.md | AC 由来 |
| 必須 | doc/00-getting-started-manual/specs/12-search-tags.md | AC 由来 |
| 必須 | doc/02-application-implementation/_design/phase-1-requirements.md | 不変条件 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 8 | DRY 化対象を AC matrix と矛盾しない範囲で評価 |
| Phase 10 | GO/NO-GO の根拠 |
| 08a | matrix を取り込み test 実装 |

## 多角的チェック観点（不変条件マッピング）

- 全不変条件を逆引き表で網羅（理由: GO/NO-GO 入力）
- AC × verify × runbook の三角形が完成しない row があれば NO-GO

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | AC matrix 作成 | 7 | pending | outputs/phase-07/ac-matrix.md |
| 2 | 不変条件逆引き | 7 | pending | main.md |
| 3 | トレース完全性チェック | 7 | pending | チェックリスト |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/main.md | Phase 7 主成果物 |
| ドキュメント | outputs/phase-07/ac-matrix.md | matrix 詳細 |
| メタ | artifacts.json | Phase 7 を completed に更新 |

## 完了条件

- [ ] AC matrix の全 row が埋まる
- [ ] 不変条件 → AC 逆引きが完成
- [ ] トレース完全性チェック 4 項目すべて pass

## タスク100%実行確認【必須】

- 全実行タスク completed
- 全成果物配置済み
- 全完了条件チェック
- artifacts.json の Phase 7 を completed に更新

## 次 Phase

- 次: 8 (DRY 化)
- 引き継ぎ事項: matrix を破壊しない範囲で middleware / schema / service の共通化候補を抽出
- ブロック条件: matrix に空欄があれば次 Phase に進まない
