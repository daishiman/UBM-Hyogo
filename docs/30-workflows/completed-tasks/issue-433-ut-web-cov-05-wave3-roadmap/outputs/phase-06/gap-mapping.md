# Gap Mapping

Status: `COMPLETED`

line / branch / function いずれかが 80% 未満の file を 30 件抽出（最少カバー率昇順）。`source-row-id` は本表内の通し番号。

| source-row-id | layer | file | line% | branch% | function% | gap-class | delegation-target | rationale |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| G01 | admin component | apps/web/src/components/admin/IdentityConflictRow.tsx | 0 | 0 | 0 | under-tested-unit | wave-3-unit | wave-2 で touch されず空。row UI は単体で網羅可能。 |
| G02 | other | apps/web/src/components/layout/MemberHeader.tsx | 0 | 0 | 0 | under-tested-unit | wave-3-unit | layout 直下で classifier が `other` 扱い。基本レンダリング系で単体可能。 |
| G03 | other | apps/api/src/env.ts | 0 | 0 | 0 | mock-coverage-only | polish-only | bindings env はテストでは mock 経由のため貢献し難い。除外候補。 |
| G04 | other | apps/api/src/jobs/_shared/index.ts | 0 | 0 | 0 | under-tested-unit | wave-3-unit | barrel export だが分岐がある場合は単体テストで補える。 |
| G05 | other | packages/.../repository/__tests__/memberTags.readonly.test-d.ts | 0 | 0 | 0 | mock-coverage-only | polish-only | type-only test (`.test-d.ts`) は実行 coverage に乗らない。除外。 |
| G06 | other | apps/api/src/_shared/branded-types/meeting.ts | 0 | 0 | 0 | under-tested-unit | wave-3-unit | branded type の guard / factory を単体で網羅。 |
| G07 | other | apps/api/src/sync/types.ts | 0 | 0 | 0 | mock-coverage-only | polish-only | type-only module で実行カバー無関係。除外候補。 |
| G08 | lib | apps/web/src/lib/api/me-types.test-d.ts | 0 | 0 | 0 | mock-coverage-only | polish-only | type-only test。除外。 |
| G09 | other | apps/api/src/jobs/sheets-fetcher.ts | 13.6 | 100 | 8.33 | integration-required | integration-test | Sheets API クライアント呼び出しが主体で実依存重い。integration が向く。 |
| G10 | other | apps/api/src/index.ts | 50.58 | 92.85 | 14.28 | integration-required | integration-test | Hono app entry。route 全体登録の検証は integration 寄り。 |
| G11 | route handler | apps/api/src/routes/admin/sync-schema.ts | 43.15 | 100 | 16.66 | integration-required | integration-test | schema sync trigger は D1 / queue 含む副作用前提。 |
| G12 | other | apps/api/src/middleware/error-handler.ts | 63.63 | 18.18 | 66.66 | branch-only-gap | wave-3-unit | error 種別ごとの branch を単体で網羅可能。 |
| G13 | other | apps/api/src/sync/sheets-client.ts | 47.82 | 100 | 33.33 | integration-required | integration-test | Sheets 実 API 依存。 |
| G14 | route handler | apps/api/src/routes/admin/sync.ts | 61.53 | 33.33 | 100 | integration-required | integration-test | manual sync 起動 endpoint。queue / mutex 依存で integration 向き。 |
| G15 | admin component | apps/web/src/components/admin/MembersClient.tsx | 75.82 | 93.33 | 35 | under-tested-unit | wave-3-unit | function% が 35 と低い。インタラクションを単体で増強可能。 |
| G16 | other | apps/api/src/sync/manual.ts | 48.57 | 37.5 | 66.66 | integration-required | integration-test | manual sync workflow。 |
| G17 | other | apps/api/src/sync/backfill.ts | 53.33 | 44.44 | 66.66 | integration-required | integration-test | backfill flow。実 D1 / Queue が必要。 |
| G18 | other | apps/api/src/sync/scheduled.ts | 100 | 44.44 | 100 | branch-only-gap | wave-3-unit | branch 経路を mock で増強可能。 |
| G19 | other | apps/api/src/repository/publicMembers.ts | 85.15 | 48.27 | 100 | branch-only-gap | wave-3-unit | filter / pagination branch を D1 mock で網羅。 |
| G20 | other | packages/.../repository/_shared/db.ts | 100 | 50 | 50 | branch-only-gap | wave-3-unit | shared db helper の関数群を直接テスト。 |
| G21 | route handler | apps/api/src/routes/admin/_shared.ts | 86.66 | 50 | 100 | branch-only-gap | wave-3-unit | guard helper の branch 増強。 |
| G22 | use-case | apps/api/src/use-cases/public/get-form-preview.ts | 96.77 | 54.54 | 100 | branch-only-gap | wave-3-unit | preview の null/empty branch 強化。 |
| G23 | route handler | apps/api/src/routes/admin/requests.ts | 85.09 | 86.36 | 55.55 | under-tested-unit | wave-3-unit | function% 55。要求別 handler を単体で増やす。 |
| G24 | admin component | apps/web/src/components/admin/RequestQueuePanel.tsx | 96.87 | 60 | 58.33 | branch-only-gap | wave-3-unit | branch / function 共に弱い。状態遷移で増強。 |
| G25 | other | apps/api/src/repository/meetings.ts | 100 | 59.25 | 100 | branch-only-gap | wave-3-unit | meeting query の branch 増強。 |
| G26 | other | apps/api/src/repository/dashboard.ts | 85.71 | 60 | 100 | branch-only-gap | wave-3-unit | dashboard aggregate の branch。 |
| G27 | other | apps/api/src/repository/schemaAliases.ts | 96.92 | 60 | 100 | branch-only-gap | wave-3-unit | alias 検索 branch。 |
| G28 | route handler | apps/api/src/routes/public/members.ts | 100 | 60 | 100 | branch-only-gap | wave-3-unit | filter combination の branch。 |
| G29 | other | apps/api/src/repository/memberTags.ts | 60.86 | 100 | 66.66 | under-tested-unit | wave-3-unit | tag CRUD の line / function を単体補強。 |
| G30 | other | apps/api/src/repository/identity-conflict.ts | 96.42 | 61.53 | 100 | branch-only-gap | wave-3-unit | conflict resolve branch。 |

## gap-class 凡例

- `under-tested-unit`: 単体テスト不足。
- `branch-only-gap`: line / function は OK だが branch のみ低い。
- `integration-required`: 実 D1 / Queue / 外部 API 依存で integration 必須。
- `e2e-required`: ブラウザ経由の動線確認が必須。
- `mock-coverage-only`: mock 系 / type-only ファイルで実行 coverage に貢献し難い。
