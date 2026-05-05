# Implementation Guide — 06b-b-profile-request-pending-banner-sticky-001

## Part 1: 中学生レベル

申請したあとに画面を更新しても「受け付け中です」という表示が残るようにする。たとえば学校で欠席届を出したあと、先生が確認するまで職員室の箱に紙が残っている状態に似ている。紙が残っていれば、もう一度同じ紙を出さなくてよいと分かる。

なぜ必要か。今の画面では、申請した直後は表示が出るが、ページを開き直すと消える場合がある。ユーザーは「届いていないかも」と思い、同じ申請をもう一度送るかもしれない。

何をするか。画面だけで覚えるのではなく、サーバー側にある「処理待ち」の記録を毎回読み直す。処理待ちがあれば、マイページにお知らせを出し、同じ申請ボタンを押せないようにする。

| 専門用語 | 日常語での言い換え |
| --- | --- |
| pending | 先生の確認待ち |
| reload | ページを開き直すこと |
| server | 記録を保管している場所 |
| API | 画面が記録を取りに行く窓口 |
| 409 | 同じ申請がもうあるという合図 |

## Part 2: 技術詳細

| 項目 | 内容 |
| --- | --- |
| Summary | `GET /me/profile` に `pendingRequests` を追加し、`/profile` Server Component から `RequestActionPanel` に渡す |
| API storage | `admin_member_notes` の `note_type IN ('visibility_request','delete_request')` かつ `request_status='pending'` を読む |
| API function | `getPendingRequestsForMember(ctx: DbCtx, memberId: MemberId): Promise<PendingRequests>` |
| web mirror | `apps/web/src/lib/api/me-types.ts` に `PendingRequests` と `MeProfileResponse.pendingRequests` を追加 |
| error code | wire code は既存 `DUPLICATE_PENDING_REQUEST` を再利用し、新 code は追加しない |
| UI behavior | server pending を最優先し、local state は submit-in-flight のみ |
| visual evidence | Phase 11 screenshots / trace は authenticated runtime capture cycle で取得。現状は `blocked_runtime_evidence` |

```ts
export interface PendingRequests {
  readonly visibility?: {
    readonly queueId: string;
    readonly status: "pending";
    readonly createdAt: string;
    readonly desiredState: "hidden" | "public";
  };
  readonly delete?: {
    readonly queueId: string;
    readonly status: "pending";
    readonly createdAt: string;
  };
}
```

## AC to Runtime Path

| AC | Runtime path | Evidence |
| --- | --- | --- |
| AC-1 reload 後 banner 表示 | `/profile` -> `/api/me/profile` -> API `GET /me/profile` -> `admin_member_notes` | Playwright reload screenshot |
| AC-2 duplicate buttons disabled | `RequestActionPanel.pendingRequests` | unit + screenshot, native `disabled` attribute |
| AC-3 stale 409 visible | POST existing route returns `DUPLICATE_PENDING_REQUEST` | integration + E2E stale UI |
| AC-4 `/me/*` boundary | BFF `[...path]` passthrough | grep gate |
| AC-5 profile body edit UI 不追加 | profile component grep | grep gate |
| AC-6 apps/web D1 direct access 禁止 | web imports / SQL grep | grep gate |
| AC-7 reload persistence tests | API unit, route integration, web unit, Playwright | test report |

## Current Local Implementation Evidence

| Layer | Files | Evidence |
| --- | --- | --- |
| API schema/route/service | `apps/api/src/routes/me/{schemas,index,services}.ts` | `pendingRequests` schema, `getPendingRequestsForMember`, and `GET /me/profile` response field implemented |
| API tests | `apps/api/src/routes/me/index.test.ts` | no pending, visibility pending after reload, delete pending after reload, and duplicate 409 cases covered |
| Web SSR/UI | `apps/web/app/profile/page.tsx`, `apps/web/app/profile/_components/RequestActionPanel.tsx` | Server Component passes `profileRes.pendingRequests`; panel prioritizes server pending over optimistic local state |
| Web tests/types | `RequestActionPanel.test.tsx`, `apps/web/src/lib/api/me-types.test-d.ts` | banner + disabled state and web mirror type coverage added |

Runtime screenshots are intentionally separated from local implementation evidence. They require an authenticated profile session and seeded pending queue state, so Phase 11 remains blocked until that capture cycle runs.
