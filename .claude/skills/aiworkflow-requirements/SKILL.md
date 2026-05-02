---
name: aiworkflow-requirements
description: |
  ubm-hyogo Webアプリの正本仕様を `references/` から検索・参照・更新するスキル。`resource-map` / `quick-reference` / `topic-map` / `keywords` を起点に必要最小限だけ読む。用途は要件確認、設計・API契約確認、UI/状態管理/セキュリティ判断、`task-workflow` / `lessons-learned` / 未タスク同期。主要対象は Cloudflareデプロイ、Webアプリアーキテクチャ、インテグレーションパッケージ（packages/integrations/）、ブランチ戦略（feature/dev/main）、シークレット管理（CF/GitHub/1Password）、認証、スキルライフサイクル、UI設計、セキュリティ要件。Anchors: Specification-Driven Development, Progressive Disclosure。Trigger: 仕様確認、仕様更新、task-workflow同期、lessons-learned同期、API契約確認、セキュリティ要件確認、Cloudflare、Pages、Workers、D1、R2、r2_buckets、KV、デプロイ、認証、スキルライフサイクル、UI設計、データベース設計、RAG、検索、インテグレーション、ブランチ戦略、シークレット管理、Secrets、Variables、environment-scoped、repository-scoped、配置決定マトリクス、1Password 正本、GitHub 派生コピー、ストレージ、presigned URL、オブジェクトストレージ、legacy umbrella close-out、stale-current classification。
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
---

# ubm-hyogo Requirements Manager

## 概要

ubm-hyogo Web アプリプロジェクトの全仕様を管理するスキル。
**このスキルが仕様の正本**であり、references/ 配下のドキュメントを直接編集・参照する。

## 変更履歴

