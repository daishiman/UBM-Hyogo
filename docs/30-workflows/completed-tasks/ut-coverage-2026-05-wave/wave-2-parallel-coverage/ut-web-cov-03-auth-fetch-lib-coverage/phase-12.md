# Phase 12: ドキュメント更新 — ut-web-cov-03-auth-fetch-lib-coverage

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-web-cov-03-auth-fetch-lib-coverage |
| phase | 12 / 13 |
| wave | ut-coverage |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |

## 目的

ドキュメント更新、未タスク検出、skill feedback、compliance check を作成する（必須 7 成果物）。

## 実行タスク

1. implementation-guide.md（Part 1 中学生レベル + Part 2 技術者レベル）を作成する。
2. system-spec-update-summary.md を作成する。
3. documentation-changelog.md を更新する。
4. unassigned-task-detection.md を作成する（0 件でも必須）。
5. skill-feedback-report.md を作成する（改善点なしでも必須）。
6. phase12-task-spec-compliance-check.md を作成する。

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
- [ ] outputs/phase-12/main.md を作成する

## 成果物

- outputs/phase-12/main.md
- outputs/phase-12/implementation-guide.md
- outputs/phase-12/system-spec-update-summary.md
- outputs/phase-12/documentation-changelog.md
- outputs/phase-12/unassigned-task-detection.md
- outputs/phase-12/skill-feedback-report.md
- outputs/phase-12/phase12-task-spec-compliance-check.md

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

Phase 13 へ、AC、blocker、evidence path、approval gate を渡す。
