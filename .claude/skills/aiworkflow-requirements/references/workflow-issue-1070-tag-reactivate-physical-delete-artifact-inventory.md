# workflow-issue-1070-tag-reactivate-physical-delete-artifact-inventory

## Summary

| 項目 | 値 |
| --- | --- |
| workflow | `issue-1070-tag-reactivate-physical-delete` |
| status | `implemented_local_evidence_captured / implementation / NON_VISUAL` |
| root | `docs/30-workflows/completed-tasks/issue-1070-tag-reactivate-physical-delete/` |
| issue | #1070 CLOSED 維持。PR 文脈は `Refs #1070` のみ |
| parent | `docs/30-workflows/completed-tasks/issue-1035-tag-master-write-endpoints/` |
| purpose | tag master (`tag_definitions`) に reactivate と参照ガード付き physical delete を追加する |

## Implementation

| パス | 内容 |
| --- | --- |
| `apps/api/src/repository/tagDefinitions.ts` | `reactivateTagDefinition` / `countMemberTagReferences` / `physicalDeleteTagDefinition` |
| `apps/api/src/routes/admin/tags.ts` | `POST /admin/tags/:tagId/reactivate` / `DELETE /admin/tags/:tagId/physical` |
| `docs/00-getting-started-manual/specs/01-api-schema.md` | 不変条件 #13、endpoint、冪等性、audit action 同期 |

## Evidence

| 検証 | 結果 |
| --- | --- |
| focused D1 Vitest | PASS: `tagDefinitions.write.repository.spec.ts` + `tags.contract.spec.ts`、2 files / 15 tests |
| API typecheck | PASS: `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` |
| repo lint | PASS: `mise exec -- pnpm lint` |
| Phase 12 strict 7 | present |
| root/output artifacts parity | present |

## User-Gated

staging runtime smoke、production tag physical delete mutation、commit、push、PR、Issue state change。

## Lessons Learned

非自明な知見は [[lessons-learned-issue-1070-tag-reactivate-physical-delete-2026-06]]（L-I1070-001..006）に記録。

- L-I1070-001: DB-FK 不在の `member_tags` 参照は application-level `COUNT(*)` ガードが唯一の防壁（`> 0` は 409 `tag_has_references`）。
- L-I1070-002: 不可逆 physical delete は endpoint 実装 / production mutation を 2-stage 分離（user-gated は production mutation のみ）。
- L-I1070-003: reactivate は deactivate の対称形（active flip / UNIQUE code 非接触 / no-op で audit 不発火）。
- L-I1070-004: prefix 共有 route は静的セグメント優先解決を既存 logical DELETE regression で固定（SP-I1035-D 同型）。
- L-I1070-005: physical delete の audit before は repository が返す削除前 snapshot を使う。
- L-I1070-006: lessons は `references/` 直下に置く（`generate-index.js` は `lessons-learned/` サブdir を scan しない）。