| Version | Date | Changes |
| --- | --- | --- |
| v2026.05.02-ut07b-fu03-production-migration-runbook | 2026-05-02 | UT-07B-FU-03 production migration apply runbook を `spec_created / requirements-operations-runbook / NON_VISUAL` として同期。`docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/`、artifact inventory、lessons learned、quick-reference / resource-map / topic-map / task-workflow-active / LOGS を登録し、`apps/api/migrations/0008_schema_alias_hardening.sql` の production apply は未実行であり D1 production state 正本を上書きしない境界を明確化。 |
| v2026.05.02-06a-a-real-workers-d1-smoke-execution | 2026-05-02 | 06a-A public web real Workers/D1 smoke execution successor sync。旧 `06a-followup-001` を historical/design canonical、新 `docs/30-workflows/06a-A-public-web-real-workers-d1-smoke-execution/` を current execution canonical とし、`spec_created / implementation-spec / docs-only / VISUAL_ON_EXECUTION`、Phase 1-12 documentation/spec deliverables completed、Phase 13 pending_user_approval、root/outputs `artifacts.json` parity、Phase 11 actual evidence pending を quick-reference / resource-map / task-workflow-active / artifact inventory / topic-map / keywords に同期。 |
| v2026.05.01-route-inventory-design-workflow-sync | 2026-05-01 | UT-06-FU-A route inventory script design close-out を同期。新 design workflow root、consumed pointer、open implementation follow-up を quick-reference / resource-map / task-workflow-active / parent artifact inventory へ分離登録し、実 command / output path の正本昇格は implementation follow-up 完了時に延期する境界を明確化。 |
| v2026.05.01-04b-followup-004-admin-queue-resolve-workflow | 2026-05-01 | 04b-followup-004 admin queue resolve workflow sync。`GET /admin/requests` / `POST /admin/requests/:noteId/resolve`、apps/web `/admin/requests`、approve/reject state transition、member_status preflight、409 optimistic lock、audit target workaround、VISUAL deferred-to-staging、formal follow-ups を api/client/manual specs / indexes / task-workflow-active / lessons に同期。 |
| v2026.05.01-03a-stablekey-literal-lint-enforcement | 2026-05-01 | 03a stableKey literal lint enforcement review sync。workflow を `spec_created` から `enforced_dry_run` に再分類し、standalone `scripts/lint-stablekey-literal.mjs` / focused tests / warning-mode lint chain / strict-mode fail evidence / root-output artifacts parity / consumed legacy unassigned を正本化。fully enforced は 147 legacy violations cleanup + strict CI gate 後に限定し、follow-up 2 件を formalize。 |
| v2026.05.01-05b-b-magic-link-callback-credentials-sync | 2026-05-01 | 05b-B Magic Link callback / Auth.js Credentials Provider を `implemented-local / implementation / NON_VISUAL` として同期。`apps/web/app/api/auth/callback/email/route.ts`、`apps/web/src/lib/auth/verify-magic-link.ts`、`apps/web/src/lib/auth.ts` の Credentials Provider `id=\"magic-link\"`、focused tests、typecheck / boundary evidence を正本索引へ反映し、dev-server curl / staging smoke は 09a 系 runtime evidence に委譲。 |
| v2026.05.01-ut02a-attendance-profile-closeout | 2026-05-01 | UT-02A attendance profile integration close-out sync。`MemberProfile.attendance` read path を `createAttendanceProvider().findByMemberIds()` として正本化し、80-id chunk / `member_attendance` + `meeting_sessions` INNER JOIN / `held_on DESC` + `session_id ASC` / session 不在除外 / 重複正規化を quick-reference / resource-map / task-workflow-active / api-endpoints / database-implementation-core / manual specs / lessons / changelog に反映。 |
| v2026.05.01-05b-a-auth-mail-env-contract-alignment | 2026-05-01 | 05b-A Auth mail env contract alignment の implementation-spec-to-skill sync。`MAIL_PROVIDER_KEY` / `MAIL_FROM_ADDRESS` / `AUTH_URL` を manual specs / workflow inventory / quick-reference / resource-map / artifact inventory / LOGS / lessons に同一 wave 同期し、旧 `RESEND_API_KEY` / `RESEND_FROM_EMAIL` / `SITE_URL` は新規 provisioning 禁止の stale manual-spec 名として撤回。Phase 11 readiness と実 Magic Link smoke PASS の境界、および Phase 12 strict 7 files 実体確認を lessons に反映。 |
| v2026.05.01-09b-cron-release-runbook-sync | 2026-05-01 | 09b cron triggers monitoring / release runbook の implementation-spec-to-skill sync。docs-only / spec_created / NON_VISUAL の境界を維持し、cron current facts、legacy hourly cron UT21-U05 委譲、Phase 11 alternative evidence、release / incident / diff plan、artifact inventory、lessons learned、skill feedback promotion routing を same wave で同期。 |
| v2026.05.01-utgov001-references-reflect | 2026-05-01 | task-utgov001-references-reflect-001 execution sync。fresh GitHub GET evidence (`branch-protection-applied-{dev,main}.json`) を入力正本として、branch protection current applied を `references/deployment-branch-strategy.md` に反映。dev/main contexts は `ci`, `Validate Build` の2件、strict は dev=false / main=true、`verify-indexes-up-to-date` は current applied に含めない。Issue #303 は closed のまま `Refs #303`。 |
| v2026.05.01-02c-followup-fixture-prod-build-exclusion | 2026-05-01 | 02c-followup-002 fixture/test production build exclusion implementation sync。`apps/api/tsconfig.build.json`、root `lint:deps` 経由 dep-cruiser gate、`no-prod-to-fixtures-or-tests`、02c 不変条件 #6 三重防御、esbuild substitute evidence、pre-existing `sync-forms-responses.test.ts` failure / wrangler dry-run evidence follow-up を quick-reference / resource-map / task-workflow-active / boundary spec / lessons / LOGS に同期。 |
| v2026.05.01-issue-109-ut02a-tag-queue-management | 2026-05-01 | issue-109 UT-02A tag assignment queue management implementation sync。`tag_assignment_queue` idempotency / retry / DLQ columns、`dlq` status、`<memberId>:<responseId>` idempotency key、admin DLQ filter、same-wave manual specs 08/11/12 update、formal follow-ups（DLQ requeue / retry tick + DLQ audit / pause flag / schemaDiffQueue fakeD1）を quick-reference / resource-map / task-workflow-active に同期。 |
| v2026.05.01-adr-deploy-target-decision-sync | 2026-05-01 | UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION の Phase 12 skill feedback を反映。ADR / deploy target decision は decision record だけで閉じず、parent docs / indexes / task-workflow / artifact inventory / LOGS / backlog / lessons を同一 wave で同期し、現状・将来・根拠の表で topology drift と stale contract withdrawal を明示する運用を `spec-guidelines.md` に追加。 |
| v2026.05.01-07c-audit-log-browsing-ui | 2026-05-01 | 07c Follow-up 003 Audit Log Browsing UI close-out sync。`GET /admin/audit` と `/admin/audit` read-only UI、UTC query + JST display、cursor pagination、PII masking二段防御、raw JSON非公開、Phase 11 visual evidence 7件、09a staging E2E委譲を current canonical set / task-workflow-active / lessons / artifact inventory / changelog に同期。 |
| v2026.05.01-issue106-admin-notes-regression-sync | 2026-05-01 | issue-106 admin_member_notes repository regression close-out sync。既存 `apps/api/src/repository/adminNotes.ts` を canonical owner とし、重複 `adminMemberNotes.ts` は作らない境界、`listByMemberId` の member_id filter / empty array / `created_at DESC`、admin note mutation の `audit_log` append、admin detail audit は `audit_log` 由来で `admin_member_notes` と混同しない方針を workflow inventory / task-workflow-active / lessons / artifact inventory に同期。 |
| v2026.05.01-ut-cicd-drift-impl-observability-matrix-sync | 2026-05-01 | UT-CICD-DRIFT-IMPL-OBSERVABILITY-MATRIX-SYNC same-wave sync。05a `observability-matrix.md` を対象 5 workflow へ同期し、workflow file / display name / trigger / job id / required status context を分離。required context は UT-GOV-001 / UT-GOV-004 confirmed 値（`ci` / `Validate Build` / `verify-indexes-up-to-date`）を正とし、`workflow / job` 形式と混同しない方針を quick-reference / resource-map / task-workflow-active / lessons に反映。 |
| v2026.05.01-ut-07a-02-resolve-contract | 2026-05-01 | UT-07A-02 search-tags resolve contract follow-up close-out sync。`POST /admin/tags/queue/:queueId/resolve` body の正本を `packages/shared/src/schemas/admin/tag-queue-resolve.ts` の shared schema SSOT に昇格し、apps/api route / apps/web admin client / manual spec `12-search-tags.md` / `references/api-endpoints.md` / `references/architecture-admin-api-client.md` を同一 wave 同期。`indexes/resource-map.md` / `indexes/quick-reference.md` / `references/task-workflow-active.md` / `references/lessons-learned-07a-tag-queue-resolve-2026-04.md` / `references/lessons-learned.md` / tracked changelog `changelog/20260501-ut-07a-02-search-tags-resolve-contract-followup.md` に反映。active root から `completed-tasks/` への path move は `legacy-ordinal-family-register.md` に登録。未タスク `UT-07A-02` は consumed、UT-07A-03 staging smoke は継続。 |
| v2026.04.30-fix-cf-account-id-vars | 2026-04-30 | FIX-CF-ACCT-ID-VARS-001 close-out sync。GitHub Actions の `CLOUDFLARE_ACCOUNT_ID` 参照を Repository Variable（`${{ vars.CLOUDFLARE_ACCOUNT_ID }}`）として正本化し、`deployment-gha.md` / `deployment-secrets-management.md` / `environment-variables.md` / `deployment-details.md` / `quick-reference.md` / manual specs / `CLAUDE.md` を同期。Phase 11 は NON_VISUAL evidence（grep + gh api）で記録し、actionlint / yamllint はローカル未導入のため deferred。未タスク `U-FIX-CF-ACCT-01` / `U-FIX-CF-ACCT-02` を formalize。 |
| v2026.04.30-ut06-fu-a-prod-route-secret-close-out | 2026-04-30 | UT-06-FU-A-PROD-ROUTE-SECRET-001 close-out sync。workflow root を `docs/30-workflows/completed-tasks/` 配下に移動したのに伴い、`indexes/quick-reference.md` / `indexes/resource-map.md` / `references/deployment-cloudflare-opennext-workers.md` / `references/task-workflow-active.md` のパス drift を補正し、status を `completed / Phase 1-12 完了 / Phase 13 pending_user_approval` に昇格。`references/lessons-learned-ut06-fu-a-prod-route-secret-2026-04.md`（L-UT06FUA-001〜007）と `references/workflow-ut-06-fu-a-prod-route-secret-001-artifact-inventory.md` を新規追加し、`indexes/topic-map.md` / `indexes/keywords.json` / `references/lessons-learned.md` hub にエントリ追加。`LOGS/20260430-ut06-fu-a-prod-route-secret-close-out.md` 新規。 |
| v2026.04.30-ut06-prod-preflight-review | 2026-04-30 | UT-06-FU-A production route / secret / observability preflight review sync。`references/deployment-cloudflare-opennext-workers.md` に workflow-local runbook 導線、production preflight 境界、route inventory / Logpush target diff automation follow-up を追加。 |
| v2026.04.30-ut21-forms-sync-closeout | 2026-04-30 | UT-21 Sheets→D1 sync endpoint / audit logging を legacy umbrella として close-out。現行正本を Forms sync（`forms.get` / `forms.responses.list`、`POST /admin/sync/schema` / `POST /admin/sync/responses`、`sync_jobs` ledger、`apps/api/src/jobs/sync-forms-responses.ts` + `apps/api/src/sync/schema/*`）へ固定し、単一 `POST /admin/sync` / `GET /admin/sync/audit` / `sync_audit_logs` / `sync_audit_outbox` は新設しない方針を `references/task-workflow.md` と indexes に同期。audit table 要否・実環境 smoke・実装パス境界は UT21-U02/U04/U05 に分離。 |
| v2026.05.01-09a-staging-smoke-spec-sync | 2026-05-01 | 09a staging deploy smoke + Forms sync validation の implementation-spec-to-skill sync。旧 root `docs/30-workflows/02-application-implementation/09a-...` から current semantic root `docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/` への path realignment、Phase 11 `NOT_EXECUTED` placeholder を実測 PASS と扱わない境界、09c production gate、root/outputs `artifacts.json` parity、実 staging 実行 follow-up `UT-09A-EXEC-STAGING-SMOKE-001` を `resource-map` / `quick-reference` / `task-workflow-active` / artifact inventory / lessons / LOGS / legacy register に同期。 |
| v2026.04.30-08b-playwright-scaffold-boundary | 2026-04-30 | 08b Playwright E2E / UI acceptance scaffold の Phase 12 review sync。`scaffolding-only` / `VISUAL_DEFERRED` を正本化し、skipped spec・placeholder screenshot/axe evidence・manual workflow を実行済み PASS と扱わない境界を `references/testing-playwright-e2e.md` / `references/task-workflow-active.md` / indexes に同期。full execution は `docs/30-workflows/unassigned-task/task-08b-playwright-e2e-full-execution-001.md` に formalize。 |
| v2026.04.30-u-ut01-09-retry-offset | 2026-04-30 | U-UT01-09 retry / offset policy docs-only close-out sync。legacy Sheets→D1 sync の retry max=3、backoff base 1s / cap 32s / jitter ±20%、`processed_offset` chunk index を `quick-reference.md` / `resource-map.md` / `database-schema.md` / `task-workflow-active.md` に同期。実装反映は UT-09、物理 ledger は U-UT01-07 へ委譲し、現行 Forms sync 契約は上書きしない。 |
| v2026.04.30-06a-followup-real-workers-d1-smoke | 2026-04-30 | 06a public web real Workers/D1 smoke follow-up を spec_created / implementation / NON_VISUAL として workflow inventory に登録。4 route family / 5 smoke cases、Cloudflare deployed vars 正本の `PUBLIC_API_BASE_URL` 確認、root / outputs artifacts parity、元 unassigned task 昇格状態を同期。runtime runbook / D1 docs 反映は executed close-out と同一 wave で実施する境界を明確化。 |
| v2026.04.30-ut-06b-profile-logged-in-visual-evidence-spec-created | 2026-04-30 | UT-06B `/profile` logged-in visual evidence spec_created sync。新規 canonical workflow `docs/30-workflows/ut-06b-profile-logged-in-visual-evidence/` を Phase 1-13 で formalize し、legacy stub `docs/30-workflows/completed-tasks/UT-06B-PROFILE-VISUAL-EVIDENCE.md` を canonical へ昇格（Canonical Status 見出し追加 + register 登録）。`apps/web/src/__tests__/static-invariants.test.ts` の S-04 read-only invariant に `<button type="submit">` 検出を追加。`references/lessons-learned-06b-profile-logged-in-visual-evidence-2026-04.md`（L-06B-001〜005）新規。`indexes/resource-map.md` を独立 row 化し、`indexes/quick-reference.md` / `indexes/topic-map.md` / `references/task-workflow-active.md` / `references/legacy-ordinal-family-register.md` / LOGS を同 wave 同期。Phase 11 visual evidence captured は 09a staging deploy smoke 成立後に解放（external_gate）。 |
| v2026.04.30-issue-191-schema-aliases | 2026-04-30 | issue-191 docs-only closeout sync。`schema_aliases` 正本テーブル、07b `POST /admin/schema/aliases` の書き込み先差し替え、03a alias-first lookup + `schema_questions.stable_key` fallback、fallback retirement 条件を `database-implementation-core.md` に反映。07b 既存仕様に supersession note を追加し、A/B/C follow-up を unassigned-task として materialize。 |
| v2026.04.30-phase12-legacy-umbrella-entry | 2026-04-30 | Phase 12 legacy umbrella close-out / stale-current classification を trigger に追加。旧 filename がある場合は `references/legacy-ordinal-family-register.md`、成果物台帳は `references/workflow-*-artifact-inventory.md`、current canonical set は `indexes/resource-map.md` を同一 wave で確認する。 |
| v2026.04.30-07b-schema-alias-assignment | 2026-04-30 | 07b schema alias assignment close-out sync。`GET /admin/schema/diff` の `recommendedStableKeys`、`POST /admin/schema/aliases` dryRun/apply、`schema_questions` revision-scoped stableKey 更新、`response_fields` `__extra__:<questionId>` back-fill、deleted member skip、`audit_log.action='schema_diff.alias_assigned'`、`queued/resolved` status を `references/api-endpoints.md` / `references/database-schema.md` / `indexes/quick-reference.md` / `indexes/resource-map.md` / `references/task-workflow-active.md` に同期。大規模 back-fill / UNIQUE index / retryable HTTP mapping は `UT-07B-schema-alias-hardening-001` に分離。 |
| v2026.04.30-utgov001-second-stage-reapply | 2026-04-30 | UT-GOV-001 second-stage reapply spec_created sync。UT-GOV-004 confirmed contexts (`ci`, `Validate Build`, `verify-indexes-up-to-date`) を消費し、dev / main branch protection の `required_status_checks.contexts` を Phase 13 user approval 後に再 PUT する workflow を登録。GitHub GET を最終正本とし、aiworkflow-requirements references への最終状態反映は Phase 13 applied evidence 後の `task-utgov001-references-reflect-001` に分離。 |
| v2026.04.29-ut28-pages-projects | 2026-04-29 | UT-28 Cloudflare Pages projects creation `spec_created` close-out sync。`deployment-cloudflare.md` に production=`ubm-hyogo-web` / staging=`ubm-hyogo-web-staging`、branch main/dev、`compatibility_date=2025-01-01`、`nodejs_compat`、Pages Git Integration OFF、OpenNext output-form blockerを追加。`deployment-gha.md` / `deployment-secrets-management.md` に `CLOUDFLARE_PAGES_PROJECT=ubm-hyogo-web`（suffixなし）を同期。`references/lessons-learned-ut-28-cloudflare-pages-projects-2026-04.md`（L-UT28-001〜005）新規。`quick-reference.md` / `task-workflow-backlog.md` / `LOGS/_legacy.md` を更新。 |
| v2026.04.30-07a-tag-queue-resolve | 2026-04-30 | 07a tag assignment queue resolve close-out sync。`POST /admin/tags/queue/:queueId/resolve` の discriminated union body（confirmed/rejected）、`queued/reviewing -> resolved/rejected` guarded update、`candidate/confirmed` 仕様語と `queued/resolved` 実装語の alias、admin web client `resolveTagQueue(queueId, body)`、`/admin/tags` rejected filter、`tagCandidateEnqueue` を正本化。`references/lessons-learned-07a-tag-queue-resolve-2026-04.md`（L-07A-001〜005）新規、`references/lessons-learned.md` hub・`references/task-workflow-active.md`・`indexes/resource-map.md`・`indexes/quick-reference.md`・manual specs 08/12 を同 wave 同期。未タスク `UT-07A-01`〜`UT-07A-04` を `docs/30-workflows/unassigned-task/` に formalize。legacy rename は無いため `legacy-ordinal-family-register.md` 更新なし。 |
| v2026.04.29-06c-admin-ui-close-out | 2026-04-29 | 06c-parallel-admin-dashboard-members-tags-schema-meetings-pages close-out sync。Next.js App Router `(admin)` route group 5 画面（`/admin` dashboard / members / tags / schema / meetings）と `apps/web/src/lib/admin/{server-fetch.ts, api.ts}` + `/api/admin/[...path]` proxy を正本化（apps/web から D1 / apps/api repository 直接 import 禁止は `scripts/lint-boundaries.mjs` + boundary unit test で代替検証）。`PATCH /admin/members/:memberId/profile` / `PATCH /admin/members/:memberId/tags` 不在は `MemberDrawer` の input 不在 assertion で構造保証。Phase 11 実 screenshot は D1 fixture / staging admin 前提のため未取得、08b Playwright E2E / 09a staging smoke へ VISUAL_DEFERRED。今回 wave で `references/lessons-learned-06c-admin-ui-2026-04.md`（L-06C-001〜005: VISUAL_DEFERRED 委譲判断 / ESLint 正式導入分離 / Server vs Client fetch 責務分離 / profile・タグ直編集 UI 不採用 / nested resource 404 vs 409 vs 422 toast 分離）を新規作成し、`references/lessons-learned.md` hub・`references/task-workflow-active.md`・`indexes/quick-reference.md`・`indexes/resource-map.md` を同 wave 同期。`apps/api/src/routes/admin/meetings.ts` は `/admin/meetings` 応答に attendance summary 同梱で 06c UI の重複 disabled 初期表示を成立させる差分のみ反映。 |
| v2026.04.29-ut09-direction-reconciliation | 2026-04-29 | UT-09 direction reconciliation Phase 12 review sync。A 維持（Forms 分割方針）でも、`api-endpoints` / `deployment-cloudflare` / `environment-variables` / runtime mount / cron に Sheets 系 stale contract が残る場合は Step 2 を「stale 撤回」として発火させる。`docs/30-workflows/ut09-direction-reconciliation/` に 10 follow-up（B-01〜B-10、B-10 runtime kill-switch 追加）を記録。今回 wave で `references/lessons-learned-ut09-direction-reconciliation-2026-04.md`（L-UT09-001〜006: stale 撤回 Step 2 発火 / direction_owner ownership 宣言 / 実測 vs 記述 PASS 分離 / docs-only spec_created closeout / 30 種思考法分割 PASS 不可 / runtime kill-switch 前段化 + OP-UT09-1/2 運用ルール）を新規作成し、`references/lessons-learned.md` hub を同 wave 同期。 |
| v2026.04.29-ut06-fu-a-opennext-workers | 2026-04-29 | UT-06-FU-A apps/web OpenNext Workers 移行を反映（deployment-cloudflare-opennext-workers.md 新設, lessons-learned 追加） |
| v2026.04.30-u04-sheets-d1-sync | 2026-04-30 | U-04 Sheets→D1 sync implementation Phase 12 close-out sync。`apps/api/src/sync/` manual / scheduled / backfill / audit route、`POST /admin/sync/run` / `POST /admin/sync/backfill` / `GET /admin/sync/audit`、Cron `0 * * * *`、`SYNC_ADMIN_TOKEN` Bearer、`sync_job_logs` audit ledger、`sync_locks` mutex、Workers `crypto.subtle` Sheets client を正本化。generated index と LOGS fragment の N/A 誤判定を lessons に記録。 |
| v2026.04.29-ut-04-d1-schema-design | 2026-04-29 | UT-04 D1 データスキーマ設計 spec_created sync。`docs/30-workflows/ut-04-d1-schema-design/` Phase 1-12 を docs-only / NON_VISUAL / spec_created として同期し、current canonical 6 テーブル（`member_responses` / `member_identities` / `member_status` / `response_fields` / `schema_diff_queue` / `sync_jobs`）を確定。`references/database-schema.md` に DDL 同期テンプレ導線を追加し、詳細テンプレを `references/database-schema-ddl-template.md`、インデックス一覧を `references/database-indexes.md` に責務分離。`lessons-learned/lessons-learned-ut-04-d1-schema-design-2026-04.md`（L-UT04-001〜007）新規。`references/lessons-learned.md` hub / `references/task-workflow-active.md` / `indexes/resource-map.md` / `indexes/quick-reference.md` / `indexes/topic-map.md` / `keywords.json` / LOGS を同一 wave で更新。実 DDL migration は後続実装タスクに分離し、Phase 13 はユーザー承認待ち。 |
| v2026.04.29-ut-cicd-drift | 2026-04-29 | UT-CICD-DRIFT (`docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-cleanup/`) Phase 1-12 spec_created 同期。`.github/workflows/*.yml` 5 件を current facts として `references/deployment-gha.md` / `references/deployment-cloudflare.md` / `references/deployment-core.md` / `references/deployment-secrets-management.md` に反映。Node 24 / pnpm 10.33.2、`validate-build.yml` / `verify-indexes.yml`、Pages 運用中 + OpenNext Workers cutover 未了、Discord 通知未実装、cron 3 件を正本化。impl 必要差分は `UT-CICD-DRIFT-IMPL-*` へ分離し、indexes は `generate-index.js` で再生成。 |
| v2026.04.29-ut-27-github-secrets-variables | 2026-04-29 | UT-27 (`docs/30-workflows/completed-tasks/ut-27-github-secrets-variables-deployment/`) Phase 1-13 spec_created 同期。`references/deployment-gha.md`（配置決定マトリクス 4 件 + API Token 命名規則 `ubm-hyogo-cd-{env}-{yyyymmdd}`）/ `references/deployment-secrets-management.md`（1Password 正本・派生コピー運用 + `op read` + 一時環境変数 + `unset` 同期パターン + 同名併存禁止 + 最小スコープ + rollback 3 経路）/ `references/environment-variables.md`（CI/CD 環境セクション）に反映。`indexes/topic-map.md` / `keywords.json` / `resource-map.md`（workflow inventory に UT-27 行追加）/ `quick-reference.md`（UT-27 即時導線 + 配置層判定行）も同一 wave で更新。`lessons-learned/lessons-learned-ut-27-github-secrets-variables-2026-04.md`（L-UT27-001〜006）新規。実 secret 配置と実 dev push trigger は Phase 13 ユーザー承認後の別オペレーションに分離。 |
| v2026.04.29-06b-member-login-profile-pages | 2026-04-29 | 06b-parallel-member-login-and-profile-pages close-out sync。apps/web `/login`（AuthGateState 5 状態、Magic Link + Google OAuth、sent email 非表示、safe redirect）と `/profile`（read-only member view model、外部 Google Form edit CTA、D1 直接禁止）を正本索引化。`apps/web/middleware.ts` に `/profile/:path*` session gate を追加。`apps/web/src/lib/{url,fetch,auth}` helper と static invariant tests を登録。Phase 11 local `/login` screenshot + `/profile` redirect curl は captured、logged-in profile / staging visual は `UT-06B-PROFILE-VISUAL-EVIDENCE` に分離。 |
| v2026.04.29-06a-public-web | 2026-04-29 | 06a-parallel-public-landing-directory-and-registration-pages close-out sync。apps/web 公開 4 route（`/`, `/members`, `/members/[id]`, `/register`）、URL query helper（`q/zone/status/tag/sort/density`, `q` max 200）、`fetchPublic`、公開 UI components、Phase 11 curl + screenshot evidence、Phase 12 artifact parity を正本化。`docs/00-getting-started-manual/specs/09-ui-ux.md` / `12-search-tags.md`、`indexes/quick-reference.md`、`indexes/resource-map.md`、`references/task-workflow-active.md` を同 wave 同期。`references/lessons-learned-06a-public-web-2026-04.md`（L-06A-001〜005: route group `(public)` ↔ `app/page.tsx` 衝突 / Next.js 16 `searchParams` Promise / density `comfy・dense・list` 正本化 / zod `catch` + `transform` / `wrangler dev` esbuild mismatch）を新規追加し `references/lessons-learned.md` hub と resource-map 06a 行に参照を反映。`wrangler dev` esbuild mismatch による実 D1 smoke は 08b / 09a へ引き継ぎ。 |
| v2026.04.29-05a-authjs-admin-gate | 2026-04-29 | 05a-parallel-authjs-google-oauth-provider-and-admin-gate close-out sync。Auth.js v5 Google OAuth、`GET /auth/session-resolve`、共有 HS256 JWT session、apps/web `/admin/*` middleware、apps/api `requireAdmin` を正本化。人間向け admin API 9 router は Auth.js JWT + `admin_users.active` 判定へ差し替え、sync 系 `/admin/sync*` は `SYNC_ADMIN_TOKEN` Bearer 維持。`references/api-endpoints.md`、`references/task-workflow-active.md`、`indexes/quick-reference.md`、`indexes/resource-map.md` を同 wave 同期。Phase 11 の実 OAuth screenshot smoke は staging 09a に委譲し、JWT/session-resolve/admin route tests を代替証跡にする。 |
| v2026.04.29-05b-magic-link-auth-gate | 2026-04-29 | 05b Magic Link / AuthGateState close-out sync。`references/api-endpoints.md` §認証 API 05b、`references/environment-variables.md` §Cloudflare Workers / Auth + Magic Link、`references/lessons-learned-05b-magic-link-auth-gate-2026-04.md`、`references/task-workflow-active.md`、`indexes/resource-map.md`、`indexes/quick-reference.md` を同期。Auth.js Credentials Provider 本体と `/api/auth/callback/email` route は 06b 未タスクへ分離。 |
| v2026.04.29-04c-admin-backoffice | 2026-04-29 | 04c-parallel-admin-backoffice-api-endpoints close-out sync。`apps/api/src/routes/admin/` 9 router（dashboard / members / member-status / member-notes / member-delete / tags-queue / schema / meetings / attendance）と `apps/api/src/repository/{dashboard,memberTags}.ts` を正本化。`references/api-endpoints.md` §管理バックオフィス API 04c は Phase 12 で同期済み。今回 wave で `references/lessons-learned-04c-admin-backoffice-2026-04.md`（L-04C-001〜005: tag queue resolve 二段書き込み / nested resource 404 vs 409 / schema alias 状態整合 / Hono 9 router admin gate mount / zod query date 厳格化）を新規作成し、`references/lessons-learned.md` hub・`references/task-workflow-active.md`・`indexes/resource-map.md` を同 wave 同期。LOGS / changelog fragment を追加。`PATCH /admin/members/:memberId/profile` / `PATCH /admin/members/:memberId/tags` 不在は 9 router 分割で構造保証。05a close-out 後は人間向け admin route が Auth.js + `admin_users` active 判定へ差し替え済み。 |
| v2026.04.29-health-db-endpoint | 2026-04-29 | UT-06-FU-H D1 health endpoint Phase 12 close-out 反映。`apps/api/src/index.ts` の `GET /health/db`（`X-Health-Token` 検証 + D1 `SELECT 1` + 401/403/503 境界 + `Retry-After: 30`）と `apps/api/src/health-db.test.ts`（9 ケース）を仕様化。`references/api-endpoints.md` に「UBM-Hyogo Health API（UT-06-FU-H）」セクション追加 / `references/environment-variables.md` に `HEALTH_DB_TOKEN`（1Password 正本・90 日 rotation・漏洩時即時 rotation）を追加 / `references/lessons-learned-ut-06-fu-h-2026-04.md` 新規作成（L-HDBH-001 timing-safe 比較 / L-HDBH-002 401-403 責務分離 / L-HDBH-003 503 fail-closed + Retry-After / L-HDBH-004 token rotation formalize）/ `indexes/resource-map.md` に UT-06-FU-H 行追加 / `indexes/quick-reference.md` に health endpoint 検索行追加 / `indexes/topic-map.md` の api-endpoints / environment-variables 行 offset を更新。実 secret 投入と WAF 設定は Phase 13 ユーザー承認後の別オペレーション。`docs/00-getting-started-manual/specs/01-api-schema.md` §API health contract と双方向同期。`HEALTH_DB_TOKEN` rotation SOP は `docs/30-workflows/unassigned-task/task-ut-06-fu-h-health-db-token-rotation-sop-001.md`（canonical）に分離起票。 |
| v2026.04.29-governance-shortcut | 2026-04-29 | UT-GOV-002 skill-feedback 反映。`indexes/quick-reference.md` に「Governance / Branch Protection 系タスクの Step 2=N/A ショートカット」表（再判定トリガ: OIDC / workflow_run / D1・KV メタデータ参照 / Secret 追加 / RBAC 拡張）と「CLAUDE.md と aiworkflow-requirements の重複正本判定」表（ブランチ戦略 / solo CI gate / Cloudflare CLI / `.env` op / Git hook / Node・pnpm 固定 は CLAUDE.md 一次正本）を追加。references/ 配下は未編集（Step 2=N/A 維持）。 |
| v2026.04.28-claude-code-permissions-hybrid | 2026-04-28 | `task-claude-code-permissions-project-local-first-comparison-001` の比較結論を同期。Claude Code settings は projectLocal 主経路 + global `defaultMode` fallback のハイブリッドを採用し、`--dangerously-skip-permissions` alias 追加は deny 検証完了まで保留。 |
| v2026.04.28-lefthook-mwr-runbook | 2026-04-28 | task-lefthook-multi-worktree-reinstall-runbook spec_created sync。30+ worktree への lefthook 一括再 install runbook を formalize。`lessons-learned-lefthook-mwr-runbook-2026-04.md`（L-MWR-001〜006）新規分離。`lessons-learned.md` ハブ / `task-workflow-active.md` / `LOGS.md` / `quick-reference.md` / `topic-map.md` / `resource-map.md` を同一 wave で更新。`lessons-learned-lefthook-unification-2026-04.md` の baseline B-1 を formalize 完了に更新。 |
| v2026.04.27-r2-storage-spec | 2026-04-27 | UT-12 Cloudflare R2 storage spec_created sync。R2 prod/staging bucket、`R2_BUCKET` binding、private + presigned URL、CORS template、実環境未適用境界を deployment-cloudflare に反映。 |
| v2026.04.26-runtime-foundation | 2026-04-26 | 02-serial-monorepo-runtime-foundation close-out sync。TypeScript 6.x、Next.js 16 + `@opennextjs/cloudflare` Workers 方針、`CLAUDE.md` / technology-backend / architecture-monorepo の stale Pages 記述補正を反映。 |

