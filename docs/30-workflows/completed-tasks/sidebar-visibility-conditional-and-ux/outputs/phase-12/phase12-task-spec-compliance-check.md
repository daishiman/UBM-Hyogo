# Phase 12 Task Spec Compliance Check

## 1. Summary verdict

Verdict: `implemented_local_evidence_captured（local pixel partial captured / staging pixel・commit/PR は user-gated）`

本 workflow は task-specification-creator の構造要件（Phase 1-13 + strict 7）を満たし、`apps/web` の実コード実装・
direct focused vitest・typecheck・lint まで完了した **実装タスク**である。
local pixel screenshot 4 枚は取得済み。staging/admin visual baseline・commit / push / PR は **user-gated** に属する。
本 workflow は Phase 12 完了条件を満たし、`docs/30-workflows/completed-tasks/sidebar-visibility-conditional-and-ux/` へ移動済み。`hasCompletedTasksAncestor=true`。

## 2. Changed-files classification

| Classification | Paths |
| --- | --- |
| workflow specification | `docs/30-workflows/completed-tasks/sidebar-visibility-conditional-and-ux/**` |
| aiworkflow sync | `task-workflow-active.md` / quick-reference / resource-map / artifact inventory / lessons / changelog / LOGS を同 wave 更新 |
| task-spec feedback log | `outputs/phase-12/skill-feedback-report.md` + `task-specification-creator/references/patterns-lessons-and-pitfalls.md` へ promotion 候補 |
| apps/packages code | `(auth)` route group 移動 / middleware x-pathname / admin activePath / shell 分岐強化 / targeted tests |

## 3. `workflow_state` and phase status consistency

| Field | Value | Verdict |
| --- | --- | --- |
| `metadata.workflow_state` | `implemented_local_evidence_captured` | consistent |
| `metadata.taskType` | `implementation` | consistent |
| `metadata.visualEvidence` | `VISUAL` | consistent |
| Phase 10 | `passed`（BLOCKER なし / MINOR-1〜3 は境界内） | consistent |
| Phase 11 | `local_evidence_captured_pixel_partial`（local deterministic evidence PASS / local screenshots 4 PNG present / staging/admin pixel user-gated） | source-level and local visual evidence captured; staging boundary explicit |
| Phase 12 | `completed`（strict 7 present） | consistent |
| Phase 13 | `pending_user_approval`（実装 / commit / PR user-gated） | consistent |

## 4. Phase 11 evidence file inventory

| Classification | Path | Status |
| --- | --- | --- |
| manual test plan | `docs/30-workflows/completed-tasks/sidebar-visibility-conditional-and-ux/phase-11-manual-test.md` | present |
| manual test result | `docs/30-workflows/completed-tasks/sidebar-visibility-conditional-and-ux/outputs/phase-11/manual-test-result.md` | present |
| screenshot `/login` bare | `docs/30-workflows/completed-tasks/sidebar-visibility-conditional-and-ux/outputs/phase-11/screenshots/login-bare.png` | present |
| screenshot viewer guest (desktop) | `docs/30-workflows/completed-tasks/sidebar-visibility-conditional-and-ux/outputs/phase-11/screenshots/sidebar-viewer-guest.png` | present |
| screenshot viewer guest (mobile) | `docs/30-workflows/completed-tasks/sidebar-visibility-conditional-and-ux/outputs/phase-11/screenshots/sidebar-viewer-guest-mobile.png` | present |
| screenshot mobile drawer | `docs/30-workflows/completed-tasks/sidebar-visibility-conditional-and-ux/outputs/phase-11/screenshots/sidebar-mobile-drawer.png` | present |

> local pixel screenshot は `/login` / viewer public shell / mobile drawer の 4 PNG を取得済み。
> admin 認証・staging visual baseline は production-equivalent running stack 依存（staging 認証 user-gated）で取得する。

## 5. Phase 12 strict 7 file inventory

| File | Status |
| --- | --- |
| `outputs/phase-12/main.md` | present |
| `outputs/phase-12/implementation-guide.md` | present |
| `outputs/phase-12/system-spec-update-summary.md` | present |
| `outputs/phase-12/documentation-changelog.md` | present |
| `outputs/phase-12/unassigned-task-detection.md` | present |
| `outputs/phase-12/skill-feedback-report.md` | present |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | present |

## 6. Skill/reference/system spec same-wave sync

| Target | Status |
| --- | --- |
| `docs/00-getting-started-manual/specs/09h-shell-and-fixtures.md` §1.2 / §1.6（admin nav 契約 + `(auth)` マトリクス明示） | updated |
| `references/task-workflow-active.md` | present |
| artifact inventory | present |
| indexes（resource-map / quick-reference） | present |
| lessons-learned | present |
| SKILL-changelog / LOGS | present |

> 本件は新規 public interface（新 export 関数 / 新 type）を持たない。system spec の Step 2 該当の実体は
> 09h §1.6 マトリクスへの `(auth)` route group 明示（spec drift 解消）と、09h §1.2 admin nav 契約の実装同期である。

## 7. Runtime or user-gated boundary

| Boundary | Status |
| --- | --- |
| Phase 1-13 仕様 | present |
| apps/web 実コード（`(auth)` 移動 / middleware x-pathname / admin activePath / viewer identity / active 視認性） | completed |
| direct focused vitest / typecheck / lint（AC-9） | PASS（20 files / 98 tests） |
| local pixel screenshots | present（4 PNG） |
| staging/admin pixel screenshots | pending（staging 認証 user-gated） |
| staging visual baseline | pending（user-gated） |
| commit / push / PR | pending（user-gated） |

## 8. Archive/delete stale-reference gate

workflow root は Phase 12 完了条件に基づき completed-tasks 配下へ移動済み。
（`docs/30-workflows/completed-tasks/sidebar-visibility-conditional-and-ux/`）で aiworkflow 台帳へ `implemented_local_evidence_captured` として登録済み。
`hasCompletedTasksAncestor=true`。`artifacts.json` と `outputs/artifacts.json` は両方 present（parity 維持）。

## 9. Four-condition verdict

| Condition | Verdict | Evidence |
| --- | --- | --- |
| 矛盾なし | PASS | local implementation complete / local pixel partial captured / staging pixel user-gated 境界を明確に分離 |
| 漏れなし | PASS | Phase 1-13 + Phase 10/11（plan/result）+ strict 7 が present。MINOR-1〜3 を detection に記録 |
| 整合性あり | PASS | artifacts.json / phase status / strict 7 が `implemented_local_evidence_captured` 語彙で一致 |
| 依存関係整合 | PASS | 親系譜 Task A/B/C/E・issue-1024 は dev マージ済み。本件はその差分修正。09h §1.6 への `(auth)` 明示（Step 2）を記録 |
