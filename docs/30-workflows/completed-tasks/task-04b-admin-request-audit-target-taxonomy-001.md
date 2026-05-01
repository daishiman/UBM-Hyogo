# task-04b-admin-request-audit-target-taxonomy-001

## Metadata

| Field | Value |
| --- | --- |
| Task ID | task-04b-admin-request-audit-target-taxonomy-001 |
| Source | 04b-followup-004 Phase 12 / skill feedback |
| Status | unassigned |
| Priority | medium |
| Type | audit model hardening |

## Goal

Add a first-class audit target type for admin request / admin member note resolution.

## Current Gap

04b-followup-004 records request resolution audit rows as `targetType='member'` with `after.noteId`. This preserves traceability but makes `/admin/audit` filtering less precise.

## Scope

- Decide canonical target type: `admin_member_note` or `admin_request`
- Update audit schema/type validation if needed
- Update `/admin/audit` filters and UI labels
- Backward compatibility for existing `targetType='member'` request-resolution rows

## Acceptance Criteria

- Admin request resolution can be filtered independently from general member changes.
- Existing audit rows remain readable.
- API and UI documentation are updated.

## Risk And Mitigation

| Risk | Mitigation |
| --- | --- |
| Existing audit filters break | Keep `member` fallback and add migration-safe labels |
| Target taxonomy grows inconsistently | Document naming rule before implementation |

## 苦戦箇所 / Lessons Learned

- **L-04B-RQ-005 由来**: `AuditTargetType` Zod enum に `admin_member_note` / `admin_request` が無く、04b-followup-004 では暫定的に `targetType='member'` + `after.noteId` で逃がした。短期的にはトレーサビリティを保てるが、`/admin/audit` のフィルタ精度が member 全般に紛れて落ちる。
- **判断分岐**: target taxonomy を増やすか、`subType` のような副軸を追加するかでスキーマ互換性が変わる。本タスクでは canonical 命名（`admin_member_note` 推奨）を先に決めてから schema 拡張する。
- **後方互換の注意**: 既存 audit rows の `targetType='member'` を再分類すると downstream の filter/UI が壊れるため、既存行は維持しつつ新規行のみ first-class type を使う migration-safe アプローチを採る。
