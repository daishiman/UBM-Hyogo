# System Spec Update Summary

Status: completed

## Step 1 — Same-wave system spec & skill index sync

### Step 1-A: System specs (`docs/00-getting-started-manual/specs/`)

- `docs/00-getting-started-manual/specs/11-admin-management.md`: `/admin/meetings` now includes PATCH, soft delete, CSV export, and `{ attended }` attendance alias.

### Step 1-B: aiworkflow-requirements references

- `.claude/skills/aiworkflow-requirements/references/api-endpoints.md`: `/admin/meetings/:sessionId/attendances` `{ memberId, attended }`, PATCH, CSV export, and failure matrix are synchronized as the 06c-E canonical admin meetings API; legacy `/attendance` POST/DELETE remains compatibility-only.
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`: 06c-E row added.
- `.claude/skills/aiworkflow-requirements/references/lessons-learned.md`: 06c-E hub link + L-06CE-001〜004 サマリ追加。
- `.claude/skills/aiworkflow-requirements/references/lessons-learned-06c-E-admin-meetings-2026-05.md`: 新規 lesson hub。

### Step 1-C: aiworkflow-requirements indexes (resource-map / quick-reference)

- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`: 06c-E resource row added.
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`: 06c-E quick reference added.

### Step 1-H: Auto-regenerated indexes (topic-map / keywords)

- `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` / `keywords.json`: regenerated after same-wave spec updates (`pnpm indexes:rebuild`).

## Step 2 — New API contract registration: APPLIED

PATCH `/admin/meetings/:sessionId`, GET `/admin/meetings/:sessionId/attendances/export.csv`, and `/admin/meetings/:sessionId/attendances` `{ memberId, attended }` alias are **newly added admin interfaces**, so Step 2 applies (not N/A).

Evidence:

- `api-endpoints.md` L102-119: PATCH / `{ attended }` / 失敗マトリクス (404/409/422) / 04c legacy 互換境界を canonical として登録済み。
- `11-admin-management.md` L64-90: 同 endpoint 群を user-facing spec として登録済み。
- `task-workflow-active.md` L316: 06c-E 行に `migration 0013 / 3 endpoint / error matrix / focused PASS / visual 委譲` を 1 行サマリで記録。

Backwards compatibility: legacy `POST/DELETE /admin/meetings/:sessionId/attendance` は互換性目的で維持し、新 IF へ deprecation を強制しない（system-wide breaking change を避けるため）。

Review fixes completed in this cycle:

- Renamed the new D1 migration to `apps/api/migrations/0013_meeting_sessions_soft_delete.sql` to avoid the existing `0010_identity_merge_audit.sql`.
- Added shared attendance repository guards for unknown member and active meeting checks.
- Fixed web admin helpers to use the 06c-E canonical `/attendances` `{ attended }` endpoint.
- Synchronized duplicate / deleted member / unknown member / soft-deleted meeting status matrix across code, tests, workflow docs, and system specs.
- Confirmed `packages/shared` `MeetingSession` remains the public/profile attendance contract; 06c-E admin meetings uses local admin view types for `deletedAt`.

`outputs/artifacts.json` は root `artifacts.json` と同内容で配置済み。parity check は root / outputs の一致で PASS とする。
