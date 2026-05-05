# 06b-B Profile Self-Service Request UI Artifact Inventory

## Metadata

| Item | Value |
| --- | --- |
| Task ID | 06b-B-profile-self-service-request-ui |
| Workflow | `docs/30-workflows/completed-tasks/06b-B-profile-self-service-request-ui/` |
| Status | implemented-local / implementation / runtime-evidence-blocked / VISUAL_ON_EXECUTION |
| Sync date | 2026-05-02 |
| Phase 13 | pending_user_approval |

## Current Facts

| Area | Artifact |
| --- | --- |
| Profile page | `apps/web/app/profile/page.tsx` |
| Action panel | `apps/web/app/profile/_components/RequestActionPanel.tsx` |
| Visibility dialog | `apps/web/app/profile/_components/VisibilityRequestDialog.tsx` |
| Delete dialog | `apps/web/app/profile/_components/DeleteRequestDialog.tsx` |
| Pending banner | `apps/web/app/profile/_components/RequestPendingBanner.tsx` |
| Error message | `apps/web/app/profile/_components/RequestErrorMessage.tsx` |
| Same-origin proxy | `apps/web/app/api/me/visibility-request/route.ts`, `apps/web/app/api/me/delete-request/route.ts` |
| Client helper | `apps/web/src/lib/api/me-requests.ts` |
| Client types | `apps/web/src/lib/api/me-requests.types.ts` |
| Focused tests | `apps/web/app/profile/_components/{RequestActionPanel,VisibilityRequestDialog,DeleteRequestDialog,RequestErrorMessage,RequestPendingBanner}.test.tsx`, `apps/web/src/lib/api/me-requests.test.ts` |
| Static invariant | `apps/web/src/__tests__/static-invariants.test.ts` (S-04b: Request*.tsx に responseId / 本文 field 名禁止) |
| Playwright E2E | `apps/web/playwright/tests/profile-visibility-request.spec.ts`, `apps/web/playwright/tests/profile-delete-request.spec.ts`（`describe.skip`、Phase 11 smoke 時に unskip） |

## Contract

- 入口 URL は `/api/me/visibility-request` / `/api/me/delete-request` に固定。`memberId` を URL / body に含めない（CLAUDE.md 不変条件 #11 self-service 境界）。
- `apps/web` の同一 origin route は cookie / Authorization header を `apps/api` `/me/*` へ proxy するだけ。D1 直接アクセスは禁止（不変条件 #5）。
- reason は client / server 双方で `<= 500` chars (`REASON_MAX_LENGTH`)。client 側は `validateReason()` と dialog UI で二重チェック。
- `VisibilityRequestInput.desiredState` は `"hidden" | "public"` の固定 enum。dialog 初期化時に親から渡し、form field では受けない。
- `DeleteRequestInput` には不可逆同意 `confirmed: true` checkbox を必須化（client UX）。
- 申請成功は `202 { queueId, type, status: "pending", createdAt }`。`409 DUPLICATE_PENDING_REQUEST` は同一 session pending と該当ボタン disabled / pending banner 切替に接続。`401 UNAUTHORIZED` は呼び出し側で `AuthRequiredError` を throw。`422 INVALID_REQUEST` / `429 RATE_LIMITED` / `5xx SERVER` / network failure は RequestErrorCode に正規化して `role=alert` 表示、network / 5xx は再試行 CTA。
- Dialog a11y: `role=dialog` / `aria-modal=true` / `aria-labelledby` / `aria-describedby` / Esc close（pending 中は無効）/ Tab focus trap。
- Pending banner: `role=status` / `aria-live=polite`。
- Phase 11 logged-in screenshot と unskipped E2E は runtime capture 待ち。06b-C / 08b / 09a が visual evidence を消費する。
- Pending banner sticky 化は `docs/30-workflows/unassigned-task/task-06b-b-profile-request-pending-banner-sticky-001.md` に分離済み。

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

- `indexes/quick-reference.md`（§UBM-Hyogo Member Login / Profile Pages 早見 06b の 06b-B follow-up 行）
- `indexes/resource-map.md`（06b-B 行）
- `references/api-endpoints.md`（§UBM-Hyogo Member Self-Service API 04b、`/me/visibility-request` / `/me/delete-request`）
- `references/database-admin-repository-boundary.md`（§04b member self-service queue）
- `references/task-workflow-active.md`（§06b-B-profile-self-service-request-ui 行）
- `references/lessons-learned-06b-b-profile-self-service-request-ui-2026-05.md`
- `references/legacy-ordinal-family-register.md`（旧 `02-application-implementation/06b-B...` → current completed root mapping）
- `docs/00-getting-started-manual/specs/05-pages.md`（`/profile` 本人申請パネル）
- `docs/00-getting-started-manual/specs/07-edit-delete.md`（公開停止 / 退会申請の admin queue 経路）
- `docs/00-getting-started-manual/specs/09-ui-ux.md`（dialog a11y / role=alert / 409 / 再試行 CTA）
- `docs/30-workflows/unassigned-task/task-06b-b-profile-request-pending-banner-sticky-001.md`