## クイックスタート

### 仕様を探す

```bash
# キーワード検索（推奨）
node scripts/search-spec.js "認証" -C 5

# または resource-map.md でタスク種別から逆引き
```

### 仕様を読む

1. **まず [resource-map.md](indexes/resource-map.md) を確認** - タスク種別と current canonical set を特定
2. 該当ファイルを `Read` ツールで参照
3. 詳細行番号や完全ファイル一覧が必要な場合は [topic-map.md](indexes/topic-map.md) と `node scripts/list-specs.js --topics` を参照

### 仕様を作成・更新

1. `assets/` 配下の該当テンプレートを使用
2. `references/spec-guidelines.md` と `references/spec-splitting-guidelines.md` を見て、classification-first で更新する
3. 編集後は `node scripts/generate-index.js` を実行

## ワークフロー

```
                    ┌→ search-spec ────┐
user-request → ┼                       ┼→ read-reference → apply-to-task
                    └→ browse-index ───┘
                              ↓
                    (仕様変更が必要な場合)
                              ↓
              ┌→ create-spec ──────────┐
              ┼                         ┼→ update-index → validate-structure
              └→ update-spec ──────────┘
```

## Task 仕様ナビ

| Task | 責務 | 起動タイミング | 入力 | 出力 |
| ---- | ---- | -------------- | ---- | ---- |
| search-spec | 仕様検索 | 仕様確認が必要な時 | キーワード | ファイルパス一覧 |
| browse-index | 全体像把握 | 構造理解が必要な時 | なし | トピック構造 |
| read-reference | 仕様参照 | 詳細確認が必要な時 | ファイルパス | 仕様内容 |
| create-spec | 新規作成 | 新機能追加時 | 要件 | 新規仕様ファイル |
| update-spec | 既存更新 | 仕様変更時 | 変更内容 | 更新済みファイル |
| update-index | インデックス化 | 見出し変更後 | references/ | indexes/ |
| validate-structure | 構造検証 | 週次/リリース前 | 全体 | 検証レポート |

