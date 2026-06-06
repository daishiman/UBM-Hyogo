# Workflow Artifact Inventory: issue-1078 Bulk Tag Picker Large Catalog UX

`issue-1078-bulk-tag-picker-large-catalog-ux` is an `implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION` workflow. Local apps/web implementation and deterministic evidence are complete; staging authenticated visual baseline, commit, push, PR, and GitHub issue mutation remain user-gated.

## Workflow Root

| Artifact | Path |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-1078-bulk-tag-picker-large-catalog-ux/` |
| root artifacts | `docs/30-workflows/completed-tasks/issue-1078-bulk-tag-picker-large-catalog-ux/artifacts.json` |
| output artifacts | `docs/30-workflows/completed-tasks/issue-1078-bulk-tag-picker-large-catalog-ux/outputs/artifacts.json` |
| Phase 12 compliance | `docs/30-workflows/completed-tasks/issue-1078-bulk-tag-picker-large-catalog-ux/outputs/phase-12/phase12-task-spec-compliance-check.md` |

## Implementation Artifacts

| Area | Path | Role |
| --- | --- | --- |
| web API client | `apps/web/src/features/admin/api/members.ts` | `GET /admin/tags` `{ total, items }` response normalization, `fetchTagMaster(opts)`, `fetchAllTagMaster(cap)` |
| API client tests | `apps/web/src/features/admin/api/__tests__/members.spec.ts` | query/default/normalization/error/pagination/cap contract tests |
| BulkActionBar UI | `apps/web/src/features/admin/components/_members/BulkActionBar.tsx` | large catalog search, category collapse, selected tag pinned row, scroll-constrained picker |
| BulkActionBar tests | `apps/web/src/features/admin/components/__tests__/BulkActionBar.spec.tsx` | real API response mock, search/collapse/pinned selection/pageSize regression tests |

## Evidence

| Evidence | Status |
| --- | --- |
| `members.spec.ts` | 11 tests PASS |
| `BulkActionBar.spec.tsx` | 20 tests PASS |
| broader web Vitest run | 216 files / 1587 tests PASS / 1 skipped |
| `mise exec -- pnpm typecheck` | PASS |
| `mise exec -- pnpm lint` | PASS |
| BulkActionBar HEX / bracket color grep | 0 hits |
| staging authenticated visual baseline | pending_user_approval |

## Contract Notes

- apps/api is unchanged. #1035 already made `GET /admin/tags` pagination/search capable with `{ total, items }`.
- apps/web keeps UI backward compatibility by returning `available` from `fetchTagMaster`, while also exposing `total`.
- `fetchAllTagMaster()` uses `pageSize=100` and cap guard to avoid silent 50-item truncation and unbounded loops.
- Selected tag IDs remain independent of the visible/fetched catalog; labels are resolved through a known-tag map with id fallback.

## Lessons Learned

| ID | Knowledge | Path |
| --- | --- | --- |
| L-I1078-001 | 古い issue は依存先 endpoint の実応答 shape を実コードで突合する（cosmetic 主題でも contract バグが潜む） | `references/lessons-learned-issue-1078-bulk-tag-picker-large-catalog-ux-2026-06.md` |
| L-I1078-002 | test mock の shape を実 API response schema と突合する（誤前提 mock は runtime 破綻を隠蔽） | 同上 |
| L-I1078-003 | paginated mode の selected ラベルは known-tag の accumulated Map で保持 | 同上 |
| L-I1078-004 | client pagination の default pageSize は API max(100)、cap guard で無限ループ防止 | 同上 |
| L-I1078-005 | 並列 SubAgent の backbone Write はワークツリー root 相対／pwd 確認済み絶対パス | 同上 |
| L-I1078-006 | artifacts.json の gate `status` は zod enum 4 値のみ（`pending_user_approval` 不可、`pending`+`passed_at:null`+notes で表現） | 同上 |

