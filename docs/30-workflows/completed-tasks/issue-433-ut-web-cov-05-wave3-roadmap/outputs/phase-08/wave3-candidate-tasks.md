# Wave-3 Candidate Tasks

Status: `COMPLETED`

| rank | slug | summary | layer | delegation-target | score | rationale |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | ut-web-cov-06-admin-identity-conflict-row | `IdentityConflictRow.tsx` (0/0/0) を含む admin row UI コンポーネントの単体カバレッジ強化 | admin component | wave-3-unit | 27 (3×3×3) | wave-2 で空のまま残ったファイル。row UI は依存少・規模小・影響中。即着手可。 |
| 2 | ut-api-cov-07-error-handler-branch | `apps/api/src/middleware/error-handler.ts` の error 種別 branch 網羅 (branch 18.18→) | other (middleware) | wave-3-unit | 27 (3×3×3) | 全 route 共通の error mapping。最少コストで全体 branch% を底上げできる。 |
| 3 | ut-api-cov-08-repository-branch-bundle | `repository/{publicMembers,meetings,dashboard,schemaAliases,memberTags,identity-conflict}.ts` の branch / function gap 一括補強 | other (repository) | wave-3-unit | 18 (3×2×3) | 6 ファイル束ねで作業効率高い。D1 mock のみで完結。業務影響は filter / pagination / aggregate に直結。 |
| 4 | ut-web-cov-09-admin-members-request-queue | `MembersClient.tsx` (function 35) / `RequestQueuePanel.tsx` (branch 60 / function 58) の interaction 補強 | admin component | wave-3-unit | 18 (3×2×3) | admin 業務の中核 UI。状態遷移 branch を React Testing Library で増やせる。 |
| 5 | ut-api-cov-10-public-route-branch | `routes/public/members.ts` (branch 60) / `use-cases/public/get-form-preview.ts` (branch 54.54) の filter / null branch | route handler / use-case | wave-3-unit | 18 (3×2×3) | public 露出パスで影響大。既存 helper を活用すれば実装小。 |
| 6 | ut-api-cov-11-admin-requests-handler | `routes/admin/requests.ts` (function 55.55) の handler 別 unit テスト整備 | route handler | wave-3-unit | 12 (3×2×2) | admin 承認フローの中核。handler 数が多く規模中。 |
| 7 | ut-shared-cov-12-jobs-shared-branded-types | `jobs/_shared/index.ts` / `_shared/branded-types/meeting.ts` の単体補強 | other / shared | wave-3-unit | 8 (2×2×2) | utility 層。影響は小〜中だが規模も小。 |
| 8 | ut-int-cov-13-sync-integration-suite | sync (`manual` / `backfill` / `scheduled` / `sheets-client` / `routes/admin/sync*`) を束ねた integration テストスイート | integration | integration-test | 6 (3×1×2) | NON_VISUAL backlog の主要委譲先。実装規模は大きいが業務影響は最大。wave-3 末尾で着手。 |

合計 8 件 (要件: 5〜10 件)。
