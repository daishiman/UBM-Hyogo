# Artifact Inventory — issue-224-public-members-tags-batch-fetch

| Item | Path |
| --- | --- |
| workflow root | `docs/30-workflows/issue-224-public-members-tags-batch-fetch/` |
| root artifacts | `docs/30-workflows/issue-224-public-members-tags-batch-fetch/artifacts.json` |
| output artifacts | `docs/30-workflows/issue-224-public-members-tags-batch-fetch/outputs/artifacts.json` |
| Phase 11 evidence | `docs/30-workflows/issue-224-public-members-tags-batch-fetch/outputs/phase-11/main.md` |
| Phase 12 strict outputs | `docs/30-workflows/issue-224-public-members-tags-batch-fetch/outputs/phase-12/` |
| implementation targets | `apps/api/src/_shared/search-query-parser.ts`, `apps/api/src/use-cases/public/list-public-members.ts`, `apps/api/src/repository/memberTags.ts`, `apps/api/src/view-models/public/public-member-list-view.ts`, `packages/shared/src/zod/viewmodel.ts`, `packages/shared/src/types/viewmodel/index.ts` |
| test targets | `apps/api/src/_shared/__tests__/search-query-parser.spec.ts`, `apps/api/src/routes/public/index.contract.spec.ts`, `apps/api/src/use-cases/public/__tests__/list-public-members.spec.ts`, `apps/api/src/repository/__tests__/memberTags.repository.spec.ts`, `packages/shared/src/zod/viewmodel.spec.ts` |

## Lessons

- [lessons-learned-issue-224-public-members-tags-batch-fetch-2026-05.md](lessons-learned-issue-224-public-members-tags-batch-fetch-2026-05.md) — L-I224-001..010
  - 001 helper shape verbatim / 002 expand opt-in / 003 public fail-close / 004 安定 SQL order
  - 005 IN placeholder 動的生成+bind / 006 空配列ガード / 007 expand whitelist 正規化 / 008 repository フラット配列+use-case groupBy / 009 contract appliedQuery key 固定 / 010 zod/型/test 連動更新

Status: `implemented_local_evidence_captured / implementation / NON_VISUAL`. Commit, push, PR, staging deploy, and GitHub Issue mutation remain user-gated.