## リソース参照

### 仕様ファイル一覧

See [indexes/resource-map.md](indexes/resource-map.md)（読み込み条件付き）

詳細セクション・行番号: [indexes/topic-map.md](indexes/topic-map.md)

| カテゴリ | 主要ファイル |
| -------- | ------------ |
| 概要・品質 | overview.md, quality-requirements.md |
| アーキテクチャ | **architecture-overview.md**, architecture-patterns.md, arch-\*.md |
| インターフェース | interfaces-agent-sdk.md, llm-\*.md, rag-search-\*.md |
| API 設計 | api-core.md, api-endpoints.md, api-internal-\*.md |
| データベース | database-schema.md, database-implementation.md |
| UI/UX | ui-ux-components.md, ui-ux-design-principles.md, ui-history-\*.md |
| セキュリティ | security-principles.md, csrf-state-parameter.md, security-\*.md |
| 技術スタック | technology-core.md, technology-frontend.md, technology-backend.md |
| Claude Code | claude-code-overview.md, claude-code-skills-\*.md |
| デプロイ・運用 | deployment.md, deployment-cloudflare.md, environment-variables.md |
| ガイドライン | spec-guidelines.md, development-guidelines.md, architecture-implementation-patterns.md |

**注記**: 18-skills.md（Skill 層仕様書）は `skill-creator` スキルで管理。

