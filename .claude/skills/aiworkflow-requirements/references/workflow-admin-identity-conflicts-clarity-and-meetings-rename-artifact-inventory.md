# workflow-admin-identity-conflicts-clarity-and-meetings-rename-artifact-inventory

| item | value |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/admin-identity-conflicts-clarity-and-meetings-rename/` |
| status | `implemented_local_evidence_captured / implementation / VISUAL / runtime screenshots pending_user_gate` |
| evidence | focused Vitest 5 files / 42 tests PASS; `verify:tokens` PASS; `typecheck` PASS; `lint` PASS; `verify:phase12-compliance` PASS |

`/admin/identity-conflicts` を非エンジニア管理者向けに平易化し、管理サイドバーの `開催日` / `Identity重複` ラベルを `開催・出席管理` / `会員の重複確認` へ改名した。API surface / D1 schema / shared response shape は不変で、`matchedFields` の `name` / `affiliation` は web 表現層の glossary で `氏名` / `職業` へ変換する。

## Implementation

| Area | Files |
| --- | --- |
| Admin shell labels | `apps/web/src/components/shell/shell-config.ts`, `apps/web/src/components/shell/__tests__/shell-config.spec.ts` |
| Identity conflicts UI | `apps/web/app/(admin)/admin/identity-conflicts/page.tsx`, `apps/web/src/components/admin/IdentityConflictRow.tsx`, `apps/web/src/components/admin/IdentityConflictGuide.tsx`, `apps/web/src/components/admin/identityConflictAnnouncements.ts` |
| UI glossary/tests | `apps/web/src/features/admin/identity-conflicts/identityConflictGlossary.ts`, `apps/web/src/features/admin/identity-conflicts/__tests__/identityConflictGlossary.spec.ts`, `apps/web/src/components/admin/__tests__/IdentityConflict{Row,Guide}.spec.tsx` |
| Staging seed | `apps/api/src/testing/identity-conflicts/{catalog,build-seed-sql,index}.ts`, `apps/api/migrations/seed/identity-conflict-{staging-seed,cleanup}.sql`, `apps/api/migrations/seed/__tests__/identity-conflict-seed.contract.spec.ts`, `scripts/gen-identity-conflict-seed.mjs`, `scripts/seed-identity-conflicts.sh` |

## Evidence

- Focused Vitest: 5 files / 42 tests PASS.
- `mise exec -- pnpm verify:tokens`: PASS (91 tracked).
- `mise exec -- pnpm typecheck`: PASS.
- `mise exec -- pnpm lint`: PASS.
- `pnpm verify:phase12-compliance`: PASS.
- Seed contract proves byte-for-byte generator drift 0, idempotent apply, scoped cleanup, and exactly 5 conflict candidates.
- Runtime screenshots and staging seed apply remain user-gated.

## Invariants

- No API endpoint change.
- No `packages/shared` identity-conflict schema change.
- No D1 schema migration.
- Production seed execution is blocked by `scripts/seed-identity-conflicts.sh`; only `local` and `staging` are accepted.
- Existing `apps/api/src/testing/test-accounts/**` remains untouched.

## Lessons Learned

- **L-AICCMR-001（VISUAL implemented_local_evidence_captured の screenshot は pending 固定）**: UI 実コードと focused tests が同一 wave で完了していても、authenticated runtime / staging seed apply / runtime visual capture が user-gated の場合 screenshot は物理的に存在しない。Phase 11 evidence inventory の screenshot 行は必ず `pending` にし、`phase11-capture-metadata.json` は `status: pending_implementation` にする。`Status=present` で物理 PNG 存在検査を偽装すると `verify-phase12-compliance` の §4 で fail する。
- **L-AICCMR-002（implemented_local_evidence_captured は global skill を same-wave 同期）**: 実コード差分と local evidence が揃った close-out では aiworkflow-requirements の active guide / quick-reference / resource-map / artifact-inventory / SKILL-changelog を同一サイクルで反映する。`close-out 後に実施` / `N/A（本サイクル）` の stale 表記を残したまま PASS にしない。本タスクはこの 5 surface + topic-map + keywords を同一 wave で同期した。
- **L-AICCMR-003（API 不変は AC に diff 範囲を明記＋先行命名規則踏襲）**: 「API 非変更」を AC に含むタスクは `git diff -- apps/api/src/routes apps/api/src/repository apps/api/src/services packages/shared`（concern の testing/seed を除く）という具体的 diff 範囲を AC 本文に書くと実装検証が決定論的になる（AC-8 で採用）。glossary（`matchedFieldLabel`・未登録 fail-soft）/ Guide component は先行タスク（dashboardGlossary / tagManagementGlossary / TagManagementGuide）の命名規則に倣い探索コストをゼロ化。seed を専用 dataset（identity-conflicts）に分離し既存 test-accounts を不変にしたことで contract test の責務が明確化した。
