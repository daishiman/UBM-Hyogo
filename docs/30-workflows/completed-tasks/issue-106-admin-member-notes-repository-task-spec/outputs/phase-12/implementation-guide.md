# Implementation Guide

## Part 1: Junior Reader Guide

### What Changed

管理メモは、管理者だけが見るノートです。公開プロフィールや本人向けプロフィールには出してはいけません。

たとえば、学校の先生だけが見る連絡メモを、クラス全員に配るプリントへ混ぜてはいけないのと同じです。今回は、新しいメモ箱をもう一つ作らず、すでにある管理メモ用の箱が正しく使われているかをテストで確かめました。

### What The Tests Prove

| 確認したこと | 簡単な意味 |
| --- | --- |
| 指定した会員のメモだけ返す | 他の人のメモが混ざらない |
| メモがない人は空の一覧を返す | エラーではなく `[]` にする |
| 新しい順に並ぶ | 管理者が最近のメモから読める |
| 変更時に記録を残す | 誰が何をしたかを後から追える |
| audit と memo を混ぜない | 操作履歴と管理メモの役割を分ける |

## Part 2: Engineer Guide

### What Changed

`apps/api/src/repository/adminNotes.ts` was already the canonical repository for `admin_member_notes`, so no duplicate repository was created. The implementation work added regression coverage to `apps/api/src/repository/__tests__/adminNotes.test.ts`.

### Current Contract

| Item | Contract |
| --- | --- |
| Repository owner | `apps/api/src/repository/adminNotes.ts` |
| Read API | `listByMemberId(c, memberId)` |
| Storage table | `admin_member_notes` |
| Sort order | `created_at DESC` |
| Empty result | `[]` |
| Public/member exposure | forbidden |
| Audit source for admin detail | `audit_log`, not `admin_member_notes` |

### API / Function Signatures

```ts
listByMemberId(c: AppContext, memberId: string): Promise<AdminNote[]>
```

Admin note mutation routes remain under `apps/api/src/routes/admin/member-notes.ts`. They append `audit_log` records as a side effect of POST/PATCH. Admin member detail remains under `apps/api/src/routes/admin/members.ts` and sources its `audit` field from `audit_log`.

### Usage Example

```ts
const notes = await adminNotes.listByMemberId(c, memberId);
// notes are scoped to memberId and already ordered by created_at DESC.
```

Do not create `adminMemberNotes.ts` for the same table. If a consumer needs a different DTO, adapt at the consumer boundary and keep D1 ownership in `adminNotes.ts`.

### Error / Edge Cases

| Case | Expected behavior |
| --- | --- |
| Unknown member id | return `[]` |
| Other member has notes | do not return those rows |
| Same table used by self-service request queue | preserve `note_type` / `request_status` semantics |
| Admin detail audit requested | read `audit_log`; do not coerce admin notes into audit DTOs |
| Public/member profile serialization | omit `admin_member_notes` entirely |

The added tests lock the read path contract:

- `listByMemberId` returns only rows for the requested `member_id`.
- Unknown members return `[]`.
- Rows are ordered by `created_at DESC`.
- Admin note POST/PATCH routes append `audit_log`.
- Admin member detail `audit` is sourced from `audit_log` and does not mix in `admin_member_notes`.

The repository remains isolated from public/member view models. `admin_member_notes` rows are not public profile data, and admin note rows are not the same thing as `audit_log` DTOs.

### Configuration

No new environment variable, D1 table, migration, route, or UI setting was added. Existing D1 binding and admin route authorization remain in force.

### Verification

- `pnpm --filter ./apps/api typecheck`: PASS.
- `pnpm --filter ./apps/api lint`: PASS.
- `pnpm --filter ./apps/api test -- adminNotes`: PASS before final handoff additions, 81 files / 486 tests.
- Focused final rerun for changed tests: PASS, 3 files / 28 tests.
- `node scripts/lint-boundaries.mjs`: PASS.
- Node 24 confirmation rerun via `mise exec -- node -v`: v24.15.0.
- Node 24 focused rerun via `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/api/src/routes/admin/member-notes.test.ts apps/api/src/routes/admin/members.test.ts apps/api/src/repository/__tests__/adminNotes.test.ts`: PASS, 3 files / 28 tests.

## Phase 11 Evidence

See `outputs/phase-11/main.md`, `outputs/phase-11/test-output.txt`, and `outputs/phase-11/invariant-snapshot.txt`.
