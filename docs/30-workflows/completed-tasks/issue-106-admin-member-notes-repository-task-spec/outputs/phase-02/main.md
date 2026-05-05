# Phase 2: Technical Design

## Module Map

| Module | Responsibility |
| --- | --- |
| `apps/api/src/repository/adminNotes.ts` | Canonical D1 repository for `admin_member_notes` |
| `apps/api/src/repository/_shared/db.ts` | D1 context wrapper |
| `apps/api/src/repository/_shared/brand.ts` | `MemberId` / `AdminEmail` branded types |
| `apps/api/src/repository/_shared/builder.ts` | Receives admin audit DTOs as arguments; does not fetch admin notes |
| `apps/api/src/routes/admin/member-notes.ts` | 04c consumer route for mutation and audit append |

## Dependency Matrix

| From | To | Allowed |
| --- | --- | --- |
| `adminNotes.ts` | `_shared/db`, `_shared/brand` | yes |
| `adminNotes.ts` | public/member view models | no |
| public/member routes | `adminNotes.ts` for read view output | no |
| admin route consumers | `adminNotes.ts` | yes |

## DB To TS Mapping

| DB Column | TS Field |
| --- | --- |
| `note_id` | `noteId` |
| `member_id` | `memberId` |
| `body` | `body` |
| `note_type` | `noteType` |
| `request_status` | `requestStatus` |
| `resolved_at` | `resolvedAt` |
| `resolved_by_admin_id` | `resolvedByAdminId` |
| `created_by` | `createdBy` |
| `updated_by` | `updatedBy` |
| `created_at` | `createdAt` |
| `updated_at` | `updatedAt` |

## Audit DTO Adapter Policy

`AdminMemberNoteRow` is a DB row shape. Builder audit DTOs remain separate and should be adapted in route/service code when needed. `audit_log` entries and `admin_member_notes` rows must not be treated as the same source.

## Completion

- D1 columns align with repository row mapping.
- `member_responses` and `response_fields` are outside repository write scope.
- 04c can consume `listByMemberId`, `create`, `update`, and request helpers through `adminNotes.ts`.
