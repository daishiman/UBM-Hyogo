# Documentation Changelog — Issue #1016 Task E: Mobile drawer responsive

workflow-local 同期と global skill sync を別ブロックで記録する（FB-BEFORE-QUIT-003）。本サイクルは **実コード + focused tests + 正本同期**まで完了し、visual/runtime/PR のみ user-gated として残す。

## Block A: workflow-local 同期（本サイクルで実施）

### 2026-05-31

- workflow root `docs/30-workflows/completed-tasks/issue-1016-sidebar-mobile-drawer-responsive/` を作成。
- Phase 1-13 タスク仕様書を作成（Phase 11 は local screenshot `present` / staging visual `pending`）。
- Phase 12 strict 7 成果物を materialize:
  - `main.md`（Phase 12 概要）
  - `implementation-guide.md`（Part 1 中学生 / Part 2 技術者 / 視覚証跡）
  - `system-spec-update-summary.md`（Step 1-A〜1-C / Step 2 = N/A）
  - `documentation-changelog.md`（本ファイル）
  - `unassigned-task-detection.md`（MINOR M-1〜M-3 判定）
  - `skill-feedback-report.md`
  - `phase12-task-spec-compliance-check.md`（先行作成済・本サイクル不変更）
- root / outputs `artifacts.json` の parity を確立（`workflow_state = implemented_local_runtime_pending`）。
- Phase 11 evidence（`manual-test-result.md` + screenshot 4 枚 canonical 名 + `metadata.json`）を配置（local screenshot は全て `present`）。
- `apps/web/src/components/shell/SidebarMobileTrigger.tsx` / `SidebarDrawer.tsx` を追加。
- `apps/web/src/components/shell/useSidebarState.ts` に route close と md 初期 collapsed を追加。
- `apps/web/src/components/shell/SidebarShell.tsx` に mobile trigger strip と drawer mount を追加。
- `apps/web/src/lib/is-browser.ts` に `browserMatchMedia()` を追加し、jsdom/SSR で `matchMedia` 不在時に安全に fallback。
- `apps/web/src/styles/globals.css` に `body[data-shell-drawer-open="true"]` scroll lock を追加。
- focused Vitest 4 files / 21 tests PASS を `outputs/phase-11/evidence/focused-vitest.log` に配置。

## Block B: global skill sync（本サイクルで実施）

新規公開インターフェース（API / IPC）の追加はないため、aiworkflow は workflow 状態・実装対象・証跡 inventory の同期に限定する。

| 対象 skill / 正本 | 反映予定内容 | タイミング |
|------------------|------------|-----------|
| `aiworkflow-requirements/references/task-workflow-active.md` | Task E を `implemented_local_runtime_pending` で登録 | 完了 |
| `aiworkflow-requirements/indexes/{quick-reference,resource-map}` | Task E 索引追加 | 完了 |
| `aiworkflow-requirements/references/workflow-issue-1016-sidebar-mobile-drawer-responsive-artifact-inventory.md` | inventory 新規 + `## Lessons Learned` | 完了 |
| `aiworkflow-requirements/changelog/20260531-issue1016-sidebar-mobile-drawer-responsive.md` + `LOGS/_legacy.md` | dated エントリ | 完了 |
| `task-specification-creator/lessons-learned/sidebar-mobile-drawer-responsive.md` | implementation target gate と先行未消費 state 消費パターン | 完了 |

`topic-map` / `keywords` の再生成は既存 index rebuild pipeline に委ねる。今回の必須同期対象は active lookup で使う quick-reference / resource-map / task-workflow-active / inventory。
