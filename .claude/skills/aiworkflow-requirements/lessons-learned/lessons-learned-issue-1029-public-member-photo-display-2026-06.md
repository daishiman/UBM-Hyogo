# Lessons Learned: issue-1029 public member photo display

## Context

Issue #1029 extends the already-landed #983 member photo storage surface to public member list/profile responses. The implementation reuses `member_photos`, private R2 presigned GET URLs, and existing Avatar fallback behavior. It adds optional `photoUrl` to shared public viewmodels, API routes/use-cases, and public web components.

## L-1029-001: Upstream asset reuse needs Phase 1 anchors

| Field | 内容 |
| --- | --- |
| symptom | Phase 12 initially risked inventing new artifact names for assets already owned by #983. |
| cause | Reuse of upstream implementation assets was implicit, so workflow outputs could drift from actual code ownership. |
| recurrence condition | A task extends a landed parent feature and reuses repository tables, helpers, or UI primitives. |
| 5-minute resolution | In Phase 1, create an upstream anchor table with concrete code paths and line anchors, then carry those identifiers into Phase 12 artifact inventory. |
| evidence path | `docs/30-workflows/completed-tasks/issue-1029-public-member-photo-display/outputs/phase-1/spec-extraction-map.md` |
| promoted-to | `.claude/skills/task-specification-creator/references/patterns-phase12-sync.md` |

## L-1029-002: Optional resolver DI preserves existing public use-case tests

| Field | 内容 |
| --- | --- |
| symptom | Adding `photoUrl` could have forced broad fixture rewrites across public list/profile use-case tests. |
| cause | The R2 presign concern lives at route/provider boundary, while use-cases already had stable repository-focused tests. |
| recurrence condition | A response field depends on runtime provider state but existing use-case tests should remain provider-free. |
| 5-minute resolution | Add an optional resolver dependency with default absence preserving old behavior, then cover resolver-present and resolver-failure branches in focused tests. |
| evidence path | `docs/30-workflows/completed-tasks/issue-1029-public-member-photo-display/outputs/phase-11/evidence/focused-vitest.log` |
| promoted-to | `.claude/skills/task-specification-creator/references/patterns-phase12-sync.md` |

## L-1029-003: Local visual evidence and real R2 URL capture are different gates

| Field | 内容 |
| --- | --- |
| symptom | Phase 12 wording could mark screenshots pending even though local Playwright visual evidence existed. |
| cause | VISUAL_ON_EXECUTION mixed local mock runtime screenshots with staging deploy and real R2 presigned URL capture. |
| recurrence condition | UI can render the new field locally, but provider credentials or staging deploy are user-gated. |
| 5-minute resolution | Mark local screenshots as present, keep real provider URL capture as Gate-C user-gated, and state both paths in compliance check. |
| evidence path | `docs/30-workflows/completed-tasks/issue-1029-public-member-photo-display/outputs/phase-11/screenshots/` |
| promoted-to | `.claude/skills/task-specification-creator/references/patterns-phase12-sync.md` |
