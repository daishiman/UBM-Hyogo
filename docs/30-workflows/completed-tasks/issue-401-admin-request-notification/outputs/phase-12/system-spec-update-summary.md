# System Spec Update Summary

## Same-Wave Sync

| File | Update |
| --- | --- |
| `docs/00-getting-started-manual/specs/07-edit-delete.md` | admin request resolve 後の member notification outbox 契約を追加 |
| `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | `POST /admin/requests/:noteId/resolve` の best-effort notification enqueue 副作用を追加 |
| `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md` | `notification_outbox` / `notification_ledger` の実装仕様を追加 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | Issue #401 workflow を active entry として登録 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | Issue #401 quick access を追加 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | workflow inventory row を追加 |
| `.claude/skills/aiworkflow-requirements/SKILL.md` | 2026-05-06 changelog row を追加 |
| `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | 最新更新ヘッドラインを追加 |

## Review Feedback Sync

| Finding | Resolution |
| --- | --- |
| workflow state stayed `spec_created / not_started` after code implementation | artifacts / quick-reference / resource-map / task-workflow-active を `implemented-local / runtime pending` に補正 |
| missing mail config could drain pending rows into DLQ | scheduled notification dispatch now skips before claim when `MAIL_PROVIDER_KEY` is missing or `MAIL_FROM_ADDRESS` is placeholder |
| worker crash could strand `dispatching` rows | `claimNextBatch(..., staleDispatchingBeforeIso)` lease recovery を追加 |
| provider error body could leak recipient/from details | dispatcher stores only error class (`mail_provider_400`, `network_error`, etc.) |
| raw `resolutionNote` could become email `reasonSummary` | route no longer copies reject `resolutionNote` into `notification_outbox.reason_summary` |
| Phase 12 guide screenshot status missing | `NON_VISUAL` screenshot N/A を implementation guide に明記 |

## Step 2 判定

**判定: 発火**

理由:

- D1 table `notification_outbox` / `notification_ledger` を新規追加する実装仕様である。
- `POST /admin/requests/:noteId/resolve` の副作用として notification enqueue を追加する API contract change がある。
- mail env は既存 05b-A 正本 `MAIL_PROVIDER_KEY` / `MAIL_FROM_ADDRESS` を再利用し、新規 env 名は作らない。

## Runtime Boundary

本 Phase 12 は spec completeness の同期であり、staging D1 apply / Resend send / production migration / commit / push / PR は実行していない。Phase 11 と Phase 13 で user approval gate を通す。