### scripts/

| スクリプト | 用途 | 使用例 |
| ---------- | ---- | ------ |
| `search-spec.js` | キーワード検索 | `node scripts/search-spec.js "認証" -C 5` |
| `list-specs.js` | ファイル一覧 | `node scripts/list-specs.js --topics` |
| `generate-index.js` | インデックス再生成 | `node scripts/generate-index.js` |
| `validate-structure.js` | 構造検証 | `node scripts/validate-structure.js` |
| `select-template.js` | テンプレート選定 | `node scripts/select-template.js "API仕様"` |
| `split-reference.js` | 大規模ファイル分割 | `node scripts/split-reference.js <file>` |
| `remove-heading-numbers.js` | 見出し番号削除 | `node scripts/remove-heading-numbers.js` |
| `log_usage.js` | 使用状況記録 | `node scripts/log_usage.js --result success` |

### agents/

| エージェント | 用途 | 対応 Task | 主な機能 |
| ------------ | ---- | --------- | -------- |
| [create-spec.md](agents/create-spec.md) | 新規仕様作成 | create-spec | テンプレート対応、重複チェック |
| [update-spec.md](agents/update-spec.md) | 既存仕様更新 | update-spec | テンプレート準拠、分割ガイド |
| [validate-spec.md](agents/validate-spec.md) | 仕様検証 | validate-structure | resource-map 登録確認、サイズ検証 |

