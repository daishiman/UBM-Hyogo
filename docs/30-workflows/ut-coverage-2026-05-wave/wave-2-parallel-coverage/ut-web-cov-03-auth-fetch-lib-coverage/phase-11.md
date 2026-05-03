# Phase 11: 手動 smoke / 実測 evidence — ut-web-cov-03-auth-fetch-lib-coverage

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-web-cov-03-auth-fetch-lib-coverage |
| phase | 11 / 13 |
| wave | ut-coverage |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |

## 目的

実装後の手動 smoke と coverage 実測。NON_VISUAL の場合は evidence ファイルで代替する。

## 実行タスク

1. coverage 実測（apps/api or apps/web）を実行し coverage-result.md に記録する。
2. regression-check.md に既存 test 影響なきことを記録する。
3. NON_VISUAL の場合は manual-evidence.md に手動確認結果を記録する。

## 参照資料

- 起票根拠: 2026-05-01 実測 apps/web coverage（lines=39.39%）
- docs/00-getting-started-manual/specs/02-auth.md
- docs/00-getting-started-manual/specs/13-mvp-auth.md

## 実行手順

- 対象 directory: docs/30-workflows/ut-coverage-2026-05-wave/wave-2-parallel-coverage/ut-web-cov-03-auth-fetch-lib-coverage/
- 本仕様書作成ではアプリケーションコード、deploy、commit、push、PR 作成を行わない。
- 実装・実測時は Phase 5 / Phase 11 の runbook と evidence path に従う。

## 統合テスト連携

- 上流: 05a-authjs-google-oauth-admin-gate, 05b-B-magic-link-callback-credentials-provider
- 下流: 06b-A-me-api-authjs-session-resolver, 09b-A-observability-sentry-slack-runtime-smoke

## 多角的チェック観点

- #2 responseId/memberId separation
- #5 public/member/admin boundary
- #6 apps/web D1 direct access forbidden（fetch wrapper 経由のみ）
- 未実装/未実測を PASS と扱わない。
- placeholder と実測 evidence を分離する。

## サブタスク管理

- [ ] refs を確認する
- [ ] AC と evidence path を対応付ける
- [ ] blocker / approval gate を明記する
- [ ] outputs/phase-11/main.md を作成する

## 成果物

- outputs/phase-11/main.md
- outputs/phase-11/coverage-result.md
- outputs/phase-11/regression-check.md
- outputs/phase-11/manual-evidence.md

## 完了条件

- 全対象 Stmts/Lines/Funcs ≥85% / Branches ≥80%
- auth client は happy / token-missing / token-invalid / network-fail の 4 ケース
- fetch wrapper は 200 / 401 / 403 / 5xx / network-fail を網羅
- me-types は zod or type predicate の round-trip
- 既存 web test に regression なし

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 12 へ、AC、blocker、evidence path、approval gate を渡す。
