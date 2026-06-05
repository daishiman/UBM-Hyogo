# Documentation Changelog

本 wave のドキュメント同期結果を Step 単位で記録する。該当なしの Step も明示記録する。

## workflow-local sync（本 workflow root 内）

| Step | 結果 | 詳細 |
| --- | --- | --- |
| index.md | 整合済み | status `implemented_local_runtime_pending` / implementation / VISUAL_ON_EXECUTION・AC-1..7・スコープ判断表が確定 |
| artifacts.json | 整合済み | `workflow_state=implemented_local_runtime_pending` / `canonical_screenshots` / `verify_commands` / gates（Gate-A passed, Gate-B/C pending）を保持 |
| Phase 1-10 spec | 作成済み | 各 phase-N 仕様書が completed (spec) |
| outputs/phase-11/manual-test-result.md | 新規作成 | runtime_pending の証跡 ledger |
| outputs/phase-12/main.md | 新規作成 | Phase 12 サマリ |
| outputs/phase-12/implementation-guide.md | 新規作成 | 2 部構成 + 視覚証跡 |
| outputs/phase-12/system-spec-update-summary.md | 新規作成 | Step 1-A/B/C + Step 2（N/A） |
| outputs/phase-12/unassigned-task-detection.md | 新規作成 | current / baseline 未タスク |
| outputs/phase-12/skill-feedback-report.md | 新規作成 | skill 改善フィードバック |
| outputs/phase-12/phase12-task-spec-compliance-check.md | 新規作成 | canonical 9 見出し compliance |
| outputs/phase-13/pr-creation-result.md | 新規作成 | pending_user_approval |
| unassigned source trace | 更新済み | `docs/30-workflows/unassigned-task/task-issue-1036-followup-001-staging-authenticated-bulk-tag-visual-baseline.md` を `partially_consumed_by_issue_1077` に同期 |

## global skill sync（`.claude/skills/aiworkflow-requirements/`）

| 対象 | 結果 | 詳細 |
| --- | --- | --- |
| references/task-workflow-active.md | 更新済み | 本 workflow を active ledger に登録 |
| indexes/quick-reference.md | 更新済み | 1 行エントリ追加 |
| indexes/resource-map.md | 更新済み | workflow root パス追加 |
| references/workflow-issue-1077-...-artifact-inventory.md | 作成済み | artifact inventory |
| changelog/20260603-issue-1077-...md | 作成済み | changelog エントリ |
| indexes/{topic-map,keywords.json} | `pnpm indexes:rebuild` で再生成 | `workflow-issue-1077-bulk-tag-authenticated-staging-visual-artifact-inventory.md` が topic-map / keywords に登録済み |
| LOGS / SKILL-changelog | 更新済み | union-merge 対象 |

> global skill sync は本 wave で実施済み。`indexes:rebuild` は冪等で drift gate（`verify-indexes-up-to-date`）対象のため、手動編集後に必ず再生成する。

## system spec sync（`docs/00-getting-started-manual/specs/`）

**該当なし**。新規 interface / API / schema 追加がないため system spec 更新は不要（system-spec-update-summary.md Step 2 参照）。

## apps ソース / D1 / Form

**該当なし**。apps/web Playwright spec は追加したが、apps 本番ソース / D1 / Form の変更はゼロ。runtime command は `PLAYWRIGHT_EVIDENCE_DIR` を本 workflow の `outputs/phase-11/evidence` に固定し、既存 staging visual evidence path を汚さない。
