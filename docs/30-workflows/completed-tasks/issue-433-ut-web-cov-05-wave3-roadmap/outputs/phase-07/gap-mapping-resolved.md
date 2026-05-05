# Gap Mapping (Resolved)

Status: `COMPLETED`

Phase 6 gap-mapping.md の 30 件のうち、wave-3-unit に残るもの（integration / e2e / polish へ委譲しないもの）を確定。`source-row-id` は Phase 6 と同一 ID を維持。

| source-row-id | layer | file | line% | branch% | function% | gap-class | resolved-target | rationale |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| G01 | admin component | apps/web/src/components/admin/IdentityConflictRow.tsx | 0 | 0 | 0 | under-tested-unit | wave-3-unit | row UI は単体で完全網羅可能。 |
| G02 | other | apps/web/src/components/layout/MemberHeader.tsx | 0 | 0 | 0 | under-tested-unit | wave-3-unit | 認証状態別レンダリングを単体で。 |
| G04 | other | apps/api/src/jobs/_shared/index.ts | 0 | 0 | 0 | under-tested-unit | wave-3-unit | barrel + helper を単体で。 |
| G06 | other | apps/api/src/_shared/branded-types/meeting.ts | 0 | 0 | 0 | under-tested-unit | wave-3-unit | brand guard / factory の単体。 |
| G12 | other | apps/api/src/middleware/error-handler.ts | 63.63 | 18.18 | 66.66 | branch-only-gap | wave-3-unit | error 種別ごとに throw / map を単体で。 |
| G15 | admin component | apps/web/src/components/admin/MembersClient.tsx | 75.82 | 93.33 | 35 | under-tested-unit | wave-3-unit | interaction handler を単体で増。 |
| G18 | other | apps/api/src/sync/scheduled.ts | 100 | 44.44 | 100 | branch-only-gap | wave-3-unit | branch を mock で。 |
| G19 | other | apps/api/src/repository/publicMembers.ts | 85.15 | 48.27 | 100 | branch-only-gap | wave-3-unit | filter combination の branch。 |
| G20 | other | packages/.../repository/_shared/db.ts | 100 | 50 | 50 | branch-only-gap | wave-3-unit | helper を直接テスト。 |
| G21 | route handler | apps/api/src/routes/admin/_shared.ts | 86.66 | 50 | 100 | branch-only-gap | wave-3-unit | guard helper の branch。 |
| G22 | use-case | apps/api/src/use-cases/public/get-form-preview.ts | 96.77 | 54.54 | 100 | branch-only-gap | wave-3-unit | preview の null/empty 強化。 |
| G23 | route handler | apps/api/src/routes/admin/requests.ts | 85.09 | 86.36 | 55.55 | under-tested-unit | wave-3-unit | request 種別 handler を増。 |
| G24 | admin component | apps/web/src/components/admin/RequestQueuePanel.tsx | 96.87 | 60 | 58.33 | branch-only-gap | wave-3-unit | 状態遷移 branch。 |
| G25 | other | apps/api/src/repository/meetings.ts | 100 | 59.25 | 100 | branch-only-gap | wave-3-unit | meeting query の branch。 |
| G26 | other | apps/api/src/repository/dashboard.ts | 85.71 | 60 | 100 | branch-only-gap | wave-3-unit | dashboard aggregate。 |
| G27 | other | apps/api/src/repository/schemaAliases.ts | 96.92 | 60 | 100 | branch-only-gap | wave-3-unit | alias 検索 branch。 |
| G28 | route handler | apps/api/src/routes/public/members.ts | 100 | 60 | 100 | branch-only-gap | wave-3-unit | filter combination branch。 |
| G29 | other | apps/api/src/repository/memberTags.ts | 60.86 | 100 | 66.66 | under-tested-unit | wave-3-unit | tag CRUD line / function 単体。 |
| G30 | other | apps/api/src/repository/identity-conflict.ts | 96.42 | 61.53 | 100 | branch-only-gap | wave-3-unit | conflict resolve branch。 |

## 委譲済み（NON_VISUAL backlog 参照）

- G09 / G10 / G11 / G13 / G14 / G16 / G17 → integration-test
- G03 / G05 / G07 / G08 → polish-only / 除外

詳細は `non-visual-backlog.md` を参照。
