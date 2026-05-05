# Lessons Learned: 03b Follow-up 006 Per-Sync Cap Alert

## L-03B006-001: Reset rows must stay in the window

For consecutive cap-hit alerting, "latest N jobs are all cap hits" means failed / skipped jobs reset the streak. Filtering them out can turn `hit, skipped, hit, hit` into a false 3-hit streak.

## L-03B006-002: Emit before releasing the sync lock (invariant)

`emit → lock release` の順序は本仕様の不変条件として固定する。response sync job は同一 sync lock を保持したまま transition event を評価・emit し、その後で lock を release しなければならない。lock を先に release すると、後続 run が完了して両側の evaluation が `previous=true` を観測し、唯一の意図された emit が両方で suppress されて event 欠落が発生する。実装側 (`apps/api/src/jobs/sync-forms-responses.ts`) と detector (`apps/api/src/jobs/cap-alert.ts`) はこの順序前提でテスト済みであり、順序を変更する場合は本不変条件と test fixture を同時に更新すること。

## L-03B006-003: Workflow state follows real files

When a branch contains real `apps/api` code changes, Phase 12, artifacts, quick-reference, and task-workflow-active must be promoted to `implemented-local`; leaving `spec_created / implementation_not_started` is a close-out contradiction.

