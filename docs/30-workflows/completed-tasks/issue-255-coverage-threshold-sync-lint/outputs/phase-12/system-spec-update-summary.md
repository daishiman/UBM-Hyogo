# System Spec Update Summary

| Area | Update |
| --- | --- |
| coverage threshold SSOT | 変更なし（80% 維持 / 値変更は本タスクの責務外） |
| CI gate surface | `coverage-threshold-lint` job を追加 |
| Runtime boundary | n/a（runtime 影響なし / Cloudflare / D1 / Auth に触れない） |
| SSOT 同期対象 | `index.md` runbook（本ワークフロー root / 既記載） |
| Non-goals | D1 schema, API DTOs, Auth.js semantic config, Cloudflare Workers binding, `apps/web` env, coverage 計測ロジック |

This wave adds a local CI drift lint for coverage thresholds. Implementation status is `LOCAL_IMPLEMENTATION_COMPLETE`. Commit, push, PR creation, and GitHub Actions runtime observation remain user-gated and must not be represented as completed.

## Step 1-A: Task Completion Record

| Target | Result |
| --- | --- |
| `CLAUDE.md` | not edited (no invariant changes) |
| `docs/00-getting-started-manual/specs/00-overview.md` | not edited (no system overview impact) |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | issue-255 quick reference entry 追加 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | issue-255 artifact map entry 追加 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | issue-255 active workflow entry 追加 |
| `.claude/skills/aiworkflow-requirements/references/workflow-issue-255-coverage-threshold-sync-lint-artifact-inventory.md` | new |
| `.claude/skills/aiworkflow-requirements/changelog/20260526-issue255-coverage-threshold-sync-lint.md` | new |
| `.claude/skills/aiworkflow-requirements/SKILL-changelog.md` / `LOGS/_legacy.md` | issue-255 sync row 追加 |
| `docs/30-workflows/completed-tasks/task-codecov-threshold-sync-lint-001.md` | moved from unassigned-task and marked consumed_by_issue_255 |

## Step 1-B: Implementation State

| Layer | State |
| --- | --- |
| workflow root | `implemented_local_evidence_captured` |
| implementation status | `LOCAL_IMPLEMENTATION_COMPLETE` |
| Phase 11 local evidence | present（lint + focused Vitest） |
| implementation cycle code diff | complete |
| Phase 13 commit / push / PR | blocked pending explicit user approval |

## Step 1-C: Related Task Update

| Related task | Action |
| --- | --- |
| `docs/30-workflows/completed-tasks/task-codecov-threshold-sync-lint-001.md` | consumed trace updated |
| Codecov SaaS 導入意思決定 | 独立タスク。本 lint の動的拡張で結合を切り離し済み |
| branch protection 追加 | 別 wave / user 承認必須の governance タスク |

## Step 1-H: Skill Feedback Routing

| Feedback item | Promotion target | Result |
| --- | --- | --- |
| CLOSED issue を Refs 運用で spec 化するパターン | `task-specification-creator` future references | `skill-feedback-report.md` に applied example として記録 / no same-wave edit |
| Markdown SSOT の正規表現抽出パターン | `task-specification-creator` future patterns-lessons | 単一事例のため deferred |
| 任意 source 動的拡張パターン | `aiworkflow-requirements` artifact inventory / task-workflow-active | local test evidence と併せて同一 wave 反映 |

## Step 2: Conditional System Spec Update

**判定: 更新なし**

本タスクは CI 周辺の drift 検知 gate を追加するだけで、API DTO / D1 schema / TypeScript interface / Cloudflare binding / Auth.js config いずれにも影響しない。Step 2 の system spec 更新対象は無し。CI gate surface は `.github/workflows/coverage-threshold-lint.yml` と aiworkflow ledgers に反映済み。

## Artifacts Parity

`artifacts.json` のみを workflow root に配置（`outputs/artifacts.json` mirror は本ワークフローでは生成しない設計 / 既存 web-app-route-bundle-parse-fix の mirror 構成は採用しない / gate-metadata は root artifacts.json を見れば足りる）。

```bash
test -f docs/30-workflows/issue-255-coverage-threshold-sync-lint/artifacts.json
# exit 0
```

## Adjacent Dirty Diff Boundary

本サイクルでは `scripts/` / `.github/workflows/` / `package.json` / aiworkflow ledgers / workflow docs に diff を加える。`apps/` / `packages/` は対象外であり変更なし。

```bash
git status --porcelain docs/30-workflows/issue-255-coverage-threshold-sync-lint
# ?? docs/30-workflows/issue-255-coverage-threshold-sync-lint/
```
