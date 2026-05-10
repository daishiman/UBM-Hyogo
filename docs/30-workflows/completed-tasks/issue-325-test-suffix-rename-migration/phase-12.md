# Phase 12 — 実装ガイド・ADR・SSOT 同期・未タスク・skill feedback

本 Phase は task-specification-creator の strict 7 file names に従い、`outputs/phase-12/` 配下に `main.md` + 6 補助ファイルを残す。ADR は補助成果物として同階層に置く。

## 1. strict 7 files + ADR

| # | 成果物 | 責務 | 状態 |
| --- | --- | --- | --- |
| 0 | `outputs/phase-12/main.md` | Phase 12 close-out summary | 実体完成 |
| 1 | `outputs/phase-12/implementation-guide.md` | Part 1 中学生レベル + Part 2 技術者レベル | 実体完成 |
| 2 | `outputs/phase-12/system-spec-update-summary.md` | SSOT 同期記録 | 実体完成 |
| 3 | `outputs/phase-12/documentation-changelog.md` | ドキュメント更新履歴 | 実体完成 |
| 4 | `outputs/phase-12/unassigned-task-detection.md` | Issue #325 内の未タスク 0 件を記録 | 実体完成 |
| 5 | `outputs/phase-12/skill-feedback-report.md` | skill 改善フィードバック | 実体完成 |
| 6 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | コンプライアンスチェック | 実体完成 |
| 補 | `outputs/phase-12/test-file-suffix-adr.md` | suffix 規約 ADR（実装PRの目標状態） | 実体完成 |

## 2. 境界

本 workflow は `implementation_completed / implementation / NON_VISUAL` であり、Phase 12 は実装完了 close-out である。`apps/api/src/**/*.test.ts` の実 rename、typecheck、lint、api test は Phase 11 implementation evidence として取得済みで、PR 作成のみ Phase 13 のユーザー承認待ちとする。

## 3. 未タスク検出

Issue #325 / UT-08A-06 の親責務は `apps/api` の後追い rename に限定する。`apps/web` / `packages` は親 issue の責務外であり、本仕様書の未完了改善として未タスク化しない。

## 4. skill フィードバック

skill feedback は正規名 `outputs/phase-12/skill-feedback-report.md` に記録する。旧 `skill-feedback.md` は使用しない。

## 5. 完了条件チェック

- [x] strict 7 files + ADR が `outputs/phase-12/` 配下に存在
- [x] `test-file-suffix-adr.md` が実装完了境界つきで完成
- [x] `unassigned-task-detection.md` に Issue #325 内の未タスク 0 件と scope-out 境界が記録されている
- [x] placeholder token は Phase 12 成果物から除去済み
