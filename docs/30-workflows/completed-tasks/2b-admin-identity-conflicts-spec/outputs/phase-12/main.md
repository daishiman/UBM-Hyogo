# Phase 12 Main — 2b admin identity conflicts spec

## Summary

`docs/30-workflows/2b-admin-identity-conflicts-spec/` の後続実装 wave で、Playwright E2E spec と server-side fixture 経路を生成。ローカル PASS 5 点（typecheck / lint / e2e（chromium）/ build / grep gate）取得済み。

## 実装成果物（実コード変更）

| 区分 | path | 概要 |
| --- | --- | --- |
| 新規 | `apps/web/playwright/tests/admin-identity-conflicts.spec.ts` | 208 行 / 6 test / 0 skip |
| 追記 | `apps/web/src/lib/admin/server-fetch.ts` | identity-conflicts 用 inline fixture（`PLAYWRIGHT_ADMIN_IDENTITY_CONFLICTS_FIXTURE=1` gate） |
| 追記 | `apps/web/playwright.config.ts` | `isAdminIdentityConflictsRun` 判定 + webServer env 切替 |

## State

| Item | Value |
| --- | --- |
| workflow_state | `runtime_pending`（`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`） |
| taskType | `implementation` |
| visualEvidence | `NON_VISUAL` |
| Phase 11 | `runtime_pending`（chromium 6 PASS、firefox / webkit / staging は CI runtime 待ち） |
| Phase 12 | `completed`（strict 7 outputs 作成済み + 実装反映済み） |
| Phase 13 | `pending_user_approval` |

## Boundary

- 既存 API endpoint surface のみ利用（GET list / POST merge / POST dismiss、新 endpoint なし）。
- 既存 shared schema（`MergeIdentityRequestZ` / `DismissIdentityConflictRequestZ`）と既存 `auth.ts` fixture のみ。
- 初期一覧 GET は Server Component fetch のため browser `page.route()` 不可。`server-fetch.ts` の inline fixture（既存 2a パターン踏襲）で供給。
- commit / push / PR はユーザー承認後のみ実行する。
