# Phase 2: 既存実装調査 / fixed list 凍結 / 命名衝突調査

## 目的

`apps/api/src/**/*.test.ts` 132 ファイル全件を 4 種 suffix 分類に振り分けた **fixed list を凍結** する。同時に既存 glob inventory（vitest / package.json / lefthook / CI）を全件抽出し、rename 後パスの命名衝突調査を行う。本 Phase の出力をもって Phase 3 設計の入力を確定する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 2 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | implementation_completed |

## 実行タスク

| Task | 内容 |
| --- | --- |
| 2-1 | 132 ファイル全件を 4 分類（contract / authz / repository / unit）に振り分け fixed list を確定する |
| 2-2 | 既存 glob inventory を `rg` / `grep` で全件抽出し列挙する |
| 2-3 | rename 後パスと既存ファイルの命名衝突を `find` で確認する |
| 2-4 | 既に `*.contract.test.ts` 命名のファイル（`alias-queue-adapter.contract.test.ts` 等）の取り扱い方針を確定する |

## 分類ルール（Phase 3 で ADR 化される暫定ルール）

| 分類 | 対象 path pattern | suffix |
| --- | --- | --- |
| contract | `apps/api/src/routes/**/*.test.ts`、`apps/api/src/sync/*.test.ts`（schema/ 配下を除く）、`apps/api/src/health-db.test.ts`、`apps/api/src/audit-correlation/__tests__/{contract,run-route}.test.ts`、`apps/api/src/jobs/{sync-forms-responses,sync-forms-responses.types,sync-sheets-to-d1,cap-alert,retention-purge}.test.ts`、`apps/api/src/workflows/{schemaAlias*,tag*}.test.ts`（Cloudflare Workflows 外部 trigger 契約） | `*.contract.spec.ts` |
| authz | `apps/api/src/__tests__/authz-matrix.test.ts`、`apps/api/src/middleware/{require-admin,me-session-resolver}.test.ts`、`apps/api/src/middleware/__tests__/rate-limit-magic-link.test.ts` | `*.authz.spec.ts` |
| repository | `apps/api/src/repository/**/*.test.ts` 配下すべて（`*.contract.test.ts` 系・`*.diagnostics.test.ts`・`*.verify.test.ts` を含む） | `*.repository.spec.ts` |
| unit | 上記以外（utils / _shared / services / use-cases / view-models / schemas / sync/schema / jobs/_shared / jobs/mappers / 一部 workflows / env / notification-mail-config / __tests__/{brand-type,invariants} / audit-correlation 内の非 route 系 / middleware/repository-providers） | `*.spec.ts` |

合計件数（凍結値）: contract = **41** / authz = **4** / repository = **38** / unit = **49** / 合計 = **132**。

### 既存 `*.contract.test.ts` 命名ファイルの取り扱い

repository 配下の `alias-queue-adapter.contract.test.ts` / `builder.diagnostics.test.ts` / `static-manifest.verify.test.ts` は、命名上 `.contract` / `.diagnostics` / `.verify` の修飾がついているが、配置が `apps/api/src/repository/_shared/__tests__/` であるため、**repository 分類**に統一する。

- `alias-queue-adapter.contract.test.ts` → `alias-queue-adapter.repository.spec.ts`
- `builder.diagnostics.test.ts` → `builder.diagnostics.repository.spec.ts`（中間修飾子 `.diagnostics` は保持し、suffix の直前に `.repository.spec.ts` を付与）
- `static-manifest.verify.test.ts` → `static-manifest.verify.repository.spec.ts`

理由: (1) 規約は分類 4 種に閉じる、(2) 配置 path で「repository 層の test」と一意に特定できる、(3) 既存中間修飾子は意味を持つため保持する。

### `routes/auth/session-resolve.test.ts` の分類

`session-resolve` は HTTP route handler を直接 test しており、エンドポイント契約に分類する。authz 観点も含むが、authz 4 件の枠は middleware / matrix 系に確保し、本ファイルは **contract** に分類する。

## fixed list（132 行・全件）

