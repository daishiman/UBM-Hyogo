# E2E Quality Uplift Stage 0-3 Artifact Inventory

## Metadata

| Item | Value |
| --- | --- |
| Workflow ID | e2e-quality-uplift-stage-0..3 |
| Workflow paths | `docs/30-workflows/e2e-quality-uplift-stage-{0,1,2,3}/` |
| Sync date | 2026-05-09 |
| Branch | `feat/e2e-quality-uplift` |
| PR base | `dev` |
| Stage 0 status | `implementation_complete_pending_pr` (verified) |
| Stage 1 status | `implemented_local / implementation_complete_e2e_verification_recorded` |
| Stage 2-3 status | `spec_verified_pending_dependency` (docs-only spec; Phase 11 placeholder evidence) |
| Phase 12 | strict 7 files present in all 4 stages |

## Stage Responsibility Split (classification-first)

| Stage | 責務 | 実装/仕様の区別 | 依存 |
| --- | --- | --- | --- |
| Stage 0 | Playwright 整備（README / project filter / `evidence-capture` project / logged-in spec split / quality-gate exception 8 行追記） | implementation | none |
| Stage 1 | regression assertion 拡充（email leak / visibility round-trip / delete round-trip）+ Playwright auth fixture signing + server fetch mock API | implemented_local | Stage 0 implementation merged |
| Stage 2 | tier-aware coverage 自動 enforcement（critical ≥80% / standard ≥70% / experimental ≥50%） | spec_verified | Stage 1 implemented_local + workspace 80% guard との境界確定 |
| Stage 3 | branch protection contexts 正本化（CI / Lighthouse / e2e-tests-coverage-gate） | spec_verified | Stage 2 enforcement reachable on dev |

## Current Facts (Stage 0 implementation)

| Area | Artifact |
| --- | --- |
| Playwright README | `apps/web/playwright/README.md` (7 章構成) |
| Playwright config | `apps/web/playwright.config.ts` (`projects[]` に `evidence-capture` を追加) |
| Web package script | `apps/web/package.json` (`e2e` に `--project=desktop-chromium,desktop-firefox,mobile-webkit` を明示) |
| Logged-in evidence spec | `apps/web/playwright/tests/profile-readonly-logged-in.spec.ts`（旧 `profile-readonly.spec.ts` から 06b-C evidence を rename/extract） |
| Stale comment 削除 | `apps/web/playwright/tests/profile-{visibility,delete}-request.spec.ts:2` |
| Quality gate 例外 | `.claude/skills/task-specification-creator/references/quality-gates.md` §7.1 (4) に `evidence-capture` プロジェクト除外条項 8 行 |
| Tier policy reference | `.claude/skills/task-specification-creator/references/coverage-standards.md` (critical/standard/experimental) |
| SKILL.md | `.claude/skills/task-specification-creator/SKILL.md`（tier-aware coverage policy 追記） |
| Phase template | `.claude/skills/task-specification-creator/references/phase-template-core.md`（Phase 11 placeholder evidence 運用追記） |

## Phase 12 Strict 7 Files (all stages)

| File | Stage 0 | Stage 1 | Stage 2 | Stage 3 |
| --- | --- | --- | --- | --- |
| `outputs/phase-12/main.md` | ✓ | ✓ | ✓ | ✓ |
| `outputs/phase-12/implementation-guide.md` | ✓ | ✓ | ✓ | ✓ |
| `outputs/phase-12/system-spec-update-summary.md` | ✓ | ✓ | ✓ | ✓ |
| `outputs/phase-12/documentation-changelog.md` | ✓ | ✓ | ✓ | ✓ |
| `outputs/phase-12/unassigned-task-detection.md` | ✓ | ✓ | ✓ | ✓ |
| `outputs/phase-12/skill-feedback-report.md` | ✓ | ✓ | ✓ | ✓ |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | ✓ | ✓ | ✓ | ✓ |

## Phase 11 Evidence Path Map

| Stage | Evidence kind | Path |
| --- | --- | --- |
| 0 | runtime-evidence (NON_VISUAL) | `outputs/phase-11/evidence/{e2e-run.log,e2e-skip-count.txt,runner-version.txt}` |
| 1 | runtime-evidence (NON_VISUAL, tracked) | `outputs/phase-11/evidence/{e2e-run.txt,e2e-list.txt,e2e-skip-count.txt,runner-version.txt}` |
| 2 | spec-evidence (placeholder) | `outputs/phase-11/main.md`（tier enforcement 実装は別 cycle） |
| 3 | spec-evidence (placeholder) | `outputs/phase-11/main.md`（branch protection 実反映は user-gated） |

> 重要: Stage 2-3 の Phase 11 は `evidence_status: PLANNED_BECAUSE_PHASE11_NOT_EXECUTED`（lessons L-06B-002 と同じ運用）。Stage 1 は実装済みのため `.gitignore` 対象外の `.txt` evidence を正本にする。

## Tier-Aware Coverage Policy

| Tier | E2E coverage 閾値 | 適用例 |
| --- | --- | --- |
| critical | ≥ 80% | login / register / admin mutation 主要動線 |
| standard | ≥ 70% | profile / public members / privacy / terms |
| experimental | ≥ 50% | evidence-capture / placeholder spec |
| workspace guard | 80% (unit/integration 合算) | 全パッケージ（変わらず） |

## Contract

- `evidence-capture` Playwright project は default e2e run から除外（quality-gate §7.1 (4) 例外条項により coverage 閾値判定の対象外）
- Stage 1 の Phase 11 evidence は tracked runtime evidence。Stage 2-3 の Phase 11 evidence は placeholder。実 tier enforcement / branch protection 反映は後続 stage に分離
- Stage 3 の branch protection contexts 正本は GitHub branch protection 実値。CLAUDE.md は運用参照（drift 検出は `gh api repos/daishiman/UBM-Hyogo/branches/{dev,main}/protection | jq '.required_status_checks.contexts'`）
- 4 stage は逐次依存（Stage N+1 は Stage N の実装/仕様 land 後に着手）

## Related Resources

- `indexes/quick-reference.md`（Stage 0-3 4 行登録済み）
- `indexes/resource-map.md`（current canonical set に Stage 0-3 含む）
- `references/task-workflow-active.md`（4 stage + 06b-C リンク）
- `changelog/20260509-e2e-quality-uplift-stage0-3.md`（同期記録）
- `lessons-learned/lessons-learned-e2e-quality-uplift-stages-2026-05.md`（苦戦箇所）
- `references/workflow-06b-c-profile-logged-in-visual-evidence-artifact-inventory.md`（logged-in spec split の起点）
- `references/workflow-06b-c-runtime-evidence-execution-artifact-inventory.md`（runtime evidence 別 cycle）
