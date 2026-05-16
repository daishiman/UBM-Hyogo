# Issue #668 RB-3b-03 / RB-3b-04 paths filter + shell prelude Artifact Inventory

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | issue-668-stage3b-rb03-rb04-paths-filter-shell-helper |
| タスク種別 | implementation / NON_VISUAL |
| canonical task root | `docs/30-workflows/issue-668-stage3b-rb03-rb04-paths-filter-shell-helper/` |
| 状態 | implemented-local-runtime-pending / Phase 13 pending_user_approval |
| Issue | #668 (CLOSED 維持。PR 文脈は `Refs #668` のみ) |
| 起票元 | `docs/30-workflows/unassigned-task/task-e2e-stage3b-rb-followup-composite-actions-001.md` (RB-3b-03 / RB-3b-04 split-migrated) |

## Current Facts

| 項目 | 正本 |
| --- | --- |
| e2e required context | `e2e-tests-coverage-gate` (preserved) |
| precheck owner | `.github/workflows/e2e-tests.yml` `precheck` job |
| precheck output | `run_e2e=true|false` |
| precheck allowlist entries | 8 |
| no-op success path | docs-only PR は `e2e-tests-coverage-gate` を no-op success で埋める |
| skip workflow | 採用しない (mixed PR の duplicate context 回避) |
| shell prelude | `scripts/lib/ci-shell-prelude.sh` (source only) |
| prelude exports | `gh_notice`, `gh_warning`, `gh_error`, `assert_jq`, `awk_compare_ge`, `set -euo pipefail`, `umask 077` |
| direct-exec guard | `BASH_SOURCE[0] == 0` で exit 2 |
| shellcheck gate | `.github/workflows/lint-shell.yml` (`--severity=warning --external-sources`) |
| coverage threshold | 80 |
| THRESHOLD_FIXTURE | 79 / 80 / 81 regression fixture preserved (`coverage-gate-e2e.sh`) |
| branch protection mutation | 不要 (既存 context 名保持) |
| runtime boundary | dry-run PR / GitHub Actions runtime / Issue comment / commit / push / PR は user approval 後 |

## Implementation Targets

| Path | Action |
| --- | --- |
| `.github/workflows/e2e-tests.yml` | edit (precheck + matrix gating + no-op success) |
| `.github/workflows/lint-shell.yml` | new (shellcheck gate) |
| `scripts/lib/ci-shell-prelude.sh` | new (source-only prelude) |
| `scripts/coverage-gate-e2e.sh` | edit (prelude 採用 / 不変条件保持) |
| `scripts/coverage-guard.sh` | edit (prelude 採用) |
| `scripts/cf-waf-apply/lib.sh` | edit (shellcheck cleanup) |
| `scripts/observability-target-diff.sh` | edit (shellcheck cleanup) |
| `scripts/verify-09c-no-visual-values.sh` | edit (shellcheck cleanup) |

## Phase Outputs

| Phase | 場所 | 主要成果物 |
| --- | --- | --- |
| 1-10 | `phase-1.md` ... `phase-10.md` | 要件定義から最終レビュー |
| 11 | `phase-11.md`, `outputs/phase-11/local-evidence-summary.md`, `outputs/phase-11/evidence/` | NON_VISUAL local evidence (bash -n / shellcheck / paths-symmetry / coverage dry-run / inventory) |
| 12 | `outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md` | strict 7 outputs |
| 13 | `phase-13.md` | PR / runtime evidence / user approval gate |

## Skill 反映先

| ファイル | 反映内容 |
| --- | --- |
| `indexes/quick-reference.md` | Issue #668 quick lookup |
| `indexes/resource-map.md` | current canonical set 登録 |
| `references/task-workflow-active.md` | active workflow entry |
| `references/branch-protection.md` | `e2e-tests-coverage-gate` 不変条件 |
| `references/lessons-learned-issue-668-paths-filter-shell-prelude-2026-05.md` | 苦戦箇所 / 再発防止 |
| `changelog/20260514-issue668-rb03-rb04-paths-shell-helper.md` | canonical decisions |
| `docs/30-workflows/LOGS.md` | 2026-05-14 エントリ |
| `docs/30-workflows/unassigned-task/task-e2e-stage3b-rb-followup-composite-actions-001.md` | split-migrated 注釈 |

## task-specification-creator 反映

| ファイル | 反映内容 |
| --- | --- |
| `SKILL.md` | single-workflow precheck pattern guidance |
| `references/phase-template-phase11.md` | NON_VISUAL evidence pattern (precheck symmetry / no-op context success) |

## Verification Commands

| Command | Expected |
| --- | --- |
| `test -f docs/30-workflows/issue-668-stage3b-rb03-rb04-paths-filter-shell-helper/artifacts.json` | exit 0 |
| `find docs/30-workflows/issue-668-stage3b-rb03-rb04-paths-filter-shell-helper/outputs/phase-12 -maxdepth 1 -type f \| wc -l` | `7` |
| `rg -n "issue-668-stage3b-rb03-rb04-paths-filter-shell-helper\|RB-3b-03\|RB-3b-04" .claude/skills/aiworkflow-requirements` | registered references |
| `node .claude/skills/aiworkflow-requirements/scripts/validate-structure.js` | warnings only (pre-existing 500-line files); no errors |
| `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js` | topic-map / keywords regenerated cleanly |
