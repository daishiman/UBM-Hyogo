# System Spec Update Summary

| 項目      | 値                          |
| --------- | --------------------------- |
| Phase     | 12 / 13                     |
| 状態      | implemented_local_evidence_captured |
| 作成日    | 2026-05-28                  |

## Step 1-A: 完了タスク記録

| 対象                                                                                   | 更新内容                                              |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| 親 workflow `docs/30-workflows/public-header-logged-in-nav-cleanup/index.md` (Task B 行) | Task B standalone root で local implementation complete を同期 |
| `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md`                               | Task B implemented-local entry を追加                  |
| `.claude/skills/task-specification-creator/LOGS/_legacy.md`                            | Task B automation-30 close-out entry を追加            |
| `.claude/skills/aiworkflow-requirements/indexes/*`                                     | quick-reference / resource-map / task-workflow-active を追記 |

## Step 1-B: 実装状況テーブル

| Task   | 実装状況                |
| ------ | ----------------------- |
| Task B | `implemented_local_evidence_captured`（local tests/typecheck/lint/build PASS） |

> staging runtime、commit、push、PR は user-gated のため未実行。

## Step 1-C: 関連タスクテーブル

| 関連 Task | 関係             | ステータス               |
| --------- | ---------------- | ------------------------ |
| Task A    | 前提（AuthView / PublicHeader auth slot） | 同 wave 最小実装済 |
| Task C-G  | 並走（独立）     | 各 task の `spec_created` |

## Step 2: 新規 interface 追加

`apps/web/src/lib/auth-view/index.ts` を追加し、`AuthView` / `resolveAuthView()` / `getAuthView()` を Task A/B 共通の実装前提として確定した。

## same-wave sync 対象

- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- `.claude/skills/aiworkflow-requirements/references/workflow-task-b-root-page-public-header-async-artifact-inventory.md`（新規）

## 親 workflow 境界

親 workflow `public-header-logged-in-nav-cleanup` 全体は Task C-G と横断 Playwright が残るため `spec_created` のまま。今回同期したのは Task B standalone workflow と、Task A/B の前提 surface（`AuthView` / `PublicHeader` / `(public)/layout.tsx` / root `/`）に限定する。
