# workflow-issue-1117-tag-physical-delete-force-migration-artifact-inventory

## Summary

| 項目 | 値 |
| --- | --- |
| workflow | `issue-1117-tag-physical-delete-force-migration` |
| status | `implemented_local_evidence_captured / implementation / NON_VISUAL` |
| root | `docs/30-workflows/completed-tasks/issue-1117-tag-physical-delete-force-migration/` |
| issue | #1117 CLOSED 維持。PR 文脈は `Refs #1117` のみ |
| parent | `docs/30-workflows/completed-tasks/issue-1070-tag-reactivate-physical-delete/` |
| purpose | `member_tags` 参照あり tag を active destination tag へ強制移行してから物理削除する |

## Implementation

| パス | 内容 |
| --- | --- |
| `apps/api/src/repository/tagDefinitions.ts` | `migrateMemberTagReferences` / `forceMigrateAndPhysicalDeleteTagDefinition`。`INSERT OR IGNORE ... SELECT` + source delete で `(member_id,dest)` PK 衝突を吸収し、source 参照 0 件を再検証してから既存 physical delete を呼ぶ |
| `apps/api/src/routes/admin/tags.ts` | `DELETE /admin/tags/:tagId/physical?migrateTo=<destTagId>`。未指定時は issue-1070 の 409 `tag_has_references` 拒否経路を維持。成功時は `admin.tag.references_migrated` + `admin.tag.physically_deleted` audit を append |
| `docs/00-getting-started-manual/specs/01-api-schema.md` | 不変条件 #13、endpoint query、error code、冪等性、audit action 同期 |

## Evidence

| 検証 | 結果 |
| --- | --- |
| focused D1 Vitest | PASS: `tagDefinitions.write.repository.spec.ts` + `tags.contract.spec.ts`、2 files / 25 tests |
| API typecheck | PASS: `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` |
| repo lint | PASS: `mise exec -- pnpm lint` |
| Phase 12 strict 7 | present |
| root/output artifacts parity | state / gates / phases synced; outputs ledger may carry additional generated fields |

## User-Gated

staging runtime smoke、production tag force-migration / physical delete mutation、commit、push、PR、Issue state change。

## Lessons Learned

- L-I1117-001: `implementation` task で target code が明確な場合、local code / focused tests /正本 spec sync は同一 wave 対象。user-gated にできるのは staging runtime、production mutation、commit / push / PR、Issue mutation。
- L-I1117-002: `member_tags` が FK を持たない場合の force-migration は `INSERT OR IGNORE ... SELECT` + source delete + source count 0 再検証を application-level guard として扱う。固定 DDL migration では runtime-chosen destination tag を表現しない。
- L-I1117-003: 通常 physical delete と force-migration を同 endpoint の query 分岐で分ける場合、`migrateTo` 未指定の 409 `tag_has_references` regression test を必須証跡にする。
