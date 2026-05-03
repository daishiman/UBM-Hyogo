# Phase 10: 最終レビュー — ut-web-cov-03-auth-fetch-lib-coverage

[実装区分: 実装仕様書]

判断根拠:
- 本タスクは Vitest unit test を新規追加するコード変更タスクであり、レビュー対象が test 実装である。
- CONST_004（実態優先）に従い `implementation` として扱う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-web-cov-03-auth-fetch-lib-coverage |
| phase | 10 / 13 |
| wave | ut-coverage |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Phase 9 までの成果（test 実装 + quality gate 結果）を最終レビューし、AC 全項目が充足され不変条件・既存テストへの侵入がないことを確認する。

## 実行タスク

1. AC 全項目が test で検証されているか（Phase 7 マトリクスの再確認）
2. 不変条件 #5（public/member/admin boundary）を侵す test がないか
3. 不変条件 #6（apps/web から D1 直接アクセス禁止）を侵す test がないか
4. mock の漏れによる false-positive がないか（特に `auth.ts` callbacks の signIn google flow）
5. coverage exclude が `me-types.ts` 以外に増えていないか（`vitest.config.ts` の差分確認）
6. 既存 test の改変が最小（追加のみ）か
7. 4 ケース網羅（auth client: happy / token-missing / token-invalid / network-fail）
8. 5 ケース網羅（fetch wrapper: 200 / 401 / 403 / 5xx / network-fail）
9. me-types の round-trip テストが zod or type predicate で実装されているか
10. test-utils/fetch-mock.ts helper の DRY 原則違反がないか
11. test 命名規則が既存 web test と整合しているか
12. CONST_005 の必須項目（変更ファイル / 関数シグネチャ整合 / 入出力 / テスト方針 / コマンド / DoD）がカバーされているか

## レビュー結果記録先

- `outputs/phase-10/main.md`: 上記 12 観点を checklist 形式で PASS/FAIL 記録、FAIL があれば対応指示

## 参照資料

- Phase 4 テスト戦略 / Phase 7 AC マトリクス / Phase 9 実行ログ要約
- docs/00-getting-started-manual/specs/02-auth.md
- docs/00-getting-started-manual/specs/13-mvp-auth.md

## 実行手順

- 対象 directory: docs/30-workflows/ut-web-cov-03-auth-fetch-lib-coverage/
- 本仕様書作成タスクではアプリケーションコード、deploy、commit、push、PR 作成を行わない。
- 実装・実測時は Phase 5 / Phase 11 の runbook と evidence path に従う。

## 統合テスト連携

- 上流: 05a-authjs-google-oauth-admin-gate, 05b-B-magic-link-callback-credentials-provider
- 関連 quality gate: 06b-A-me-api-authjs-session-resolver; release readiness handoff: 09b-A-observability-sentry-slack-runtime-smoke

## 多角的チェック観点

- #2 responseId/memberId separation
- #5 public/member/admin boundary
- #6 apps/web D1 direct access forbidden（fetch wrapper 経由のみ）
- 未実装/未実測を PASS と扱わない。
- placeholder と実測 evidence を分離する。

## サブタスク管理

- [ ] 12 観点を一つずつ PASS/FAIL で評価
- [ ] FAIL 観点には Phase 5 / Phase 9 への戻し指示を明記
- [ ] outputs/phase-10/main.md にレビュー結果を記録

## 成果物

- outputs/phase-10/main.md

## 完了条件（DoD / CONST_005）

- 12 観点全て PASS
- 失敗時は Phase 9 / Phase 5 へ戻して再実行する経路が記載されている

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 11 へ、レビュー結果と evidence 取得指示を渡す。