凡例: 列順 = `old_path | new_path | suffix_class | justification`。すべての path はリポジトリ root 相対。

| # | old_path | new_path | suffix_class | justification |
| --- | --- | --- | --- | --- |
| 1 | apps/api/src/__tests__/authz-matrix.test.ts | apps/api/src/__tests__/authz-matrix.authz.spec.ts | authz | authz matrix 全体検証 |
| 2 | apps/api/src/__tests__/brand-type.test.ts | apps/api/src/__tests__/brand-type.spec.ts | unit | branded type の純粋単体 |
| 3 | apps/api/src/__tests__/invariants.test.ts | apps/api/src/__tests__/invariants.spec.ts | unit | invariants 検証の純粋単体 |
| 4 | apps/api/src/_shared/__tests__/pagination.test.ts | apps/api/src/_shared/__tests__/pagination.spec.ts | unit | 共通 util 単体 |
| 5 | apps/api/src/_shared/__tests__/public-filter.test.ts | apps/api/src/_shared/__tests__/public-filter.spec.ts | unit | 共通 util 単体 |
| 6 | apps/api/src/_shared/__tests__/search-query-parser.test.ts | apps/api/src/_shared/__tests__/search-query-parser.spec.ts | unit | parser 単体 |
| 7 | apps/api/src/_shared/__tests__/visibility-filter.test.ts | apps/api/src/_shared/__tests__/visibility-filter.spec.ts | unit | filter ロジック単体 |
| 8 | apps/api/src/audit-correlation/__tests__/contract.test.ts | apps/api/src/audit-correlation/__tests__/contract.contract.spec.ts | contract | audit-correlation 外部契約 |
| 9 | apps/api/src/audit-correlation/__tests__/correlate.test.ts | apps/api/src/audit-correlation/__tests__/correlate.spec.ts | unit | 内部相関ロジック単体 |
| 10 | apps/api/src/audit-correlation/__tests__/github-fetch.test.ts | apps/api/src/audit-correlation/__tests__/github-fetch.spec.ts | unit | fetch wrapper 単体（mock） |
| 11 | apps/api/src/audit-correlation/__tests__/notify-slack.test.ts | apps/api/src/audit-correlation/__tests__/notify-slack.spec.ts | unit | Slack 通知 wrapper（mock） |
| 12 | apps/api/src/audit-correlation/__tests__/persist.test.ts | apps/api/src/audit-correlation/__tests__/persist.spec.ts | unit | 永続化ロジック単体 |
| 13 | apps/api/src/audit-correlation/__tests__/redact.test.ts | apps/api/src/audit-correlation/__tests__/redact.spec.ts | unit | redaction 単体 |
| 14 | apps/api/src/audit-correlation/__tests__/rotation.test.ts | apps/api/src/audit-correlation/__tests__/rotation.spec.ts | unit | rotation ロジック単体 |
| 15 | apps/api/src/audit-correlation/__tests__/run-correlation.test.ts | apps/api/src/audit-correlation/__tests__/run-correlation.spec.ts | unit | 相関 runner 単体 |
| 16 | apps/api/src/audit-correlation/__tests__/run-route.test.ts | apps/api/src/audit-correlation/__tests__/run-route.contract.spec.ts | contract | HTTP route 契約 |
| 17 | apps/api/src/audit-correlation/__tests__/runbook-url.test.ts | apps/api/src/audit-correlation/__tests__/runbook-url.spec.ts | unit | URL 構築単体 |
| 18 | apps/api/src/env.test.ts | apps/api/src/env.spec.ts | unit | env schema 単体 |
| 19 | apps/api/src/health-db.test.ts | apps/api/src/health-db.contract.spec.ts | contract | health endpoint 契約 |
| 20 | apps/api/src/jobs/_shared/__tests__/ledger.test.ts | apps/api/src/jobs/_shared/__tests__/ledger.spec.ts | unit | ledger 単体 |
| 21 | apps/api/src/jobs/_shared/__tests__/sync-error.test.ts | apps/api/src/jobs/_shared/__tests__/sync-error.spec.ts | unit | error 構造単体 |
| 22 | apps/api/src/jobs/_shared/sync-jobs-schema.test.ts | apps/api/src/jobs/_shared/sync-jobs-schema.spec.ts | unit | schema 単体 |
| 23 | apps/api/src/jobs/cap-alert.test.ts | apps/api/src/jobs/cap-alert.contract.spec.ts | contract | 外部 alert dispatch 契約 |
| 24 | apps/api/src/jobs/mappers/extract-consent.test.ts | apps/api/src/jobs/mappers/extract-consent.spec.ts | unit | mapper 単体 |
| 25 | apps/api/src/jobs/mappers/normalize-response.test.ts | apps/api/src/jobs/mappers/normalize-response.spec.ts | unit | mapper 単体 |
| 26 | apps/api/src/jobs/mappers/sheets-to-members.test.ts | apps/api/src/jobs/mappers/sheets-to-members.spec.ts | unit | mapper 単体 |
| 27 | apps/api/src/jobs/retention-purge.test.ts | apps/api/src/jobs/retention-purge.contract.spec.ts | contract | 外部 D1 purge job 契約 |
| 28 | apps/api/src/jobs/sync-forms-responses.test.ts | apps/api/src/jobs/sync-forms-responses.contract.spec.ts | contract | Google Forms 外部契約 |
| 29 | apps/api/src/jobs/sync-forms-responses.types.test.ts | apps/api/src/jobs/sync-forms-responses.types.contract.spec.ts | contract | Google Forms types 契約 |
| 30 | apps/api/src/jobs/sync-sheets-to-d1.test.ts | apps/api/src/jobs/sync-sheets-to-d1.contract.spec.ts | contract | Sheets→D1 外部契約 |
| 31 | apps/api/src/middleware/__tests__/rate-limit-magic-link.test.ts | apps/api/src/middleware/__tests__/rate-limit-magic-link.authz.spec.ts | authz | rate limit を含む authz |
| 32 | apps/api/src/middleware/me-session-resolver.test.ts | apps/api/src/middleware/me-session-resolver.authz.spec.ts | authz | session 解決 authz |
| 33 | apps/api/src/middleware/repository-providers.test.ts | apps/api/src/middleware/repository-providers.spec.ts | unit | DI provider 単体 |
| 34 | apps/api/src/middleware/require-admin.test.ts | apps/api/src/middleware/require-admin.authz.spec.ts | authz | admin 権限 authz |
| 35 | apps/api/src/notification-mail-config.test.ts | apps/api/src/notification-mail-config.spec.ts | unit | config 単体 |
| 36 | apps/api/src/repository/__tests__/_setup.test.ts | apps/api/src/repository/__tests__/_setup.repository.spec.ts | repository | repository test setup |
| 37 | apps/api/src/repository/__tests__/adminNotes.test.ts | apps/api/src/repository/__tests__/adminNotes.repository.spec.ts | repository | repository CRUD |
| 38 | apps/api/src/repository/__tests__/adminUsers.test.ts | apps/api/src/repository/__tests__/adminUsers.repository.spec.ts | repository | repository CRUD |
| 39 | apps/api/src/repository/__tests__/attendance-analytics.test.ts | apps/api/src/repository/__tests__/attendance-analytics.repository.spec.ts | repository | repository 集計 |
| 40 | apps/api/src/repository/__tests__/attendance-pagination.test.ts | apps/api/src/repository/__tests__/attendance-pagination.repository.spec.ts | repository | repository pagination |
| 41 | apps/api/src/repository/__tests__/attendance-provider.test.ts | apps/api/src/repository/__tests__/attendance-provider.repository.spec.ts | repository | repository provider |
| 42 | apps/api/src/repository/__tests__/auditLog.test.ts | apps/api/src/repository/__tests__/auditLog.repository.spec.ts | repository | repository CRUD |
| 43 | apps/api/src/repository/__tests__/brand.test.ts | apps/api/src/repository/__tests__/brand.repository.spec.ts | repository | repository brand |
| 44 | apps/api/src/repository/__tests__/builder.test.ts | apps/api/src/repository/__tests__/builder.repository.spec.ts | repository | repository builder |
| 45 | apps/api/src/repository/__tests__/fieldVisibility.test.ts | apps/api/src/repository/__tests__/fieldVisibility.repository.spec.ts | repository | repository 可視性 |
| 46 | apps/api/src/repository/__tests__/identities.test.ts | apps/api/src/repository/__tests__/identities.repository.spec.ts | repository | repository identities |
| 47 | apps/api/src/repository/__tests__/identity-conflict.test.ts | apps/api/src/repository/__tests__/identity-conflict.repository.spec.ts | repository | repository 衝突検出 |
| 48 | apps/api/src/repository/__tests__/identity-merge.test.ts | apps/api/src/repository/__tests__/identity-merge.repository.spec.ts | repository | repository merge |
| 49 | apps/api/src/repository/__tests__/magicTokens.test.ts | apps/api/src/repository/__tests__/magicTokens.repository.spec.ts | repository | repository token |
| 50 | apps/api/src/repository/__tests__/members.test.ts | apps/api/src/repository/__tests__/members.repository.spec.ts | repository | repository CRUD |
| 51 | apps/api/src/repository/__tests__/memberTags.test.ts | apps/api/src/repository/__tests__/memberTags.repository.spec.ts | repository | repository CRUD |
| 52 | apps/api/src/repository/__tests__/notificationOutbox.test.ts | apps/api/src/repository/__tests__/notificationOutbox.repository.spec.ts | repository | repository outbox |
| 53 | apps/api/src/repository/__tests__/responseFields.test.ts | apps/api/src/repository/__tests__/responseFields.repository.spec.ts | repository | repository CRUD |
| 54 | apps/api/src/repository/__tests__/responses.test.ts | apps/api/src/repository/__tests__/responses.repository.spec.ts | repository | repository CRUD |
| 55 | apps/api/src/repository/__tests__/responseSections.test.ts | apps/api/src/repository/__tests__/responseSections.repository.spec.ts | repository | repository CRUD |
| 56 | apps/api/src/repository/__tests__/status.test.ts | apps/api/src/repository/__tests__/status.repository.spec.ts | repository | repository status |
| 57 | apps/api/src/repository/__tests__/syncJobs.test.ts | apps/api/src/repository/__tests__/syncJobs.repository.spec.ts | repository | repository syncJobs |
| 58 | apps/api/src/repository/_shared/__tests__/alias-queue-adapter.contract.test.ts | apps/api/src/repository/_shared/__tests__/alias-queue-adapter.repository.spec.ts | repository | repository adapter（中間 .contract 修飾子は除去し repository に統合） |
| 59 | apps/api/src/repository/_shared/__tests__/builder.diagnostics.test.ts | apps/api/src/repository/_shared/__tests__/builder.diagnostics.repository.spec.ts | repository | repository builder 診断（中間修飾子 .diagnostics 保持） |
| 60 | apps/api/src/repository/_shared/__tests__/static-manifest.verify.test.ts | apps/api/src/repository/_shared/__tests__/static-manifest.verify.repository.spec.ts | repository | repository manifest 検証（中間修飾子 .verify 保持） |
| 61 | apps/api/src/repository/_shared/builder.test.ts | apps/api/src/repository/_shared/builder.repository.spec.ts | repository | repository builder 共通 |
| 62 | apps/api/src/repository/_shared/metadata.test.ts | apps/api/src/repository/_shared/metadata.repository.spec.ts | repository | repository metadata |
| 63 | apps/api/src/repository/_shared/sql.test.ts | apps/api/src/repository/_shared/sql.repository.spec.ts | repository | repository SQL helper |
| 64 | apps/api/src/repository/attendance.test.ts | apps/api/src/repository/attendance.repository.spec.ts | repository | repository CRUD |
| 65 | apps/api/src/repository/meetings.test.ts | apps/api/src/repository/meetings.repository.spec.ts | repository | repository CRUD |
| 66 | apps/api/src/repository/publicMembers.test.ts | apps/api/src/repository/publicMembers.repository.spec.ts | repository | repository public view |
| 67 | apps/api/src/repository/schemaAliases.test.ts | apps/api/src/repository/schemaAliases.repository.spec.ts | repository | repository schema alias |
| 68 | apps/api/src/repository/schemaDiffQueue.test.ts | apps/api/src/repository/schemaDiffQueue.repository.spec.ts | repository | repository diff queue |
| 69 | apps/api/src/repository/schemaQuestions.test.ts | apps/api/src/repository/schemaQuestions.repository.spec.ts | repository | repository CRUD |
| 70 | apps/api/src/repository/schemaVersions.test.ts | apps/api/src/repository/schemaVersions.repository.spec.ts | repository | repository version |
| 71 | apps/api/src/repository/tagDefinitions.test.ts | apps/api/src/repository/tagDefinitions.repository.spec.ts | repository | repository tag |
| 72 | apps/api/src/repository/tagQueue.test.ts | apps/api/src/repository/tagQueue.repository.spec.ts | repository | repository queue |
| 73 | apps/api/src/repository/tagQueueIdempotencyRetry.test.ts | apps/api/src/repository/tagQueueIdempotencyRetry.repository.spec.ts | repository | repository retry |
| 74 | apps/api/src/routes/admin/attendance.test.ts | apps/api/src/routes/admin/attendance.contract.spec.ts | contract | admin route 契約 |
| 75 | apps/api/src/routes/admin/audit.test.ts | apps/api/src/routes/admin/audit.contract.spec.ts | contract | admin route 契約 |
| 76 | apps/api/src/routes/admin/dashboard.test.ts | apps/api/src/routes/admin/dashboard.contract.spec.ts | contract | admin route 契約 |
| 77 | apps/api/src/routes/admin/identity-conflicts.test.ts | apps/api/src/routes/admin/identity-conflicts.contract.spec.ts | contract | admin route 契約 |
| 78 | apps/api/src/routes/admin/meetings.test.ts | apps/api/src/routes/admin/meetings.contract.spec.ts | contract | admin route 契約 |
| 79 | apps/api/src/routes/admin/member-delete.test.ts | apps/api/src/routes/admin/member-delete.contract.spec.ts | contract | admin route 契約 |
| 80 | apps/api/src/routes/admin/member-notes.test.ts | apps/api/src/routes/admin/member-notes.contract.spec.ts | contract | admin route 契約 |
| 81 | apps/api/src/routes/admin/member-status.test.ts | apps/api/src/routes/admin/member-status.contract.spec.ts | contract | admin route 契約 |
| 82 | apps/api/src/routes/admin/members.test.ts | apps/api/src/routes/admin/members.contract.spec.ts | contract | admin route 契約 |
| 83 | apps/api/src/routes/admin/requests.test.ts | apps/api/src/routes/admin/requests.contract.spec.ts | contract | admin route 契約 |
| 84 | apps/api/src/routes/admin/responses-sync.test.ts | apps/api/src/routes/admin/responses-sync.contract.spec.ts | contract | admin route 契約 |
| 85 | apps/api/src/routes/admin/schema.test.ts | apps/api/src/routes/admin/schema.contract.spec.ts | contract | admin route 契約 |
| 86 | apps/api/src/routes/admin/smoke-observability.test.ts | apps/api/src/routes/admin/smoke-observability.contract.spec.ts | contract | admin smoke 契約 |
| 87 | apps/api/src/routes/admin/smoke-sheets.test.ts | apps/api/src/routes/admin/smoke-sheets.contract.spec.ts | contract | admin smoke 契約 |
| 88 | apps/api/src/routes/admin/sync-schema.test.ts | apps/api/src/routes/admin/sync-schema.contract.spec.ts | contract | admin route 契約 |
| 89 | apps/api/src/routes/admin/sync.test.ts | apps/api/src/routes/admin/sync.contract.spec.ts | contract | admin route 契約 |
| 90 | apps/api/src/routes/admin/tags-queue.test.ts | apps/api/src/routes/admin/tags-queue.contract.spec.ts | contract | admin route 契約 |
| 91 | apps/api/src/routes/auth/__tests__/auth-routes.test.ts | apps/api/src/routes/auth/__tests__/auth-routes.contract.spec.ts | contract | auth route 契約 |
| 92 | apps/api/src/routes/auth/session-resolve.test.ts | apps/api/src/routes/auth/session-resolve.contract.spec.ts | contract | auth route 契約（authz は別 4 件で確保） |
| 93 | apps/api/src/routes/me/index.test.ts | apps/api/src/routes/me/index.contract.spec.ts | contract | me route 契約 |
| 94 | apps/api/src/routes/public/index.test.ts | apps/api/src/routes/public/index.contract.spec.ts | contract | public route 契約 |
| 95 | apps/api/src/schemas/tagQueueResolve.test.ts | apps/api/src/schemas/tagQueueResolve.spec.ts | unit | zod schema 単体 |
| 96 | apps/api/src/services/admin/identity-conflict-detector.test.ts | apps/api/src/services/admin/identity-conflict-detector.spec.ts | unit | service ロジック単体 |
| 97 | apps/api/src/services/aliasRecommendation.test.ts | apps/api/src/services/aliasRecommendation.spec.ts | unit | service ロジック単体 |
| 98 | apps/api/src/services/mail/__tests__/magic-link-mailer.test.ts | apps/api/src/services/mail/__tests__/magic-link-mailer.spec.ts | unit | mailer service 単体（mock） |
| 99 | apps/api/src/services/notification/__tests__/dispatcher.test.ts | apps/api/src/services/notification/__tests__/dispatcher.spec.ts | unit | dispatcher service 単体 |
| 100 | apps/api/src/services/notification/__tests__/templates.test.ts | apps/api/src/services/notification/__tests__/templates.spec.ts | unit | template service 単体 |
| 101 | apps/api/src/sync/audit-route.test.ts | apps/api/src/sync/audit-route.contract.spec.ts | contract | sync audit route 契約 |
| 102 | apps/api/src/sync/audit.test.ts | apps/api/src/sync/audit.contract.spec.ts | contract | sync audit 契約 |
| 103 | apps/api/src/sync/backfill.test.ts | apps/api/src/sync/backfill.contract.spec.ts | contract | sync backfill 契約 |
| 104 | apps/api/src/sync/manual.test.ts | apps/api/src/sync/manual.contract.spec.ts | contract | sync manual trigger 契約 |
| 105 | apps/api/src/sync/scheduled.test.ts | apps/api/src/sync/scheduled.contract.spec.ts | contract | sync scheduled trigger 契約 |
| 106 | apps/api/src/sync/schema/diff-queue-writer.test.ts | apps/api/src/sync/schema/diff-queue-writer.spec.ts | unit | schema 内部 writer 単体 |
| 107 | apps/api/src/sync/schema/flatten.test.ts | apps/api/src/sync/schema/flatten.spec.ts | unit | schema 平坦化単体 |
| 108 | apps/api/src/sync/schema/forms-schema-sync.test.ts | apps/api/src/sync/schema/forms-schema-sync.spec.ts | unit | schema sync 単体 |
| 109 | apps/api/src/sync/schema/resolve-stable-key.test.ts | apps/api/src/sync/schema/resolve-stable-key.spec.ts | unit | key 解決単体 |
| 110 | apps/api/src/sync/schema/schema-hash.test.ts | apps/api/src/sync/schema/schema-hash.spec.ts | unit | hash 単体 |
| 111 | apps/api/src/sync/sheets-client.test.ts | apps/api/src/sync/sheets-client.contract.spec.ts | contract | Sheets API client 契約 |
| 112 | apps/api/src/use-cases/auth/__tests__/issue-magic-link.test.ts | apps/api/src/use-cases/auth/__tests__/issue-magic-link.spec.ts | unit | use-case 単体 |
| 113 | apps/api/src/use-cases/auth/__tests__/resolve-gate-state.test.ts | apps/api/src/use-cases/auth/__tests__/resolve-gate-state.spec.ts | unit | use-case 単体 |
| 114 | apps/api/src/use-cases/auth/__tests__/resolve-session.test.ts | apps/api/src/use-cases/auth/__tests__/resolve-session.spec.ts | unit | use-case 単体 |
| 115 | apps/api/src/use-cases/auth/__tests__/verify-magic-link.test.ts | apps/api/src/use-cases/auth/__tests__/verify-magic-link.spec.ts | unit | use-case 単体 |
| 116 | apps/api/src/use-cases/public/__tests__/get-form-preview.test.ts | apps/api/src/use-cases/public/__tests__/get-form-preview.spec.ts | unit | use-case 単体 |
| 117 | apps/api/src/use-cases/public/__tests__/get-public-member-profile.test.ts | apps/api/src/use-cases/public/__tests__/get-public-member-profile.spec.ts | unit | use-case 単体 |
| 118 | apps/api/src/use-cases/public/__tests__/get-public-stats.test.ts | apps/api/src/use-cases/public/__tests__/get-public-stats.spec.ts | unit | use-case 単体 |
| 119 | apps/api/src/use-cases/public/__tests__/list-public-members.test.ts | apps/api/src/use-cases/public/__tests__/list-public-members.spec.ts | unit | use-case 単体 |
| 120 | apps/api/src/utils/with-retry.test.ts | apps/api/src/utils/with-retry.spec.ts | unit | util 単体 |
| 121 | apps/api/src/utils/write-queue.test.ts | apps/api/src/utils/write-queue.spec.ts | unit | util 単体 |
| 122 | apps/api/src/view-models/public/__tests__/form-preview-view.test.ts | apps/api/src/view-models/public/__tests__/form-preview-view.spec.ts | unit | view-model 単体 |
| 123 | apps/api/src/view-models/public/__tests__/public-member-list-view.test.ts | apps/api/src/view-models/public/__tests__/public-member-list-view.spec.ts | unit | view-model 単体 |
| 124 | apps/api/src/view-models/public/__tests__/public-member-profile-view.test.ts | apps/api/src/view-models/public/__tests__/public-member-profile-view.spec.ts | unit | view-model 単体 |
| 125 | apps/api/src/view-models/public/__tests__/public-stats-view.test.ts | apps/api/src/view-models/public/__tests__/public-stats-view.spec.ts | unit | view-model 単体 |
| 126 | apps/api/src/workflows/notificationDispatchTick.test.ts | apps/api/src/workflows/notificationDispatchTick.spec.ts | unit | tick 内部ロジック単体 |
| 127 | apps/api/src/workflows/schemaAliasAssign.test.ts | apps/api/src/workflows/schemaAliasAssign.contract.spec.ts | contract | Cloudflare Workflow 外部 trigger 契約 |
| 128 | apps/api/src/workflows/schemaAliasBackfillBatch.test.ts | apps/api/src/workflows/schemaAliasBackfillBatch.contract.spec.ts | contract | Workflow batch trigger 契約 |
| 129 | apps/api/src/workflows/schemaAliasEnqueue.test.ts | apps/api/src/workflows/schemaAliasEnqueue.contract.spec.ts | contract | Workflow enqueue trigger 契約 |
| 130 | apps/api/src/workflows/tagCandidateEnqueue.test.ts | apps/api/src/workflows/tagCandidateEnqueue.contract.spec.ts | contract | Workflow enqueue trigger 契約 |
| 131 | apps/api/src/workflows/tagQueueResolve.test.ts | apps/api/src/workflows/tagQueueResolve.contract.spec.ts | contract | Workflow resolve trigger 契約 |
| 132 | apps/api/src/workflows/tagQueueRetryTick.test.ts | apps/api/src/workflows/tagQueueRetryTick.contract.spec.ts | contract | Workflow retry tick trigger 契約 |

