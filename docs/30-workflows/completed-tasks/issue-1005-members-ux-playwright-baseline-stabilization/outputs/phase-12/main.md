<!-- workflow: issue-1005-members-ux-playwright-baseline-stabilization / phase: 12 -->

# Phase 12 Main — issue-1005-members-ux-playwright-baseline-stabilization

## Summary

`/members` UX clarity の Playwright visual baseline を cold start（dev server 新規起動）でも
安定生成し、完了タスク dir 移動由来の出力先 path drift を補正した実装 close-out（`implemented_local_evidence_captured`）。
本 Phase 12 はドキュメント同期 strict 7 の集約であり、commit・PR は伴わない。

## 索引（strict 7）

| # | ファイル | 概要 |
| --- | -------- | ---- |
| 1 | `outputs/phase-12/main.md` | 本書（総括・索引） |
| 2 | `outputs/phase-12/implementation-guide.md` | 実装ガイド（中学生 + 技術者レベル / PR 本文流用元） |
| 3 | `outputs/phase-12/system-spec-update-summary.md` | 正本仕様への影響評価 |
| 4 | `outputs/phase-12/documentation-changelog.md` | 作成/更新ドキュメント一覧 |
| 5 | `outputs/phase-12/unassigned-task-detection.md` | 未タスク検出（0 件） |
| 6 | `outputs/phase-12/skill-feedback-report.md` | skill / template / docs 改善 |
| 7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | canonical 9 見出し準拠チェック |

## 状態サマリ

| 項目 | 値 |
| ---- | -- |
| workflow_state | `implemented_local_evidence_captured` |
| 変更対象 | `apps/web/playwright.config.ts` / `apps/web/playwright/tests/members-ux-clarity.spec.ts`（status=present） |
| Phase 11 evidence | 24 PNG / `manual-test-result.md`（status=present） |
| strict 7 | present（本群） |
| Gate-A/B/C | Gate-A/B passed、Gate-C pending・user-gated |

## 対策（RC-1〜RC-4）の要約

- RC-1: config に `isMembersUxClarityBaseline` flag + ready URL `/members` 化、spec に `beforeAll` warm-up で cold-compile race を除去。
- RC-2: spec `workflowRoot` を `completed-tasks/members-list-ux-clarity` へ補正 + env override、config EVIDENCE_DIR 整合。
- RC-3: evidence flag gating で単一 project（desktop-chromium）1 回実行に絞る。
- RC-4: runtime-notes 文言を「cold start で direct-script 補完不要」へ更新。

## user-gated 境界

commit / push / PR(dev base) / staging visual baseline 更新 / Issue #1005 state 変更は user 承認後のみ。
local typecheck / cold-start evidence は本サイクル内で取得済み。

## DoD

- [ ] strict 7 への索引が正しい
- [ ] 状態サマリが artifacts.json（implemented_local_evidence_captured / Gate-C pending）と整合
- [ ] user-gated 境界が明記されている
