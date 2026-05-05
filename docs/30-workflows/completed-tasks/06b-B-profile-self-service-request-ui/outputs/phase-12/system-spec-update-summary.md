# System Spec Update Summary — 06b-B-profile-self-service-request-ui

## Summary

06b-B は `/profile` に本人の公開停止/再公開申請 UI と退会申請 UIを追加した `implemented-local / implementation / VISUAL_ON_EXECUTION` workflow である。コードは本ブランチに反映済み。deploy、ログイン済み実 screenshot、commit、push、PR はこの close-out では実行しない。

## Step 1-A: タスク完了記録

| Target | Result |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/06b-B-profile-self-service-request-ui/` を current canonical root として登録 |
| old path mapping | `docs/30-workflows/02-application-implementation/06b-B-profile-self-service-request-ui/` から current root への移設を legacy register に記録 |
| quick reference | `indexes/quick-reference.md` の 06b 早見に 06b-B 行を追加 |
| resource map | `indexes/resource-map.md` に 06b-B 行を追加 |
| active workflow | `references/task-workflow-active.md` に 06b-B 行を追加 |

## Step 1-B: 実装状況

| Item | Status |
| --- | --- |
| workflow state | `implemented-local` |
| task type | `implementation` |
| visual evidence | `VISUAL_ON_EXECUTION` (`visualEvidenceClass=VISUAL`) |
| implementation | local code implemented in `apps/web` |
| Phase 11 runtime evidence | deferred runtime capture; logged-in `/profile` screenshot requires local/staging auth + API worker session gate |
| Phase 13 | pending user approval; no commit / push / PR |

## Step 1-C: 関連タスク更新

| Relationship | Task | Status |
| --- | --- | --- |
| depends on | `06b-A-me-api-authjs-session-resolver` | implemented-local; live staging / production smoke delegated to 09a / 09c |
| current task | `06b-B-profile-self-service-request-ui` | implemented-local; runtime visual capture pending |
| blocks | `06b-C-profile-logged-in-visual-evidence` | consumes 06b-B UI runtime screenshot after auth/staging gate |
| downstream | 08b profile E2E full execution | consumes actual UI and screenshot evidence |

## Step 1-H: Skill feedback routing

| Item | Owning skill | Promotion target | Result |
| --- | --- | --- | --- |
| VISUAL_ON_EXECUTION implementation close-out must not mark screenshots PASS before runtime capture | `task-specification-creator` | Existing `VISUAL_ON_EXECUTION` rules cover deferred runtime evidence | no-op; evidence: Phase 11 remains `IMPLEMENTED_AWAITING_VISUAL_CAPTURE` |
| `/profile` request UI error mapping table may become shared UI pattern | `aiworkflow-requirements` | Defer until implementation proves reuse across UI tasks | no-op; evidence: `implementation-guide.md` has task-local table |

## Step 2: 正本仕様更新

**判定: 実施**

理由:

- 本タスクは `/profile` UI route、本人申請 API client、公開停止/退会申請の user-facing contract に触れるため、正本索引への登録が必要。
- `docs/00-getting-started-manual/specs/05-pages.md` / `07-edit-delete.md` は既に本人申請導線と API 契約を持つため、今回の正本更新は aiworkflow-requirements の current canonical set / active workflow / legacy path mapping / implementation guide へ集約する。
- 実 screenshot は未取得のため、Phase 11 の runtime visual evidence は PASS と扱わない。

## Artifacts Parity

root `artifacts.json` と `outputs/artifacts.json` は、workflow state / taskType / visualEvidence / dependency order / Phase 12 output list を同値同期する。Phase 11 は runtime visual capture pending、Phase 13 は pending user approval として分離する。
