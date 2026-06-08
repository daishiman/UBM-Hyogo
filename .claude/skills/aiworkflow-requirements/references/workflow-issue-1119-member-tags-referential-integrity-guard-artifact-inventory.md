# workflow-issue-1119-member-tags-referential-integrity-guard-artifact-inventory

## Summary

| 項目 | 値 |
| --- | --- |
| workflow | `issue-1119-member-tags-referential-integrity-guard` |
| status | `implemented_local / implementation / NON_VISUAL / implementation_mode=new` |
| root | `docs/30-workflows/completed-tasks/issue-1119-member-tags-referential-integrity-guard/` |
| issue | #1119 CLOSED 維持。reopen / mutation は行わない |
| parent | `docs/30-workflows/completed-tasks/issue-1070-tag-reactivate-physical-delete/` |
| source unassigned | `docs/30-workflows/completed-tasks/unassigned-task/task-issue-1070-followup-003-member-tags-foreign-key-evaluation.md` |
| purpose | `member_tags.tag_id` の orphan を documented no-FK 架構に沿って application 層で検出・監査できるようにし、`assignTagsToMember` helper 誤用時にも未定義 tag_id を書かない |

## Implementation

| パス | 内容 |
| --- | --- |
| `apps/api/src/repository/memberTags.ts` | `OrphanMemberTag` / `detectOrphanMemberTags` / `countOrphanMemberTags` を追加。`assignTagsToMember` に active tag master set による未定義 tag_id skip を追加 |
| `apps/api/src/routes/admin/tags.ts` | `GET /admin/tags/orphans` read-only endpoint を追加（`:tagId` 系より前に登録） |
| `apps/api/src/repository/__tests__/memberTags.orphan.repository.spec.ts` | orphan detection repository spec |
| `apps/api/src/routes/admin/tags.contract.spec.ts` | orphans endpoint contract spec |
| `apps/api/src/routes/admin/members.contract.spec.ts` | fixture 健全性確認のみ。`tag_a` / `tag_b` は既に `tag_definitions` 定義済み |

## Evidence

| 検証 | 結果 |
| --- | --- |
| Phase 1-13 specs | present |
| root/output artifacts parity | present |
| Phase 12 strict 7 | present |
| implementation / focused tests | implemented_local / local verification target |
| api-endpoints SSOT registration | endpoint 実装済み。`references/api-endpoints.md` へ詳細登録済み |

## Invariants

- DB-level FOREIGN KEY / migration は追加しない（ADR-1119）。
- documented no-FK 架構（`apps/api/migrations/0022_member_photos.sql:4`）を維持する。
- `apps/web` / UI / Google Form / D1 schema は非接触。
- issue-1070 の `countMemberTagReferences` + 409 `tag_has_references` guard は撤去せず、orphan detection と責務分離して共存する。

## User-Gated

実 D1 orphan query、staging / production deploy、commit、push、PR。

## Lessons Learned

- L-I1119-001: 実測済み fixture が健全な場合、仕様書では「fixture 健全性確認」に統一する。no-op を修正扱いすると Phase 5 / Phase 10 / Phase 12 の evidence 期待が矛盾する。
- L-I1119-002: workflow root の discoverability と endpoint SSOT は実コード state に合わせて同期する。`spec_created` と implemented contract を混同しない。