### 件数集計（凍結値）

| suffix_class | 件数 | 行番号 |
| --- | --- | --- |
| contract | 41 | 8, 16, 19, 23, 27, 28, 29, 30, 74-94, 101-105, 111, 127-132 |
| authz | 4 | 1, 31, 32, 34 |
| repository | 38 | 36-73 |
| unit | 49 | 2-7, 9-15, 17, 18, 20-22, 24-26, 33, 35, 95-100, 106-110, 112-126 |
| **合計** | **132** | — |

不変条件 `41 + 4 + 38 + 49 = 132` を満たす。

## 既存 glob inventory（rename 同期対象）

抽出コマンド:

```bash
rg -n "(test|spec)\.ts" \
  vitest.config.ts \
  apps/api/vitest.config.ts \
  apps/api/package.json \
  package.json \
  lefthook.yml \
  .github/workflows/
```

対象ファイル（同期必須）:

| ファイル | 想定キー / 同期内容 |
| --- | --- |
| `vitest.config.ts`（root） | `test.include` / `test.exclude` / `coverage.exclude` の glob を `*.test.ts` 単独参照から `*.spec.ts` 単独へ移行 |
| `apps/api/vitest.config.ts`（存在する場合） | 同上。include / coverage.exclude を更新 |
| `apps/api/package.json` | `scripts.test` 系で `*.test.ts` を直接列挙していないか確認、glob は通常 vitest config 経由なので `--filter` 経由なら追加修正不要 |
| `package.json`（root） | root scripts が `apps/api` test を直接 glob しているか確認 |
| `lefthook.yml` | `pre-commit` / `pre-push` の test 関連 hook の path filter |
| `.github/workflows/ci.yml` | test 実行 step の glob / test list 取得処理 |
| `.github/workflows/backend-ci.yml` | backend test step の glob / direct command |
| `.github/workflows/pr-build-test.yml` | PR build / test step の glob / direct command |
| `.github/workflows/ci.yml` | apps/api test を回す step の glob |
| `.github/workflows/verify-*.yml` | 該当する場合のみ |

