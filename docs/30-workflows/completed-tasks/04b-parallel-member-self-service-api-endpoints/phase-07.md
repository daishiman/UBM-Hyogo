# Phase 7: AC マトリクス

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | member-self-service-api-endpoints |
| Phase 番号 | 7 / 13 |
| Phase 名称 | AC マトリクス |
| Wave | 4 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 6 (異常系検証) |
| 次 Phase | 8 (DRY 化) |
| 状態 | pending |

## 目的

Phase 1 で確定した AC-1〜AC-8 を、Phase 4 の verify suite と Phase 5 の runbook step に一対一対応させ、抜け漏れがないことを matrix で保証する。Phase 6 の failure case を AC trace に組み込む。

## AC matrix

| AC | 要件（Phase 1） | 検証（Phase 4） | 実装 step（Phase 5） | failure cover（Phase 6） | 不変条件 |
| --- | --- | --- | --- | --- | --- |
| AC-1 | 未ログイン要求は 401、memberId 露出ゼロ | session.ts unit / GET /me 401 contract / 全 endpoint authz | Step 1 (session middleware) | F-1, F-2 | #11 |
| AC-2 | 自分の memberId 以外取得不可 (path 改ざん 403/404) | self-member-only.ts unit / type test | Step 2 | F-12 | #11 |
| AC-3 | GET /me/profile に editResponseUrl、null 時は fallbackResponderUrl | edit-response-url.ts unit / GET /me/profile contract | Step 4-1 | F-5, F-11 | #1, #4 |
| AC-4 | visibility/delete request が admin_member_notes に queue 投入、本文不変 | self-request-queue.ts unit / POST 202 contract / integration | Step 4-2, Step 5-3, Step 5-4 | F-7, F-9, F-10 | #4, #12 |
| AC-5 | response schema が view model と一致、responseId と memberId 別フィールド | schemas/me.ts type test | Step 5-1, Step 5-2 | - | #7 |
| AC-6 | rate limit 5 req/min (visibility/delete request) | rate-limit-self-request.ts unit / 5 連投 authz | Step 3 | F-6 | #11 |
| AC-7 | GET /me に authGateState (active / rules_declined / deleted) | session.ts unit / GET /me zod contract / authz | Step 1, Step 5-1 | F-3, F-4 | #9 |
| AC-8 | 全 endpoint で notes leak ゼロ | GET 系 zod contract (notes 不在強制) | Step 5-1, Step 5-2 | F-13 | #12 |

## 不変条件 → AC 逆引き

| 不変条件 | 対応 AC |
| --- | --- |
| #1 (schema 固定しすぎない) | AC-3 |
| #4 (本文 D1 編集禁止) | AC-3, AC-4 |
| #5 (apps/web → D1 禁止) | 構造的に保証 (本タスクは apps/api のみ) |
| #7 (responseId vs memberId) | AC-5 |
| #8 (localStorage 非依存) | 構造的に保証 (cookie / JWT のみ) |
| #9 (/no-access 非依存) | AC-7 |
| #11 (他人 memberId 編集禁止) | AC-1, AC-2, AC-6 |
| #12 (admin_member_notes 公開非露出) | AC-4, AC-8 |

## トレース完全性チェック

- [ ] AC-1〜AC-8 のすべてに verify suite が紐づく
- [ ] AC-1〜AC-8 のすべてに runbook step が紐づく
- [ ] F-1〜F-15 のすべてが少なくとも 1 つの AC に紐づく
- [ ] 不変条件 #1, #4, #5, #7, #8, #9, #11, #12 がすべて AC か構造で保証

## 実行タスク

- [ ] この Phase の成果物を作成する
- [ ] 参照資料、成果物、完了条件の整合を確認する
- [ ] artifacts.json の対象 Phase 状態更新条件を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/00-getting-started-manual/specs/06-member-auth.md | AC 由来 |
| 必須 | docs/00-getting-started-manual/specs/07-edit-delete.md | AC 由来 |
| 必須 | docs/30-workflows/02-application-implementation/_design/phase-1-requirements.md | 不変条件 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 8 | DRY 化対象を AC matrix と矛盾しない範囲で評価 |
| Phase 10 | GO/NO-GO の根拠 |
| 08a | matrix を取り込み test 実装 |

## 多角的チェック観点（不変条件マッピング）

- 全不変条件を逆引き表で網羅（理由: Phase 10 GO/NO-GO の入力）
- AC × verify × runbook の三角形が完成しない row があれば NO-GO（理由: 抜け漏れ防止）

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
