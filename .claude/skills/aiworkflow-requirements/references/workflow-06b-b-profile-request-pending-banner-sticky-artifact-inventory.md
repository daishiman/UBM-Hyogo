# 06b-B Profile Pending Banner Sticky Follow-up Artifact Inventory

## Metadata

| Item | Value |
| --- | --- |
| Task ID | 06b-b-profile-request-pending-banner-sticky-001 |
| Workflow | `docs/30-workflows/06b-b-profile-request-pending-banner-sticky/` |
| Formalized from | `docs/30-workflows/unassigned-task/task-06b-b-profile-request-pending-banner-sticky-001.md` |
| Status | implemented-local / implementation / VISUAL_ON_EXECUTION / Phase 11 blocked_runtime_evidence |
| Sync date | 2026-05-04 |
| Phase 13 | pending_user_approval |
| Parent workflow | `docs/30-workflows/completed-tasks/06b-B-profile-self-service-request-ui/`（06b-B 本体。sticky 化はここから分離） |

## Current Facts

| Layer | Artifact |
| --- | --- |
| API schema | `apps/api/src/routes/me/schemas.ts`（`PendingRequests` schema、`MeProfileResponse.pendingRequests` 追加） |
| API service | `apps/api/src/routes/me/services.ts`（`getPendingRequestsForMember(ctx, memberId)` を追加し `GET /me/profile` に組み込み） |
| API route | `apps/api/src/routes/me/index.ts`（`GET /me/profile` レスポンスに `pendingRequests` を含める） |
| Repository | `apps/api/src/repository/adminNotes.ts`（`note_type IN ('visibility_request','delete_request')` かつ `request_status='pending'` の pending-only read predicate） |
| API tests | `apps/api/src/routes/me/index.test.ts`（no pending / visibility pending after reload / delete pending after reload / duplicate 409 の 4 ケース） |
| Web mirror types | `apps/web/src/lib/api/me-types.ts`（`PendingRequests` / `MeProfileResponse.pendingRequests` mirror、API contract と shape 一致） |
| Web SSR | `apps/web/app/profile/page.tsx`（Server Component で `profileRes.pendingRequests` を `RequestActionPanel` に props 渡し） |
| Web UI | `apps/web/app/profile/_components/RequestActionPanel.tsx`（server pending を最優先、local state は submit-in-flight のみ、`RequestPendingBanner` 表示・申請ボタン disabled） |
| Web type tests | `apps/web/src/lib/api/me-types.test-d.ts`（mirror 型の shape 一致テスト） |
| Web unit tests | `apps/web/app/profile/_components/RequestActionPanel.test.tsx`（banner + disabled state coverage） |
| Playwright E2E | `apps/web/playwright/tests/profile-pending-sticky.spec.ts`（reload 後 sticky 表示の E2E。staging smoke / authenticated capture 待ち） |

## Contract

- `GET /me/profile` レスポンスに `pendingRequests: PendingRequests` を必須フィールドとして追加。`pendingRequests` 自体は常に返し、サブフィールド `visibility?` / `delete?` のみ optional。
- `PendingRequests.visibility?`: `{ queueId: string, status: 'pending', createdAt: string, desiredState: 'hidden' | 'public' }`。
- `PendingRequests.delete?`: `{ queueId: string, status: 'pending', createdAt: string }`。
- pending state の正本は `admin_member_notes.request_status='pending'` 行（`note_type IN ('visibility_request','delete_request')`）。`getPendingRequestsForMember` は同 predicate で読む。
- POST `/me/visibility-request` / `/me/delete-request` の duplicate 検出も同じ pending-only predicate を使い、wire error code は既存 `DUPLICATE_PENDING_REQUEST` を再利用する（新 code 追加禁止）。
- web mirror（`apps/web/src/lib/api/me-types.ts`）は API schema と shape が一致する optional フィールド構造でなければならない。API schema 変更時は同一 wave で mirror を更新する。
- UI 優先順位: server pending > local submit-in-flight。reload 後も server pending が真であれば banner は sticky に残る。
- `RequestPendingBanner`: `role=status` / `aria-live=polite`。申請ボタンは `disabled` 属性で重複申請を防止し、tooltip / aria-describedby で「受け付け中です」と説明する。
- 不変条件: 新 endpoint 追加禁止、memberId は path / body に出さない（不変条件 #11）、`apps/web` から D1 直接アクセス禁止（不変条件 #5）、`/profile` 本文編集 UI 追加禁止（不変条件 #4）。

## AC to Runtime Path

| AC | Runtime path | Evidence kind |
| --- | --- | --- |
| AC-1 reload 後 banner 表示 | `/profile` (Server Component) → `/api/me/profile` proxy → `GET /me/profile` → `admin_member_notes` pending rows | Playwright sticky reload screenshot（authenticated capture pending） |
| AC-2 重複申請ボタン disabled | `RequestActionPanel` が `pendingRequests` から `disabled` を計算 | unit + screenshot、native `disabled` 属性 |
| AC-3 stale 409 visible | POST 既存 route が `DUPLICATE_PENDING_REQUEST` を返し UI が pending banner に reflect | integration + E2E stale UI |
| AC-4 `/me/*` 境界 | BFF `[...path]` passthrough のみ、memberId は backend session 解決 | grep gate |
| AC-5 `/profile` 本文編集 UI 不在 | profile component grep | grep gate |
| AC-6 `apps/web` D1 直接アクセス禁止 | web imports / SQL grep | grep gate |
| AC-7 reload persistence tests | API unit / route integration / web unit / Playwright | test report |

## Phase 12 Required Files

| File | Status |
| --- | --- |
| `outputs/phase-12/main.md` | present |
| `outputs/phase-12/implementation-guide.md` | present |
| `outputs/phase-12/system-spec-update-summary.md` | present |
| `outputs/phase-12/documentation-changelog.md` | present |
| `outputs/phase-12/unassigned-task-detection.md` | present |
| `outputs/phase-12/skill-feedback-report.md` | present |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | present |

## Related Resources

- `indexes/quick-reference.md`（§UBM-Hyogo Member Login / Profile Pages 早見 06b の sticky follow-up 行）
- `indexes/resource-map.md`（06b-B pending banner sticky 行）
- `indexes/topic-map.md`（§06b-b-profile-request-pending-banner-sticky 行）
- `references/api-endpoints.md`（§UBM-Hyogo Member Self-Service API 04b、`GET /me/profile.pendingRequests`）
- `references/database-admin-repository-boundary.md`（§04b member self-service queue / pending-only read predicate）
- `references/task-workflow-active.md`（§06b-b-profile-request-pending-banner-sticky 行）
- `references/workflow-06b-b-profile-self-service-request-ui-artifact-inventory.md`（親 06b-B、本 follow-up を分離）
- `references/lessons-learned-06b-b-profile-request-pending-banner-sticky-2026-05.md`
- `references/legacy-ordinal-family-register.md`（unassigned → workflow root mapping）
- `docs/00-getting-started-manual/specs/05-pages.md`（`/profile` reload-sticky pending banner）
- `docs/00-getting-started-manual/specs/07-edit-delete.md`（`GET /me/profile.pendingRequests` の admin queue read model）
- `docs/00-getting-started-manual/specs/09-ui-ux.md`（reload-sticky `RequestPendingBanner` / disabled-button UX）
- `LOGS/20260504-06b-b-profile-request-pending-banner-sticky-sync.md`