### indexes/

| ファイル | 内容 | 用途 |
| -------- | ---- | ---- |
| `quick-reference.md` | キー情報の即時アクセス（推奨・最初に読む） | パターン/型/API 早見表 |
| `resource-map.md` | リソースマップ（読み込み条件付き） | タスク種別 → ファイル |
| `topic-map.md` | トピック別マップ（セクション・行番号詳細） | セクション直接参照 |
| `keywords.json` | キーワード索引（自動生成） | スクリプト検索用 |

> **Progressive Disclosure**: まず resource-map.md でタスクに必要なファイルを特定し、必要なファイルのみを読み込む。

### templates/

新規仕様書作成時のテンプレート。`node scripts/select-template.js` で自動選定可能。

| ファイル | 用途 | 対象カテゴリ |
| -------- | ---- | ------------ |
| `spec-template.md` | 汎用仕様テンプレート | 概要・品質 |
| `interfaces-template.md` | インターフェース仕様 | インターフェース |
| `architecture-template.md` | アーキテクチャ仕様 | アーキテクチャ |
| `api-template.md` | API 設計 | API 設計 |
| `react-hook-template.md` | React Hook | カスタムフック |
| `react-context-template.md` | React Context | 状態管理 |
| `service-template.md` | サービス層 | ビジネスロジック |
| `database-template.md` | データベース仕様 | データベース |
| `ui-ux-template.md` | UI/UX 仕様 | UI/UX |
| `security-template.md` | セキュリティ仕様 | セキュリティ |
| `testing-template.md` | テスト仕様 | テスト戦略 |

