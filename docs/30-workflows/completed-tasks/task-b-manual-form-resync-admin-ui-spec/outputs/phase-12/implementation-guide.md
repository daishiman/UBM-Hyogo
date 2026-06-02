# Implementation Guide

## Part 1: 中学生にもわかる説明

Google Form の回答は、郵便受けに届いた手紙のようなものです。たとえば、届いた手紙を名簿に写す係が止まっていたり、古い手紙をもう一度確認したい時、管理者が画面から「新しい分だけ取り込む」「全部もう一度取り込む」を選べる必要があります。

この Task B は、その管理用の窓口を `/admin/sync-status` に追加した実装の正本です。普通の操作は差分 sync、強い操作は全件 backfill と分け、全件操作では確認を挟みます。

## Part 2: 技術者向け

### Current Implementation

| Area | Current fact |
|---|---|
| Panel | `apps/web/src/features/admin/components/_sync/ManualFormResyncPanel.client.tsx` |
| Contract | `apps/web/src/features/admin/diagnostics/manual-sync.ts` |
| Mount | `apps/web/app/(admin)/admin/sync-status/page.tsx` |
| Proxy | `apps/web/app/api/admin/[...path]/route.ts` |
| Env | `apps/web/src/lib/env.ts` `SYNC_ADMIN_TOKEN` optional accessor |

### Contract

`SYNC_RESPONSES_PATH` is `/api/admin/sync/responses`. Differential sync uses `?fullSync=false`; full backfill uses `?fullSync=true`. `SyncResultSchema` accepts `status`, `jobId`, `processedCount`, `writeCount`, `cursor`, and optional `skippedReason`. `SyncRunResponseSchema` accepts the 200 shape `{ ok: true, result }` and the 409 shape `{ ok: false, result }` only when `result.status === "skipped"`.

### Auth Boundary

Browser code does not receive `SYNC_ADMIN_TOKEN`. The Next admin proxy injects the token server-side for sync paths and returns `500 sync_admin_token_missing` when the token is absent.

### UI Behavior

`runSync` and `runBackfill` use separate `useAdminMutation` instances with `timeoutMs: 60000` and `refreshOnSuccess: false`. `busy` disables both buttons while either mutation is loading. `parseInProgress` maps HTTP 409 + `result.status === "skipped"` into a status message instead of a success result table. Schema mismatch sets `parseError` and suppresses the result table. `onSynced?` is called only with a parsed `SyncResult`.

### Configurable Parameters

| Parameter | Current fact |
|---|---|
| `SYNC_ADMIN_TOKEN` | Optional env read via `getAuthEnv()` and injected server-side by the admin proxy |
| `timeoutMs` | `60000` for both differential sync and full backfill |
| `onSynced?` | Optional callback fired after a valid response parse |

## 視覚証跡

This is a `VISUAL_ON_EXECUTION` task. Runtime screenshots are pending because admin authentication and `SYNC_ADMIN_TOKEN` provisioning are user-gated. Local proof is focused Vitest plus typecheck under `outputs/phase-11/evidence/`.

Static UI contract PNGs were captured under `outputs/phase-11/` to prevent a zero-image visual close-out, but they are not authenticated runtime evidence:

| Screenshot | Boundary |
|---|---|
| `manual-form-resync-panel-idle.png` | static UI contract |
| `manual-form-resync-panel-result.png` | static UI contract |
| `manual-form-resync-panel-confirm.png` | static UI contract |
| `manual-form-resync-panel-inprogress.png` | static UI contract |

Authenticated runtime capture remains `runtime_visual_pending_user_gate`.