抽出結果は Phase 6 で実コマンド化し、Phase 11 evidence の `outputs/phase-11/glob-coverage-grep.log` に保存する。

## 命名衝突調査

### 衝突可能性の確認コマンド

```bash
# 1. rename 後パスが既に存在しないことを確認
while IFS=, read -r old_path new_path _; do
  if [[ -f "$new_path" ]]; then
    echo "COLLISION: $new_path (renaming from $old_path)"
  fi
done < outputs/phase-11/rename-mapping.csv

# 2. rename 後の同名衝突（複数 old_path が同一 new_path に解決していないか）を確認
awk -F, 'NR>1 {print $2}' outputs/phase-11/rename-mapping.csv | sort | uniq -d

# 3. 既存 *.spec.ts ファイルの存在確認（rename 後と一致しないこと）
find apps/api/src -name '*.spec.ts'
```

### 期待結果

| 確認 | 期待 |
| --- | --- |
| 1. rename 先存在 | 該当なし（出力ゼロ行） |
| 2. new_path 重複 | 該当なし（uniq -d 出力ゼロ行） |
| 3. 既存 `*.spec.ts` | rename 着手前は **0 件**（apps/api/src 配下に既存 `.spec.ts` は無い前提） |

着手前に上記 3 コマンドを実行し、Phase 11 evidence に結果を記録する。衝突が 1 件でも検出された場合は Phase 8 のエラーハンドリング手順に従い、fixed list を再凍結する。

## 完了条件チェック

- [ ] fixed list が 132 行ちょうど（省略・「他多数」表記なし）
- [ ] 件数集計が `41 + 4 + 38 + 49 = 132` を満たす
- [ ] `routes/auth/session-resolve.test.ts` を contract に分類した根拠が明記されている
- [ ] 既存 `.contract.test.ts` / `.diagnostics.test.ts` / `.verify.test.ts` の取り扱い方針が記述されている
- [ ] 既存 glob inventory の抽出コマンドと同期対象ファイルが列挙されている
- [ ] 命名衝突調査の 3 コマンドと期待結果が定義されている
