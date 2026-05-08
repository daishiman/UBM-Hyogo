# Implementation Guide

## Part 1: 中学生レベルの説明

公開プロフィールは、会員を知らない人でも見られる名札のようなページです。名札を見る人は「この人はどんな活動をしているのか」を知りたいので、今回の変更では、その名札に「最近どの会に参加したか」を少しだけ載せるようにしました。

ただし、何でも見せるわけではありません。会員本人が公開を許可していて、公開状態で、削除されていない場合だけ表示します。メールアドレス、管理者メモ、本人だけが見る項目、管理者だけが見る項目は出しません。

### なぜ必要か

本人向けプロフィールと管理者向け画面では、すでに参加履歴を読む係があります。公開プロフィールだけ別の読み方を作ると、同じ情報なのに表示のルールがずれます。そこで、同じ係を公開プロフィールにもつなぎ、見せてよい人か確認してから参加履歴を読むようにしました。

### セルフチェック

| 用語 | 日常語での言い換え | 確認 |
| --- | --- | --- |
| `PublicMemberProfile` | 外から見える会員カード | `attendance` を含む |
| `AttendanceRecord` | 1回分の参加メモ | `sessionId`, `title`, `heldOn` のみ |
| `attendanceMeta` | 続きページのしおり | optional で `hasMore`, `nextCursor` のみ |
| `attendanceProviderMiddleware` | 参加履歴を取りに行く係を受付に置く仕組み | `/public/members/:memberId` に適用済み |
| public eligibility | 外に出してよいかの確認 | attendance read より前に実行 |
| privacy boundary | 見せてはいけないものの線引き | email / audit / adminNotes / member-only / admin-only を出さない |

## Part 2: 技術者向け実装ガイド

### Changed Files

| File | Change |
| --- | --- |
| `packages/shared/src/types/viewmodel/index.ts` | `AttendanceRecord`, `AttendanceMeta`, `PublicMemberProfile.attendance`, optional `attendanceMeta` を追加 |
| `packages/shared/src/zod/viewmodel.ts` | `AttendanceRecordZ` / `AttendanceMetaZ` を共有し、`PublicMemberProfileZ` に反映 |
| `apps/api/src/repository/_shared/builder.ts` | `buildPublicMemberProfile(c: RepositoryProviderCtx, mid, deps?)` に変更し、公開適格判定後に `fetchAttendancePagedFor` を呼ぶ |
| `apps/api/src/routes/public/member-profile.ts` | `attendanceProviderMiddleware` を `/members/:memberId` に適用し、`RepositoryProviderVariables` を route 型へ合成 |
| `apps/api/src/use-cases/public/get-public-member-profile.ts` | `RepositoryProviderCtx` を受け、公開適格判定後に `attendanceProvider.findByMemberId(..., { limit: ATTENDANCE_PAGE_DEFAULT_LIMIT })` を実行 |
| `apps/api/src/view-models/public/public-member-profile-view.ts` | converter 入力に `attendance` / optional `attendanceMeta` を要求し、shared zod で fail-close |

### API Contract

`GET /public/members/:memberId` は session/admin guard なしで公開 profile を返す。公開適格でない member は従来通り `UBM-1404` / 404。

```ts
interface PublicMemberProfile {
  memberId: MemberId;
  summary: MemberProfileSummary;
  publicSections: MemberProfileSection[];
  attendance: AttendanceRecord[];
  attendanceMeta?: { hasMore: boolean; nextCursor: string | null };
  tags: Array<{ code: string; label: string; category: string }>;
}
```

### API Usage Example

```http
GET /public/members/member_001
```

```json
{
  "memberId": "member_001",
  "summary": { "displayName": "Sample Member" },
  "publicSections": [],
  "attendance": [
    { "sessionId": "session_202605", "title": "2026年5月例会", "heldOn": "2026-05-01" }
  ],
  "attendanceMeta": { "hasMore": false, "nextCursor": null },
  "tags": []
}
```

### Function Signatures

```ts
function buildPublicMemberProfile(
  c: RepositoryProviderCtx,
  memberId: MemberId,
  deps?: { attendancePage?: AttendancePageRequest },
): Promise<PublicMemberProfile>;

function getPublicMemberProfile(
  c: RepositoryProviderCtx,
  memberId: MemberId,
): Promise<PublicMemberProfile>;
```

### Settings And Constants

| Name | Value / Source | Purpose |
| --- | --- | --- |
| `ATTENDANCE_PAGE_DEFAULT_LIMIT` | existing attendance pagination constant | public detail returns the first attendance page only |
| `attendanceMeta` | optional response field | preserves existing `attendance: AttendanceRecord[]` contract while exposing pagination metadata |
| `meeting_sessions.deleted_at IS NULL` | attendance provider SQL boundary | excludes soft-deleted meetings |

### Error And Privacy Rules

| Rule | Behavior |
| --- | --- |
| provider missing | throw `attendanceProvider not bound to context` |
| non-public member | return 404 before attendance read |
| deleted member | return 404 before attendance read |
| soft-deleted meeting | excluded by `meeting_sessions.deleted_at IS NULL` in attendance provider SQL |
| missing response | return 404 |
| forbidden public fields | `responseEmail`, `audit`, `adminNotes`, member-only/admin-only fields are excluded |

### Verification

| Gate | Result |
| --- | --- |
| focused tests | PASS, 5 files / 66 tests |
| shared zod test | PASS, 15 files / 170 tests |
| api typecheck | PASS |
| root typecheck / lint / build | PASS |
| scoped grep gate | PASS |

Build note: local `.env` + 1Password `op run` timed out once; `ENV_FILE=/dev/null pnpm build` passed and is recorded in Phase 11 evidence.
