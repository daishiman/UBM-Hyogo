# task-issue195-sync-jobs-contract-schema-consolidation-001

## Status

- status: resolved
- source: issue-195-03b-followup-002-sync-shared-modules-owner Phase 12
- type: implementation / docs
- resolved-by: docs/30-workflows/issue-195-sync-jobs-contract-schema-consolidation-001/
- resolved-date: 2026-05-04
- resolved-pr: pending_user_approval

## Purpose

Consolidate the `sync_jobs` `job_type` enum and `metrics_json` schema into a shared contract after the sync shared module owner table has been established.

## Scope

- Define the canonical `job_type` values used by 03a / 03b sync jobs.
- Define the `metrics_json` shape and redaction boundary.
- Decide whether the shared contract belongs in `packages/shared` or an API-local schema first.
- Update references that currently treat this work as pending.

## Out of Scope

- Creating a PR without explicit user approval.
- Moving unrelated canonical workflow directories.

## Acceptance Criteria

- Owner / co-owner table in `docs/30-workflows/_design/sync-shared-modules-owner.md` is referenced.
- Runtime and documentation contracts agree on `job_type` and `metrics_json`.
- Existing tests or focused contract tests cover the canonical values.

## 苦戦箇所（先行 wave からの引継ぎ）

出典: `.claude/skills/aiworkflow-requirements/references/lessons-learned-issue-195-03b-followup-sync-shared-modules-owner-2026-05.md`

- **L-001 classification-first（governance vs runtime spec vs task output）**: 共有モジュールに関する文書は `runtime spec` / `task workflow output` / `workflow governance design` の3軸で分類する。3 番目に該当する文書は `docs/30-workflows/_design/` に配置し、個別 task の `index.md` 末尾に追記しない。本タスクの `job_type` enum / `metrics_json` schema 集約は runtime spec に該当するため、`packages/shared` または `apps/api` 配下のソースに置き、`_design/` に置かない。
- **L-002 current canonical path 削除 guard**: `sync_jobs` schema 関連の path 削除（D 差分）が発生する場合は `legacy-ordinal-family-register.md` の §Current Alias Overrides に move destination を行追加するか、新 path への実 R 移動で対応する。`D` 単独はブランチ全体 4 条件（矛盾なし・漏れなし・整合性・依存関係整合）の自動 FAIL とする。
- **L-003 docs-only governance owner 表テンプレ未整備**: governance 文書の Phase 6-11 AC（5列 schema 検証 / リンク 1-hop 到達 grep / secret-hygiene grep / NON_VISUAL evidence 3 ファイル）は都度組み立てが必要。本タスクで `_design/sync-shared-modules-owner.md` の owner 表行を更新する場合は同 AC を再実行する。
- **L-004 Phase 12 strict 7 filenames drift**: Phase 12 出力は `main.md` / `implementation-guide.md` / `system-spec-update-summary.md` / `documentation-changelog.md` / `unassigned-task-detection.md` / `skill-feedback-report.md` / `phase12-task-spec-compliance-check.md` の 7 ファイル固定。`system-spec-update.md` 等の旧名混入に注意。
- **L-005 用語不整合（owner / co-owner と 主担当 / サブ担当）**: 03a / 03b の active spec / Phase output に「主担当 / サブ担当」が混在しないよう、本タスクで新規追加する schema document には冒頭に「owner = 主担当 / co-owner = サブ担当」alias 表を 1 行入れる。
