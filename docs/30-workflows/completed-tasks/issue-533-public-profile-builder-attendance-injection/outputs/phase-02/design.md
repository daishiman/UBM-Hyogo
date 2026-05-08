# Phase 2 Design

## Design Summary

Public profile attendance injection follows the Issue #371 ctx provider pattern already used by `/me/profile` and admin member detail.

## Target Signature

```ts
export async function buildPublicMemberProfile(
  c: RepositoryProviderCtx,
  mid: MemberId,
  deps?: { attendancePage?: AttendancePageDeps },
): Promise<PublicMemberProfile | null>;
```

## Call Path

```text
GET /public/members/:memberId
  -> attendanceProviderMiddleware
  -> getPublicMemberProfileUseCase(memberId, { ctx: { ...ctx, var: { attendanceProvider } } })
  -> existsPublicMember(ctx, memberId)
  -> attendanceProvider.findByMemberId(memberId, { limit: ATTENDANCE_PAGE_DEFAULT_LIMIT })
  -> toPublicMemberProfile({ fields, schemaFields, attendance, attendanceMeta, tags })
  -> PublicMemberProfileZ
```

`buildPublicMemberProfile` is also updated for repository-level callers and tests. The public route use-case retains the existing `toPublicMemberProfile` path because that path already owns public schema-field visibility filtering and `UBM-1404` conversion. Dual source-of-truth risk is controlled by sharing the same `RepositoryProviderCtx`, `AttendanceRecord` / `attendanceMeta` shape, and public eligibility-before-attendance-read invariant.

## Changed Files

See `index.md` "変更対象ファイル".