> **注記**: 詳細は templates/ 配下を直接参照。追加テンプレートが必要な場合は `agents/create-spec.md` を参照。

### references/（ガイドライン）

| ファイル | 内容 |
| -------- | ---- |
| `spec-guidelines.md` | 命名規則・記述ガイドライン |
| `spec-splitting-guidelines.md` | 大規模ファイル分割ガイドライン |
| `ui-result-panel-pattern.md` | ResultPanel コンポーネント設計パターン |
| `lessons-learned-skill-wizard-redesign.md` | Skill Wizard Redesign 実装知見 |
| `r2-storage-decision-guide.md` | R2 ストレージ採用案（環境別 2 バケット / 専用 Token / presigned URL）の決定フロー |

### 連携スキル

| スキル | 用途 |
| ------ | ---- |
| `task-specification-creator` | タスク仕様書作成、Phase 12 での仕様更新ワークフロー管理 |

**Phase 12 仕様更新時**: `.claude/skills/task-specification-creator/references/spec-update-workflow.md` を参照

### 運用ファイル

| ファイル | 用途 |
| -------- | ---- |
| `EVALS.json` | スキルレベル・メトリクス管理 |
| `LOGS.md` | 使用履歴・フィードバック記録 |

## ベストプラクティス

### すべきこと

