# Workflow Artifact Inventory: Issue #55 Notification Channel + Opt-out

## Metadata

| Key | Value |
| --- | --- |
| workflow_id | `issue-55-notification-channel-and-optout` |
| workflow root | `docs/30-workflows/issue-55-notification-channel-and-optout/` |
| status | `implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION / production_runtime_pending_user_gate` |
| issue | `#55` |
| created_at | `2026-05-23` |

## Canonical Workflow Files

| Artifact | Path | Status |
| --- | --- | --- |
| entry | `docs/30-workflows/issue-55-notification-channel-and-optout/index.md` | present |
| root artifacts | `docs/30-workflows/issue-55-notification-channel-and-optout/artifacts.json` | present |
| output artifacts mirror | `docs/30-workflows/issue-55-notification-channel-and-optout/outputs/artifacts.json` | present |
| Phase 01-13 | `docs/30-workflows/issue-55-notification-channel-and-optout/phase-*.md` | present |
| Phase 12 strict 7 | `docs/30-workflows/issue-55-notification-channel-and-optout/outputs/phase-12/` | present |

## Implementation Targets

| Area | Path |
| --- | --- |
| notification channel interface | `apps/api/src/services/notification/channel.ts` |
| mail adapter | `apps/api/src/services/notification/channels/mail.ts` |
| registry | `apps/api/src/services/notification/registry.ts` |
| outbox repository | `apps/api/src/repository/notificationOutbox.ts` |
| member preference repository | `apps/api/src/repository/memberNotificationPreference.ts` |
| dispatch tick | `apps/api/src/workflows/notificationDispatchTick.ts` |
| admin API | `apps/api/src/routes/admin/member-notification-pref.ts` |
| migration | `apps/api/migrations/0020_notification_channel_and_opt_out.sql` |
| admin UI | `apps/web/src/features/admin/components/_members/MemberDrawer.tsx` |
| admin client helper | `apps/web/src/lib/admin/api.ts` |

## Current-Code Alignment Decisions

| Decision | Rationale |
| --- | --- |
| Use `member_status.notification_opt_out` | The current schema has `member_status`; there is no base `member` table. |
| Use migration `0020_*` | `0015_*` already exists for audit export manifest and attendance analytics indexes. |
| Add `notification_outbox.channel` now | Registry resolution needs a durable row-level channel source; default `mail` preserves existing rows. |
| Rebuild ledger CHECK | Current `notification_ledger.event_type` CHECK rejects `skipped_opt_out` and `unknown_channel`. |
| Use `MemberDrawer` | Current admin member detail UI is drawer-based; `apps/web/app/(admin)/admin/members/[id]/page.tsx` does not exist. |

## User-Gated Items

- production D1 migration apply
- staging runtime evidence
- commit
- push
- PR creation
