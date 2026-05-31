# Phase 12: ドキュメント更新 changelog

Task ID: TASK-MEMBERS-SELECTED-FILTERS-CHIP-UX-HARDENING-001

> 本ワークフローは `workflow_state=implemented_local_runtime_pending`。本 changelog は同 wave の実装・検証・正本同期を記録する。

## workflow-local 同期（本ワークフロー内ドキュメント）

| Step | 対象 | 内容 |
| --- | --- | --- |
| Step 1-A（設計ドキュメント追加・更新） | `outputs/phase-1` 〜 `phase-13` | Phase 1-13 実装仕様書を作成し、同 wave 実装後の evidence boundary へ更新。 |
| Step 1-B（仕様の更新） | `index.md` / `artifacts.json` / `outputs/artifacts.json` | `implemented_local_runtime_pending`、Phase 構成、DoD、gates、検証コマンドを実態へ同期。root / outputs の artifacts parity を保持。 |
| Step 1-C（受入条件・DoD 記録） | `index.md` DoD 節 / Phase 11 / Phase 12 群 | AC-1〜AC-7、focused Vitest 17 PASS、local Playwright component-harness screenshot 3 PASS、typecheck/lint/design-token PASS を記録。 |
| Step 2（system spec 反映） | — | **該当なし**。`system-spec-update-summary.md` の通り Step 2 = N/A（内部 props 拡張のみで公開契約変更なし）。 |

## global skill sync（横断 skill ドキュメント）

| 対象 | 判定 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/**` | **同期済み**。quick-reference / resource-map / task-workflow-active / artifact inventory / changelog / LOGS / SKILL history に `issue-1006-members-selected-filters-chip-ux-hardening` を登録。close-out で lessons-learned（`lessons-learned-issue-1006-members-selected-filters-chip-ux-hardening-2026-05.md` / L-I1006-001..006）を新規追加し、artifact inventory に `## Lessons Learned` 節を追記。focused Vitest 件数は close-out 実 run の 17/17 を正本とし、skill 6 surface に drift していた中間値 16 を統一。 |
| `.claude/skills/task-specification-creator/**` | **変更なし**。implementation target 明確時の spec-only close 禁止は既存 rule で吸収できるため、新規 pattern 追加は不要。 |

> [Feedback BEFORE-QUIT-003] 準拠: workflow-local 同期と global skill sync を別ブロックで記録した。公開 API/IPC 仕様は不変更だが、workflow ledger と artifact inventory は aiworkflow-requirements 正本へ同 wave で同期済み。
