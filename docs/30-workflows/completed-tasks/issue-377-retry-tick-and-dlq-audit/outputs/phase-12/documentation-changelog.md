# Documentation Changelog

## 2026-05-05

- Added local implementation evidence and Phase 12 strict artifacts for issue #377.
- Synced retry tick / DLQ audit contract into aiworkflow-requirements indexes and active workflow tracking.
- Clarified cron count parity: top-level, staging, and production stay at three cron triggers.
- Clarified that human-review queued rows are not retry tick targets.
- Corrected Issue #377 state to CLOSED and kept `Refs #377` only.
- Added artifact inventory / changelog / LOGS entries for aiworkflow-requirements.
- Marked source unassigned task as `consumed_by_issue_377`.
- Promoted skill feedback into task-specification-creator references / SKILL changelog / LOGS.
- Updated `docs/00-getting-started-manual/specs/12-search-tags.md` with `admin.tag.queue_dlq_moved`.
