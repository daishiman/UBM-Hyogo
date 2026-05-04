# Phase 12: ドキュメント更新 — ut-web-cov-03-auth-fetch-lib-coverage

[実装区分: 実装仕様書]

判断根拠:
- 本タスクは Vitest unit test 実装に伴うドキュメント更新を扱う。
- CONST_004（実態優先）に従い `implementation` として扱う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-web-cov-03-auth-fetch-lib-coverage |
| phase | 12 / 13 |
| wave | ut-coverage |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

実装結果に応じて関連 docs を更新し、Phase 13 PR で必要となる成果物（implementation-guide ほか 6 種）を揃える。

## 実行タスク

| # | ファイル | 内容 |
| --- | --- | --- |
| 1 | `outputs/phase-12/main.md` | Phase 12 全体の実行結果サマリ |
| 2 | `outputs/phase-12/implementation-guide.md` | Part 1: 中学生レベル説明（「なぜテストを足すのか」「カバレッジって何か」）/ Part 2: 技術者レベル（test pattern / mock 戦略 / coverage 数値） |
| 3 | `outputs/phase-12/system-spec-update-summary.md` | 02-auth.md / 13-mvp-auth.md への影響評価（test 追加のみのため影響なし旨を明記） |
| 4 | `outputs/phase-12/documentation-changelog.md` | 本タスクで触る docs 一覧と差分要約 |
| 5 | `outputs/phase-12/unassigned-task-detection.md` | 未割当タスク検出結果（0 件 or admin lib UT-WEB-COV-04 への委譲明記） |
| 6 | `outputs/phase-12/skill-feedback-report.md` | skill 改善点なし旨と理由 |
| 7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | 仕様書 13 phase が実装と整合しているかの checklist |

## 入出力（CONST_005）

- 入力: Phase 11 実測数値、Phase 9/10 レビュー結果
- 出力: 上記 7 ファイル

## 参照資料

- docs/00-getting-started-manual/specs/02-auth.md
- docs/00-getting-started-manual/specs/13-mvp-auth.md
- Phase 11 実測 evidence

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

- [ ] 7 成果物を作成
- [ ] implementation-guide.md は Part1/Part2 構造を保つ
- [ ] system-spec-update-summary で正本仕様の影響有無を明記
- [ ] documentation-changelog で diff path を列挙

## 成果物

- outputs/phase-12/main.md
- outputs/phase-12/implementation-guide.md
- outputs/phase-12/system-spec-update-summary.md
- outputs/phase-12/documentation-changelog.md
- outputs/phase-12/unassigned-task-detection.md
- outputs/phase-12/skill-feedback-report.md
- outputs/phase-12/phase12-task-spec-compliance-check.md

## 完了条件（DoD / CONST_005）

- 7 成果物全て作成完了
- implementation-guide.md に中学生レベル + 技術者レベルの両 Part が揃っている
- system-spec への影響評価が記録されている

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 13 へ、PR 本文素材（implementation-guide / changelog / 実測数値）を渡す。
