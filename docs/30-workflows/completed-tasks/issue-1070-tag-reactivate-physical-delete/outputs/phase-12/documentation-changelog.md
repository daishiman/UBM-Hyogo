# ドキュメント更新履歴 — tag master reactivate + physical delete

**[実装区分: implementation / NON_VISUAL / implemented_local_evidence_captured]**

## 更新サマリー

Issue #1070 の reactivate + physical delete を local 実装し、workflow spec、正本 API spec、aiworkflow-requirements ledger を same-wave sync した。

## 作成・更新ファイル

| パス | 種別 | 内容 |
|------|------|------|
| `apps/api/src/repository/tagDefinitions.ts` | 更新 | `reactivateTagDefinition` / `countMemberTagReferences` / `physicalDeleteTagDefinition` 追加 |
| `apps/api/src/routes/admin/tags.ts` | 更新 | `POST /tags/:tagId/reactivate` / `DELETE /tags/:tagId/physical`、`tag_has_references:409`、audit action 追加 |
| `apps/api/src/repository/__tests__/tagDefinitions.write.repository.spec.ts` | 更新 | reactivate / physical delete repository D1 cases 追加 |
| `apps/api/src/routes/admin/tags.contract.spec.ts` | 更新 | lifecycle route contract / audit / logical regression cases 追加 |
| `docs/00-getting-started-manual/specs/01-api-schema.md` | 更新 | 不変条件 #13、endpoint、冪等性、audit action を同期 |
| `docs/30-workflows/completed-tasks/issue-1070-tag-reactivate-physical-delete/**` | 作成・更新 | Phase 1-13 outputs、strict 7、runbook、artifacts を実装済み evidence へ同期 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | 更新 | issue-1070 active workflow entry 追加 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 更新 | issue-1070 quick reference 追加 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | 更新 | issue-1070 lookup row 追加 |
| `.claude/skills/aiworkflow-requirements/references/workflow-issue-1070-tag-reactivate-physical-delete-artifact-inventory.md` | 新規 | workflow artifact inventory |

## 検証履歴

| コマンド | 結果 |
|----------|------|
| `mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts apps/api/src/repository/__tests__/tagDefinitions.write.repository.spec.ts apps/api/src/routes/admin/tags.contract.spec.ts` | PASS: 2 files / 15 tests |
| `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` | PASS |
| `mise exec -- pnpm lint` | PASS |

## user-gated 残

staging runtime smoke、production tag physical delete mutation、commit、push、PR、Issue state change は未実行。Issue #1070 は CLOSED 維持。