- キーワード検索で情報を素早く特定
- 編集後は `node scripts/generate-index.js` を実行
- 500 行超過時は classification-first で parent / child / history / archive / discovery を同一 wave で分割

### 避けるべきこと

- references/ 以外に仕様情報を分散
- インデックス更新を忘れる
- 詳細ルールを SKILL.md に追加（→ spec-guidelines.md へ）

**詳細ルール**: See [references/spec-guidelines.md](references/spec-guidelines.md)

## 変更履歴

| Version | Date | Changes |
| --- | --- | --- |
| v2026.04.30-08a | 2026-04-30 | 08a-parallel-api-contract-repository-and-authorization-tests partial close-out 同期（resource-map / quick-reference / task-workflow-active / legacy-ordinal-family-register / artifact-inventory / lessons-learned / LOGS / changelog を同一 wave で更新。AC-6 coverage 0.82pt 未達 → UT-08A-01〜06 follow-up 6 本を `unassigned-task/` に formalize。task root path drift `02-application-implementation/08a-...` → `30-workflows/08a-...` を register） |
| v2026.05.01-ut06-fu-a-route-inventory-design | 2026-05-01 | UT-06-FU-A-ROUTE-INVENTORY-SCRIPT-001 design workflow Phase 12 close-out 同期（`references/lessons-learned-ut06-fu-a-prod-route-secret-2026-04.md` に「2026-05 / route-inventory-design 追記」セクション追加 / L-UT06FUA-008〜013: docs-only design の no-op 誤判定分離 / Phase 12 strict 7 files 実体確認 / `InventoryReport` schema SSOT 固定 + `mismatches[]` 統一 / Design GO と runtime GO 分離 / Phase index parity 早期 gate / 30種思考法 4カテゴリ patch 化。`changelog/20260501-ut-06-fu-a-route-inventory-design-close-out.md` 新規作成。`indexes/quick-reference.md` §UT-06-FU-A Production Worker Preflight に design close-out log + design lessons 行追加。`indexes/resource-map.md` の UT-06-FU-A-PROD-ROUTE-SECRET 行に design close-out log を追加。`LOGS/_legacy.md` 最新更新ヘッドライン同期。実 command 昇格 / 親 runbook 追記は IMPL-001 へ委譲。Phase 13 commit / push / PR は user-gated） |
