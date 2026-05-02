# クイックリファレンス

> 最重要情報への即時アクセス
> 詳細は resource-map.md → 該当ファイル を参照

---

### 07c Follow-up 003 Audit Log Browsing UI（2026-05-01）

| 目的 | 参照先 |
| --- | --- |
| 13 Phase 仕様 | `docs/30-workflows/completed-tasks/07c-followup-003-audit-log-browsing-ui/` |
| API 契約 | `references/api-endpoints.md`（`GET /admin/audit`） |
| 管理画面仕様 | `docs/00-getting-started-manual/specs/11-admin-management.md`（`/admin/audit`） |
| 苦戦箇所・教訓 | `references/lessons-learned-07c-audit-log-browsing-ui-2026-05.md` |
| artifact inventory | `references/workflow-task-07c-followup-003-audit-log-browsing-ui-artifact-inventory.md` |
| 実装 | `apps/api/src/routes/admin/audit.ts`, `apps/api/src/repository/auditLog.ts`, `apps/web/app/(admin)/admin/audit/page.tsx`, `apps/web/src/components/admin/AuditLogPanel.tsx` |
| Phase 11 visual evidence | `docs/30-workflows/completed-tasks/07c-followup-003-audit-log-browsing-ui/outputs/phase-11/screenshots/` |
| close-out evidence | `docs/30-workflows/completed-tasks/07c-followup-003-audit-log-browsing-ui/outputs/phase-12/implementation-guide.md` |

---

### UT-21 Forms sync conflict close-out（2026-04-30）

| 目的 | 参照先 |
| --- | --- |
| legacy UT-21 の扱い（Sheets→D1 単一 endpoint / audit table は新設しない） | `docs/30-workflows/ut21-forms-sync-conflict-closeout/outputs/phase-12/implementation-guide.md`, `references/task-workflow.md` |
| 現行 Forms sync 正本 | `apps/api/src/jobs/sync-forms-responses.ts`, `apps/api/src/sync/schema/`, `references/task-workflow.md` |
| 後続判断 | `docs/30-workflows/unassigned-task/task-ut21-sync-audit-tables-necessity-judgement-001.md`, `docs/30-workflows/unassigned-task/task-ut21-phase11-smoke-rerun-real-env-001.md`, `docs/30-workflows/unassigned-task/task-ut21-impl-path-boundary-realignment-001.md` |
| 旧仕様の状態欄 | `docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md` |

---

### CI/CD workflow topology drift（UT-CICD-DRIFT / 2026-04-29）
| 目的 | 参照先 |
| --- | --- |
| CI/CD topology drift 正本 | `references/deployment-gha.md`, `references/deployment-cloudflare.md`, `references/deployment-core.md`, `references/deployment-secrets-management.md` |
| Pages vs Workers deploy target decision | `docs/00-getting-started-manual/specs/adr/0001-pages-vs-workers-deploy-target.md`（ADR-0001 / Workers cutover accepted） |
| OpenNext Workers 詳細仕様 | `references/deployment-cloudflare-opennext-workers.md` |
| 残る実装 task | `docs/30-workflows/unassigned-task/task-impl-opennext-workers-migration-001.md`（`web-cd.yml` Workers deploy 置換 / Cloudflare side cutover / smoke） |
| 決定 workflow | `docs/30-workflows/completed-tasks/ut-cicd-drift-impl-pages-vs-workers-decision/` |

---
### Issue #112 API Worker Env 型 SSOT（2026-05-01）

`apps/api/src/env.ts` の `Env` interface を API Worker binding 型の正本とする。`apps/api/wrangler.toml` の `DB` / `SHEET_ID` / `GOOGLE_FORM_ID` / `SHEETS_SPREADSHEET_ID` / `SYNC_*` などの vars と Cloudflare Secrets は、binding 追加・変更時に `Env` と同一 wave で同期する。`_shared/db.ts` の `ctx()` は `Pick<Env, "DB">` を受け取り、`apps/web` から `apps/api/src/env` への import は boundary lint が raw token と relative path 解決の両方で遮断する。

| 目的 | 参照先 |
| --- | --- |
| workflow root / Phase 12 close-out | `docs/30-workflows/issue-112-02c-followup-api-env-type-helper/` |
| 実装 | `apps/api/src/env.ts`, `apps/api/src/repository/_shared/db.ts`, `scripts/lint-boundaries.mjs` |
| 02c consumer guide | `docs/30-workflows/completed-tasks/02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary/outputs/phase-12/implementation-guide.md` |
| D1 / Cloudflare manual pointer | `docs/00-getting-started-manual/specs/08-free-database.md` |

---
### 06a Public Web Real Workers/D1 Smoke（2026-04-30）

06a の mock API smoke では検出できなかった Workers runtime / D1 binding / `PUBLIC_API_BASE_URL` 経路を、follow-up 仕様として local + staging の二段 smoke に分離する。

| 目的 | 参照先 |
| --- | --- |
| 13 Phase 仕様 | `docs/30-workflows/completed-tasks/06a-followup-001-public-web-real-workers-d1-smoke/` |
| execution successor | `docs/30-workflows/06a-A-public-web-real-workers-d1-smoke-execution/` |
| 元未タスク（昇格済み trace） | `docs/30-workflows/completed-tasks/task-06a-followup-001-real-workers-d1-smoke.md` |
| artifact inventory | `references/workflow-task-06a-followup-001-real-workers-d1-smoke-artifact-inventory.md` |
| execution artifact inventory | `references/workflow-task-06a-A-public-web-real-workers-d1-smoke-execution-artifact-inventory.md` |
| 親 06a | `docs/30-workflows/completed-tasks/06a-parallel-public-landing-directory-and-registration-pages/` |
| smoke route family | `/`, `/members`, `/members/[id]`, `/register` |
| evidence 方針 | actual evidence 実体は execution successor 側、旧 follow-up と親 06a へは相対リンク trace のみ |
| Issue | `Refs #273` のみ、CLOSED 維持 |

---
### UT-06-FU-E D1 Backup Long-Term Storage（2026-05-01）

UT-06 Phase 12 UNASSIGNED-E を `spec_created` / docs-only / NON_VISUAL workflow として formalize。日次 D1 export は GHA schedule を主経路、Cloudflare cron triggers を R2 latest healthcheck として併用する。R2 30日 + 月次保存、暗号化、UT-08 alert、復元机上演習を実装 PR 前の正本仕様に固定する。

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/` |
| Phase 12 実装ガイド | `docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/outputs/phase-12/implementation-guide.md` |
| Phase 11 NON_VISUAL placeholder | `docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/outputs/phase-11/`（`NOT_EXECUTED`; runtime PASS ではない） |
| 正本反映先 | `references/deployment-cloudflare.md`, `references/database-operations.md` |
| 上流 evidence | `docs/30-workflows/completed-tasks/ut-06-production-deploy-execution/outputs/phase-05/d1-backup-evidence.md`, `docs/30-workflows/completed-tasks/ut-06-production-deploy-execution/outputs/phase-09/secret-hygiene-checklist.md`, `docs/30-workflows/completed-tasks/ut-06-production-deploy-execution/outputs/phase-06/rollback-rehearsal-result.md` |
| Issue | `Refs #118` のみ、CLOSED 維持 |

---
### Schema Alias Resolution Contract（issue-191 / 2026-04-30）

07b の alias assignment は endpoint `POST /admin/schema/aliases` を維持しつつ、書き込み先を `schema_questions.stableKey` direct update から `schema_aliases` INSERT へ差し替える。03a は aliases first、miss の場合のみ `schema_questions.stable_key` fallback。

UT-07B schema alias hardening は、この `schema_aliases` write target replacement を上位前提にする。hardening 対象は alias table の DB constraint、back-fill の再開可能化、`backfill_cpu_budget_exhausted` の HTTP 202 retryable continuation、10,000 行 staging evidence である。参照: `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/`, `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-12/implementation-guide.md`, `references/api-endpoints.md`, `references/database-schema.md`。

| 目的 | 参照先 |
| --- | --- |
| 正本 DB 契約 | `references/database-implementation-core.md`（§Schema Alias Resolution Contract） |
| 13 Phase 補完仕様 | `docs/30-workflows/completed-tasks/issue-191-schema-aliases-ddl-and-07b-alias-resolution-wiring/` |
| 07b stale contract 上書き | `docs/30-workflows/completed-tasks/07b-parallel-schema-diff-alias-assignment-workflow/index.md` |
| 実装 follow-up | `docs/30-workflows/unassigned-task/task-issue-191-schema-aliases-implementation-001.md` |
| fallback 廃止 follow-up | `docs/30-workflows/unassigned-task/task-issue-191-schema-questions-fallback-retirement-001.md` |
| direct update guard follow-up | `docs/30-workflows/unassigned-task/task-issue-191-direct-stable-key-update-guard-001.md` |

### Issue #359 Production D1 schema_aliases Apply（2026-05-02）

| 目的 | 参照先 |
| --- | --- |
| approval-gated operation workflow | `docs/30-workflows/completed-tasks/task-issue-191-production-d1-schema-aliases-apply-001/` |
| Phase 12 strict outputs | `docs/30-workflows/completed-tasks/task-issue-191-production-d1-schema-aliases-apply-001/outputs/phase-12/` |
| runtime evidence reservation | `docs/30-workflows/completed-tasks/task-issue-191-production-d1-schema-aliases-apply-001/outputs/phase-13/` |
| production apply command | `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --config apps/api/wrangler.toml --env production` |
| status | `spec_created / implementation / NON_VISUAL / production-operation / Phase 13 blocked_until_user_approval` |

### UT-02A Canonical Section/Field Resolver（Issue #108 / 2026-05-01）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/ut-02a-section-field-canonical-schema-resolution/` |
| 実装 | `apps/api/src/repository/_shared/metadata.ts`, `apps/api/src/repository/_shared/builder.ts` |
| generated baseline | `apps/api/src/repository/_shared/generated/static-manifest.json` |
| shared enum | `packages/shared/src/types/common.ts`, `packages/shared/src/zod/primitives.ts` (`FieldKind=consent/system`) |
| Phase 11 NON_VISUAL evidence | `docs/30-workflows/ut-02a-section-field-canonical-schema-resolution/outputs/phase-11/` |
| Phase 12 guide | `docs/30-workflows/ut-02a-section-field-canonical-schema-resolution/outputs/phase-12/implementation-guide.md` |
| follow-up | `docs/30-workflows/unassigned-task/task-ut02a-canonical-metadata-diagnostics-hardening-001.md` |
| lessons | `lessons-learned/lessons-learned-ut-02a-canonical-schema-resolver-2026-05.md` (L-UT02A-001〜004) |

## よく使うパターン

> **検索パターン集・コードパターン早見は [quick-reference-search-patterns.md](quick-reference-search-patterns.md) に分離**
> 機能・タスク別のキーワード分割、読む順番、IPC/Zustand/Result 等のコードスニペットを収録

### AI Chat / LLM Integration Fix 即時導線（2026-03-21）

| 目的                          | 最初に開くファイル                                                              |
| ----------------------------- | ------------------------------------------------------------------------------- |
| 4タスクの全体像               | `references/workflow-ai-chat-llm-integration-fix.md`                            |
| parent workflow               | `docs/30-workflows/ai-chat-llm-integration-fix/index.md`                        |
| same-wave artifact inventory  | `references/workflow-ai-chat-llm-integration-fix-artifact-inventory.md`         |
| Task 01 canonical root        | `docs/30-workflows/completed-tasks/01-TASK-FIX-CHATVIEW-ERROR-SILENT-FAILURE/`  |
| Task 02 canonical root        | `docs/30-workflows/completed-tasks/02-TASK-FIX-LLM-SELECTOR-INLINE-GUIDANCE/`   |
| ChatView error transport 契約 | `references/llm-ipc-types.md`, `references/error-handling-core.md`              |
| LLM selector / persistence    | `references/ui-ux-llm-selector.md`, `references/arch-state-management-core.md`  |
| Workspace stream error        | `references/llm-streaming.md`, `references/ui-ux-feature-components-details.md` |
| legacy path 逆引き            | `references/legacy-ordinal-family-register.md`                                  |

---

### SkillCenterView → SkillManagementPanel ナビゲーション接続（2026-04-04）

| 目的                              | 最初に開くファイル                                                                                                         |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| secondary CTA 設計 / ViewType 定義 | `references/ui-ux-navigation.md`                                                                                           |
| dock 正規化コード                 | `apps/desktop/src/renderer/App.tsx`                                                                                        |
| コンポーネント実装                | `apps/desktop/src/renderer/views/SkillCenterView/index.tsx`, `apps/desktop/src/renderer/components/skill/SkillManagementPanel.tsx` |
| completed ledger                  | `references/task-workflow-completed.md`                                                                                    |
| 苦戦箇所（same surface return / dock 正規化） | `references/lessons-learned-phase12-workflow-lifecycle.md`                                                      |
| workflow root                     | `docs/30-workflows/skill-center-lifecycle-navigation/`                                                                     |

---

### Skill Wizard Redesign (W2-seq-03a) 参照導線 [2026-04-08完了]

| 目的 | 参照先 |
| --- | --- |
| 全体像 | `docs/30-workflows/skill-wizard-redesign-lane/index.md` |
| タスク仕様書 | `docs/30-workflows/W2-seq-03a-skill-create-wizard/` |
| canonical 6成果物 | `outputs/phase-12/*.md` |
| lessons-learned | `references/lessons-learned-skill-wizard-redesign.md` |
| 完了記録 | `references/task-workflow-completed-recent-2026-04d.md` |
| 後続タスク | W3-seq-04（使用率計装 / trackEvent） |

---

### W3-seq-04（使用率計装 / trackEvent）参照導線 [2026-04-08完了]

| 目的 | 参照先 |
| --- | --- |
| UI実装（trackEvent / 使用率計装）全体像 | `docs/30-workflows/W3-seq-04-usage-tracking/` |
| SkillAnalysis コンポーネント（5計装ポイント実装先） | `references/ui-ux-feature-components-skill-analysis.md` |
| Zustand store（skillCreatorStore / trackEvent） | `references/arch-state-management-skill-creator.md` |
| lessons-learned（trackEvent / 計装パターン） | `references/lessons-learned-w3-usage-tracking-2026-04.md` |
| 完了記録 | `references/task-workflow-completed-recent-2026-04d.md` |

---

### HealthPolicy 移管 / Worktree コンフリクト解消（2026-04-08）

| 目的 | 参照先 |
| --- | --- |
| async hook flush・shared 集約・Phase 12 canonical 教訓（L-HP-001/002/003） | `references/lessons-learned-health-policy-worktree-2026-04.md` |
| merge 戦略・command -v・gitattributes 教訓（L-WC-001/002/003） | `references/lessons-learned-health-policy-worktree-2026-04.md` |
| Zustand store（skillCreatorStore / HealthPolicy） | `references/arch-state-management-skill-creator.md` |
| IPC/Preload 教訓 参照 | `references/lessons-learned-ipc-preload-runtime.md` |

---

### UT-GOV-001 Second-Stage Reapply（contexts 後追い再 PUT / 2026-04-30 / approval-gated NON_VISUAL）

UT-GOV-001 で `contexts=[]` 暫定 fallback を採用したケースに対し、UT-GOV-004 由来の実在 context で dev / main 独立 PUT を行う後追いタスク。Phase 13 は user 承認ゲート + 実 PUT 実行ゲート + PR 作成ゲートの三役。

| 目的 | 参照先 |
| --- | --- |
| canonical task root | `docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/` |
| Phase 13 三役ゲート（user_approval_required=true / 自走禁止 3 項目: 実 PUT・push・PR） | `docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/phase-13.md` |
| rollback payload location（再利用のみ・上書き禁止）| `docs/30-workflows/completed-tasks/UT-GOV-001-github-branch-protection-apply/outputs/phase-05/rollback-payload-{dev,main}.json` |
| admin token op 経路（実値は環境変数で揮発的に渡す / docs に op:// 参照のみ） | `op://Employee/ubm-hyogo-env/GITHUB_ADMIN_TOKEN`（admin scope 必須） |
| 期待 contexts（dev / main 別配列） | `outputs/phase-02/expected-contexts-{dev,main}.json` |
| 適用前 / 適用後 GET 保全 | `outputs/phase-13/branch-protection-{current,applied}-{dev,main}.json` |
| drift 6 値検査（CLAUDE.md / deployment-branch-strategy.md） | `outputs/phase-09/drift-check.md` |
| 苦戦箇所 8 件（typo context / dev-main 片側更新 / admin block / `contexts=[]` 残留 / workflow vs job 名 / dev-main 別 contexts / CLAUDE.md drift 片務化 / 自走禁止）| `references/lessons-learned-utgov001-second-stage-reapply-2026-04.md` |
| Artifact Inventory（13 phases / 入出力契約 / AC-1〜AC-14） | `references/workflow-utgov001-second-stage-reapply-artifact-inventory.md` |
| applied GET reflection（Refs #303） | `docs/30-workflows/completed-tasks/task-utgov001-references-reflect-001/`。fresh GET current applied: dev/main contexts = `ci`, `Validate Build`; strict dev=false / main=true; `verify-indexes-up-to-date` は current applied に含まれない |
| Issue 参照規約 | `Refs #202` のみ採用 / `Closes #202` 禁止 / Issue は CLOSED のまま再オープン禁止 |
| relay 先 | `task-utgov001-references-reflect-001` / `task-utgov001-drift-fix-001`（条件発火）/ `task-utgov-downstream-precondition-link-001` |

---

### Branch Protection Required Status Checks Contexts 同期（UT-GOV-004 / 2026-04-29）

UT-GOV-001 を安全に実行するための前提タスク。確定 contexts の機械可読正本と branch protection 運用ルール 4 項目を集約。

| 目的 | 参照先 |
| --- | --- |
| 機械可読正本（UT-GOV-001 の唯一の apply 入力） | `docs/30-workflows/completed-tasks/ut-gov-004-required-status-checks-context-sync/outputs/phase-08/confirmed-contexts.yml` |
| Phase 1 投入 3 contexts（`ci` / `Validate Build` / `verify-indexes-up-to-date`）と strict 採否（dev=false / main=true） | 同上 `confirmed-contexts.yml` |
| branch protection 運用ルール 4 項目（AC-3 / AC-5 / AC-8 / AC-9） | `outputs/phase-12/system-spec-update-summary.md` §4 |
| lefthook ↔ CI 対応表（同一 pnpm script 規約） | `outputs/phase-05/lefthook-ci-mapping.md`, `outputs/phase-08/lefthook-ci-mapping.md` |
| strict 採否決定根拠（dev / main 別） | `outputs/phase-05/strict-mode-decision.md`, `outputs/phase-09/strict-decision.md` |
| 苦戦箇所 6 件（context 名生成・同名 job・存在しない context・strict トレードオフ・lefthook drift・refactor 名前変更事故） | `references/lessons-learned-ut-gov-004-branch-protection-context-sync.md` |
| Phase 12 close-out 6 成果物 | `outputs/phase-12/{implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md` |
| relay 先 | UT-GOV-001（apply 実行）/ UT-GOV-005（unit-test / integration-test / security-scan / docs-link 新設）/ UT-GOV-007（workflow `name:` drift 自動検出）|
| 関連既存タスク | `docs/30-workflows/completed-tasks/task-github-governance-branch-protection/`（草案 8 contexts は本タスクで上書き確定済み）, `task-git-hooks-lefthook-and-post-merge` |

### Sheets→D1 同期方式定義（UT-01 / 2026-04-29）

Google Sheets を入力源、Cloudflare D1 を canonical store として扱う同期方式の docs-only / NON_VISUAL 設計仕様。実装差分を見落とさないため、既存 `apps/api` 実装との対応表を必ず確認する。

| 目的 | 参照先 |
| --- | --- |
| workflow root / AC / state ownership | `docs/30-workflows/completed-tasks/ut-01-sheets-d1-sync-design/index.md` |
| 同期方式比較（Cron pull 採択） | `docs/30-workflows/completed-tasks/ut-01-sheets-d1-sync-design/outputs/phase-02/sync-method-comparison.md` |
| 手動 / 定期 / バックフィル 3 フロー | `docs/30-workflows/completed-tasks/ut-01-sheets-d1-sync-design/outputs/phase-02/sync-flow-diagrams.md` |
| `sync_log` 論理設計 + 既存 `sync_job_logs` / `sync_locks` 対応表 | `docs/30-workflows/completed-tasks/ut-01-sheets-d1-sync-design/outputs/phase-02/sync-log-schema.md` §9 |
| U-UT01-07 sync log naming reconciliation | `docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/`（spec_created / docs-only / NON_VISUAL）。物理 `sync_job_logs` / `sync_locks` を canonical、`sync_log` は概念名として扱う |
| U-UT01-07 Phase 2 正本4ファイル | `docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/naming-canonical.md`, `docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/column-mapping-matrix.md`, `docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/backward-compatibility-strategy.md`, `docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/handoff-to-ut04-ut09.md` |
| U-UT01-07-FU01 UT-09 canonical sync job receiver | `docs/30-workflows/completed-tasks/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/`（completed / Phase 1-12 完了 / Phase 13 pending_user_approval / docs-only / NON_VISUAL）。UT-09 実装受け皿は `docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md`。実コード・script・hook・CI gate は UT-09 / governance guard へ委譲 |
| Phase 12 未タスク | `docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-12/unassigned-task-detection.md` |
| 既存実装差分 | `apps/api/src/jobs/sync-sheets-to-d1.ts`, `apps/api/migrations/0002_sync_logs_locks.sql` |
| 完了記録 | `references/task-workflow-completed-recent-2026-04d.md` |

### Retry / Offset Policy Alignment（U-UT01-09 / 2026-04-30）

UT-01 の未タスク U-UT01-09 で、legacy Sheets→D1 sync の retry / backoff / resume 方針を canonical 化した。現行 Forms sync 方針は上書きしない。実コード反映は UT-09 追補、物理 ledger / migration は U-UT01-07 へ委譲する。

| 目的 | 参照先 |
| --- | --- |
| workflow root / AC1〜AC6 | `docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/index.md` |
| canonical 決定 | `outputs/phase-02/canonical-retry-offset-decision.md`（retry max 3 / base 1s / factor 2 / cap 32s / jitter ±20% / `processed_offset` chunk index） |
| migration 影響評価 | `outputs/phase-02/migration-impact-evaluation.md` |
| UT-09 実装委譲 | `outputs/phase-05/ut09-handover-runbook.md` |
| quota worst case | `outputs/phase-09/quota-worst-case-calculation.md`（2 req / 100s = 0.4%） |
| Phase 11 NON_VISUAL evidence | `outputs/phase-11/{main,manual-smoke-log,link-checklist}.md` |
| Phase 12 close-out | `outputs/phase-12/main.md`, `outputs/phase-12/system-spec-update-summary.md` |
| 既存実装差分 | `apps/api/src/jobs/sync-sheets-to-d1.ts`（`DEFAULT_MAX_RETRIES=5` は UT-09 で 3 へ変更予定）, `apps/api/migrations/0002_sync_logs_locks.sql`（`processed_offset` 不在） |

### Worktree Environment Isolation（2026-04-28）

worktree 間の暗黙共有・shell state 残留・並列作成競合を防ぐ 4 領域への引き方。

| 検索領域 | 検索パターン例 | 最初に開くファイル |
| --- | --- | --- |
| skill symlink 検出 | `find .claude/skills -type l`、`grep -r "type l" scripts/`、キーワード `skill-symlink-removal` | `references/development-guidelines-details.md` (L197〜)、`references/lessons-learned-health-policy-worktree-2026-04.md` §L-WTI-001 |
| tmux session env / global env 分離 | `tmux show-environment -g`、`tmux show-environment -t <session>`、キーワード `UBM_WT` `tmux-session-scoped-env` `update-environment` | `references/development-guidelines-details.md` (L197〜)、`references/lessons-learned-health-policy-worktree-2026-04.md` §L-WTI-002 |
| lockdir owner metadata | `ls .worktrees/.locks/`、キーワード `gwt-auto-lock` `lockdir` `branch-slug-hash` `exit 75`、`grep "mkdir.*lockdir" scripts/` | `scripts/new-worktree.sh`、`references/lessons-learned-health-policy-worktree-2026-04.md` §L-WTI-003 / §L-WTI-008 |
| shell state reset | キーワード `hash -r` `unset OP_SERVICE_ACCOUNT_TOKEN` `mise trust` `mise exec --`、`git rev-parse --git-path hooks` | `references/development-guidelines-core.md` (L213〜)、`references/lessons-learned-health-policy-worktree-2026-04.md` §L-WTI-007 |

| 目的 | 参照先 |
| --- | --- |
| 全体仕様 | `docs/30-workflows/task-worktree-environment-isolation/` |
| Phase 12 implementation guide（Part 2 が運用ランブック） | `outputs/phase-12/implementation-guide.md` |
| NON_VISUAL Phase 11 ログ3点（`tmux show-environment` / `find -type l` / `exit 75` の固定設計） | `outputs/phase-11/manual-smoke-log.md`、`references/lessons-learned-health-policy-worktree-2026-04.md` §L-WTI-004 |
| spec_created 同期 4 点セット標準（development-guidelines / lessons-learned / task-workflow-active / topic-map+keywords） | `references/lessons-learned-health-policy-worktree-2026-04.md` §L-WTI-006 |
| 横断依存 5 タスクの wave 同期手順 | `references/lessons-learned-health-policy-worktree-2026-04.md` §L-WTI-005 |
| Artifact Inventory | `references/workflow-task-worktree-environment-isolation-artifact-inventory.md` |

---

### Google Sheets API 認証 / Service Account + Web Crypto JWT RS256（UT-03 / 2026-04-29）

`packages/integrations/google/src/sheets/` に Service Account JSON + Web Crypto API（`SubtleCrypto.sign`）で RS256 JWT を生成し、`https://oauth2.googleapis.com/token` へ `urn:ietf:params:oauth:grant-type:jwt-bearer` で交換する access token 取得層。Cloudflare Workers ランタイム互換（Node `crypto` 非依存）。consumer は 03b / 03a の Forms / Sheets 同期 wave。

| 目的 | 最初に開くファイル |
| --- | --- |
| パッケージ責務・モジュール境界（`packages/integrations/google` の export 構造） | `references/architecture-monorepo.md`（§packages/integrations/google） |
| Service Account JSON / scope / spreadsheet ID の env 配置 | `references/environment-variables.md`（§Google Sheets API） |
| Cloudflare Workers Secret 投入手順・JWT 署名・OAuth token endpoint | `references/deployment-cloudflare.md`（§Sheets API Service Account 認証） |
| 公開 API（`getSheetsAccessToken(env)` / `createSheetsTokenSource(env)`）と型（`SheetsAuthEnv` / `SheetsAccessToken`） | `packages/integrations/google/src/sheets/index.ts`, `packages/integrations/google/src/sheets/auth.ts` |
| 関連 env vars | `GOOGLE_SERVICE_ACCOUNT_JSON`（Secret） / `SHEETS_SCOPES`（既定 `https://www.googleapis.com/auth/spreadsheets.readonly`） / `SHEETS_SPREADSHEET_ID` |
| 単体テスト・契約テスト | `packages/integrations/google/src/sheets/auth.test.ts`, `auth.contract.test.ts` |
| Phase 12 spec / consumer wave 受け渡し | `docs/30-workflows/completed-tasks/ut-03-sheets-api-auth-setup/index.md`, `phase-12.md` |
| Wave 状態 | `references/task-workflow-active.md`（§UT-03） |

---

### Forms Response Sync / Cron */15 / sync_jobs ledger（03b / 2026-04-29）

Google Forms `forms.responses.list` を D1 に冪等取り込み、`current_response_id` 切替・consent snapshot・unknown field → schema_diff_queue を一括処理する batch worker の即時導線。

| 目的 | 最初に開くファイル |
| --- | --- |
| 管理 API 契約（`POST /admin/sync/responses`、`fullSync` / `cursor` / 409 二重起動） | `references/api-endpoints.md`（§管理同期 API） |
| D1 スキーマ責務（`member_responses` / `member_identities` / `member_status` / `response_fields` / `schema_diff_queue` / `sync_jobs`） | `references/database-schema.md`（§UBM 会員 Forms 同期テーブル 03b） |
| cron `*/15 * * * *` 設定・JWT 署名・Secret 配置 | `references/deployment-cloudflare.md`（§API Worker cron / Forms response sync 03b） |
| `GOOGLE_FORM_ID` / `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY` / `SYNC_ADMIN_TOKEN` 配置 | `references/environment-variables.md`（§Cloudflare Workers / Google Forms 同期） |
| D1 health endpoint（`GET /health/db`、`X-Health-Token`、`HEALTH_DB_TOKEN`、401/403/503 境界） | `references/api-endpoints.md`（§UBM-Hyogo Health API）, `references/environment-variables.md`（§Cloudflare Workers / Google Forms 同期） |
| 苦戦箇所（per-sync write 200 cap / partial UNIQUE で重複 enqueue 抑止 / submittedAt 同値時 responseId 降順 tie-break / `metrics_json.cursor` ≠ `pageToken`） | `docs/30-workflows/03b-parallel-forms-response-sync-and-current-response-resolver/outputs/phase-12/implementation-guide.md` Part 2 |
| follow-up 責務 8 項目（responseEmail merge / 退会 identity 表示制御 / sync 共通モジュール owner / `member_responses.response_email` UNIQUE DDL 明文化 / 旧 `ruleConsent` lint / per-sync cap 通知 / lock TTL 解除 runbook / E2E fixture） | `docs/30-workflows/unassigned-task/03b-response-sync-followups.md` |
| 全 phase 設計と AC-1〜AC-10 検証 | `docs/30-workflows/03b-parallel-forms-response-sync-and-current-response-resolver/index.md` |

### Cron Monitoring / Release Runbook（09b / 2026-05-01）

09b は docs-only / spec_created / NON_VISUAL の運用 runbook 仕様。runtime 設定変更は行わず、`apps/api/wrangler.toml` の current facts を監視・リリース手順に固定する。

| 目的 | 最初に開くファイル |
| --- | --- |
| 09b workflow root / AC / Phase 一覧 | `docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/index.md` |
| cron current facts と legacy Sheets hourly cron の扱い | `references/deployment-cloudflare.md`（§API Worker cron / Forms response sync 03b）, `docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/phase-02.md` |
| NON_VISUAL Phase 11 evidence | `docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/phase-11.md` |
| Phase 12 runbook / same-wave sync / compliance | `docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/phase-12.md` |
| Phase 13 approval gate / 4 required outputs | `docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/phase-13.md` |
| Direct runbooks | `docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/outputs/phase-12/release-runbook.md`, `docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/outputs/phase-12/incident-response-runbook.md` |
| Artifact inventory / lessons | `references/workflow-task-09b-parallel-cron-triggers-monitoring-and-release-runbook-artifact-inventory.md`, `references/lessons-learned-09b-cron-monitoring-release-runbook-2026-05.md` |

---

### Member Self-Service API / `/me/*` / dev session header（04b / 2026-04-29）

会員本人向け `/me/*` endpoint の即時導線。04b 時点では dev session header だったが、06b-A で Auth.js cookie / Bearer JWT resolver に差し替え済み。

| 目的 | 最初に開くファイル |
| --- | --- |
| API 契約（`GET /me`, `GET /me/profile`, `POST /me/visibility-request`, `POST /me/delete-request` / 禁止: `PATCH /me/profile`、`/me/*` への `:memberId`、GET 系での `notes`/`adminNotes` 露出） | `references/api-endpoints.md`（§UBM-Hyogo Member Self-Service API 04b） |
| `admin_member_notes` request queue（`note_type`: `general` / `visibility_request` / `delete_request`、`request_status`: `pending` / `resolved` / `rejected`、pending 判定は `request_status='pending'`） | `references/database-admin-repository-boundary.md`（§04b member self-service queue） |
| `SessionUser.authGateState` の値域（`active` / `rules_declined` / `deleted`）と spec 整合 | `docs/00-getting-started-manual/specs/04-types.md`, `06-member-auth.md` |
| 再回答更新方針 / `editResponseUrl` / 退会・公開停止申請の MVP 経路 | `docs/00-getting-started-manual/specs/07-edit-delete.md` |
| session resolver（production/staging: Auth.js cookie / Bearer JWT + `AUTH_SECRET`; development only: `x-ubm-dev-session: 1` + `Authorization: Bearer session:<email>:<memberId>`。`ENVIRONMENT` 欠落時は dev token deny） | `docs/30-workflows/06b-A-me-api-authjs-session-resolver/outputs/phase-12/implementation-guide.md` |
| 苦戦知見（`authGateState` enum 文脈分離 / `packages/shared` exports 漏れ / wave 跨ぎ schema 変更宣言 / dev session production guard / 不変条件根拠の集約） | `references/lessons-learned-04b-member-self-service.md`（L-04B-001〜005） |

### UBM-Hyogo Magic Link / AuthGateState API 早見（05b / 2026-04-29）

Magic Link 発行・検証と login gate 判定の即時導線。画面は 06b の責務で、05b は API/NON_VISUAL。

| 項目 | 正本 |
| --- | --- |
| API contract | `references/api-endpoints.md`（§認証 API 05b） |
| env / secrets | `references/environment-variables.md`（`AUTH_URL` / `MAIL_PROVIDER_KEY` / `MAIL_FROM_ADDRESS`） |
| 実装ガイド | `docs/30-workflows/05b-parallel-magic-link-provider-and-auth-gate-state/outputs/phase-12/implementation-guide.md` |
| 05b-B callback / Credentials Provider 実装 | `docs/30-workflows/05b-B-magic-link-callback-credentials-provider/`（implemented-local / implementation / NON_VISUAL / local evidence PASS / staging smoke deferred） |
| 02c follow-up fixture prod build exclusion 仕様 | `docs/30-workflows/02c-followup-002-fixtures-prod-build-exclusion/`（spec_created / NON_VISUAL / runtime 未実行） |
| Phase 11 evidence | `docs/30-workflows/05b-parallel-magic-link-provider-and-auth-gate-state/outputs/phase-11/` |
| 苦戦知見 | `references/lessons-learned-05b-magic-link-auth-gate-2026-04.md`（L-05B-001〜005） |
| Artifact Inventory | `references/workflow-task-05b-parallel-magic-link-provider-and-auth-gate-state-artifact-inventory.md` |

05b-B は `/api/auth/callback/email` と Auth.js Credentials Provider の `apps/web` 実装であり、05b 本体 API の完了証跡とは分けて読む。`GET /api/auth/callback/email`、`verify-magic-link.ts`、Credentials Provider `id="magic-link"`、focused tests、typecheck、boundary check は実装済み。dev-server curl / Auth.js real Set-Cookie / staging smoke は 09a 系 runtime evidence に委譲する。

02c follow-up 002 は `apps/api` の `__fixtures__` / `__tests__` を production build から除外する実装仕様であり、現時点では build config 変更や runtime artifact grep は未実行。実装時は Phase 11 reserved evidence を取得する。

---

### UBM-Hyogo Magic Link / Auth Mail Env Contract Alignment（05b-A / 2026-05-01）

Magic Link メール送信の env 名を、実装と aiworkflow 正本に合わせて `MAIL_PROVIDER_KEY` / `MAIL_FROM_ADDRESS` / `AUTH_URL` に統一する docs-only workflow。

| 項目 | 正本 |
| --- | --- |
| workflow | `docs/30-workflows/05b-A-auth-mail-env-contract-alignment/` |
| env / secrets | `references/environment-variables.md`（`AUTH_URL` / `MAIL_PROVIDER_KEY` / `MAIL_FROM_ADDRESS`） |
| Artifact Inventory | `references/workflow-05b-a-auth-mail-env-contract-alignment-artifact-inventory.md` |
| 苦戦知見 | `references/lessons-learned-05b-a-auth-mail-env-contract-alignment-2026-05.md`（L-05BA-001〜004） |
| Phase 11 readiness | `docs/30-workflows/05b-A-auth-mail-env-contract-alignment/outputs/phase-11/` |
| Phase 12 close-out | `docs/30-workflows/05b-A-auth-mail-env-contract-alignment/outputs/phase-12/` |

---

### UT-28 Cloudflare Pages Projects Creation（2026-04-29 / spec_created）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/ut-28-cloudflare-pages-projects-creation/` |
| production / staging Pages project contract | `references/deployment-cloudflare.md`（UT-28 Cloudflare Pages project creation contract） |
| GitHub Actions variable semantics | `references/deployment-gha.md`（`CLOUDFLARE_PAGES_PROJECT` = `ubm-hyogo-web` only） |
| 苦戦知見 | `references/lessons-learned-ut-28-cloudflare-pages-projects-2026-04.md`（L-UT28-001〜005: production_branch 逆配線 / Variable suffix derivation / Pages Git Integration OFF / compatibility_date 同期 / OpenNext blocker handoff） |
| UT-27 handoff | `docs/30-workflows/completed-tasks/ut-28-cloudflare-pages-projects-creation/outputs/phase-10/handoff-to-ut27.md` |
| Phase 11 NON_VISUAL evidence | `docs/30-workflows/completed-tasks/ut-28-cloudflare-pages-projects-creation/outputs/phase-11/` |
| Phase 12 close-out | `docs/30-workflows/completed-tasks/ut-28-cloudflare-pages-projects-creation/outputs/phase-12/` |
| OpenNext blocker owner | `docs/30-workflows/unassigned-task/task-impl-opennext-workers-migration-001.md` / `UT-05` |

---

### UT-06-FU-A Production Worker Preflight（2026-04-30 / spec_created）

| 項目 | 正本 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/` |
| runbook | `docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/outputs/phase-05/runbook.md` |
| 原典 unassigned | `docs/30-workflows/completed-tasks/UT-06-FU-A-production-route-secret-observability.md` |
| lessons-learned | `references/lessons-learned-ut06-fu-a-prod-route-secret-2026-04.md` |
| artifact inventory | `references/workflow-ut-06-fu-a-prod-route-secret-001-artifact-inventory.md` |
| route inventory design workflow | `docs/30-workflows/ut-06-fu-a-route-inventory-script-001-cloudflare-route-inventory/` |
| route inventory design close-out log | `changelog/20260501-ut-06-fu-a-route-inventory-design-close-out.md` |
| route inventory design lessons | `references/lessons-learned-ut06-fu-a-prod-route-secret-2026-04.md` § 2026-05 / route-inventory-design 追記（L-UT06FUA-008〜013） |
| automation follow-up | `docs/30-workflows/unassigned-task/UT-06-FU-A-route-inventory-script-impl-001.md`, `docs/30-workflows/unassigned-task/UT-06-FU-A-logpush-target-diff-script-001.md` |
| consumed pointer | `docs/30-workflows/unassigned-task/UT-06-FU-A-route-inventory-script-001.md` |
| Logpush target diff script | `docs/30-workflows/ut-06-fu-a-logpush-target-diff-script-001/`（implementation_complete / Phase 1-12 completed / Phase 13 pending_user_approval） |
| Logpush diff command | `bash scripts/cf.sh observability-diff --current-worker ubm-hyogo-web-production --legacy-worker ubm-hyogo-web --config apps/web/wrangler.toml` |
| 対象 Worker | `ubm-hyogo-web-production` |
| 境界 | route / custom domain / secret key / observability target の preflight。production deploy / DNS 切替 / Worker 削除は別承認 |

---

### 09c Production Deploy / Post-release Verification（2026-05-01 / spec_created）

| 項目 | 正本 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/` |
| 種別 | docs-only / spec_created / VISUAL / runtime evidence pending_user_approval |
| runbook | `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-05/production-deploy-runbook.md` |
| Phase 11 template | `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11/` |
| Phase 12 compliance | `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| artifact inventory / legacy alias | `references/workflow-task-09c-serial-production-deploy-and-post-release-verification-artifact-inventory.md`, `references/legacy-ordinal-family-register.md` |
| production execution | `docs/30-workflows/unassigned-task/task-09c-production-deploy-execution-001.md` |
| 境界 | 09c 本体は runbook / evidence template。実 production D1 migration / deploy / tag push / 24h verification は別承認タスクで実行 |

---

### UBM-Hyogo Member Login / Profile Pages 早見（06b / 2026-04-29）

会員向け `/login` と `/profile` の即時導線。API は 04b/05b、session / OAuth は 05a を上流とする。

| 項目 | 正本 |
| --- | --- |
| canonical task root | `docs/30-workflows/06b-parallel-member-login-and-profile-pages/` |
| 実装ガイド | `docs/30-workflows/06b-parallel-member-login-and-profile-pages/outputs/phase-12/implementation-guide.md` |
| login UI | `apps/web/app/login/` |
| profile UI | `apps/web/app/profile/` |
| middleware | `apps/web/middleware.ts`（`/profile/:path*` session gate） |
| URL helpers | `apps/web/src/lib/url/{login-query,login-redirect,login-state,safe-redirect}.ts` |
| API clients | `apps/web/src/lib/fetch/authed.ts`, `apps/web/src/lib/auth/{magic-link-client,oauth-client}.ts` |
| Phase 11 evidence | `docs/30-workflows/06b-parallel-member-login-and-profile-pages/outputs/phase-11/evidence/` |
| Auth.js `/me` session resolver follow-up | `docs/30-workflows/06b-A-me-api-authjs-session-resolver/`（implemented-local / implementation / NON_VISUAL。`apps/api/src/middleware/me-session-resolver.ts` が Auth.js cookie / Bearer JWT を `AUTH_SECRET` で検証し、`apps/api/src/index.ts` の `/me` mount に接続済み。staging / production live smoke は 09a / 09c gate） |
| profile logged-in visual evidence follow-up | `docs/30-workflows/ut-06b-profile-logged-in-visual-evidence/`（Issue #278 / M-08〜M-10, M-14〜M-16） |
| remaining follow-up | `docs/30-workflows/unassigned-task/UT-06B-MAGIC-LINK-RETRY-AFTER.md` |

---

### UI Visual Baseline Drift / dark-mode screenshot stability（2026-04-03）

| 目的                 | 最初に開くファイル                                                                                                                                           |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| dark-mode baseline   | `references/workflow-ui-ux-visual-baseline-drift.md`                                                                                                        |
| workflow root        | `docs/30-workflows/completed-tasks/ut-uiux-visual-baseline-drift-001/`                                                                                      |
| screenshot evidence  | `docs/30-workflows/completed-tasks/ut-uiux-visual-baseline-drift-001/outputs/phase-11/manual-test-result.md`, `docs/30-workflows/completed-tasks/ut-uiux-visual-baseline-drift-001/outputs/phase-11/screenshots/` |
| completed ledger     | `references/task-workflow-completed-ui-ux-visual-baseline-drift.md`                                                                                         |
| lessons / reuse card | `references/lessons-learned-ui-ux-visual-baseline-drift.md`, `references/ui-ux-design-system.md`                                                            |
| same-wave sync       | `references/task-workflow.md`, `indexes/resource-map.md`                                                                                                    |

---

### Runtime Skill Creator Public IPC 即時導線（2026-03-21）

| 目的                      | 最初に開くファイル                                                       |
| ------------------------- | ------------------------------------------------------------------------ |
| public IPC 契約           | `references/api-ipc-agent-core.md`                                       |
| security detail           | `references/security-electron-ipc-details.md`                            |
| registration / DI pattern | `references/architecture-implementation-patterns-details.md`             |
| completed ledger          | `references/task-workflow-completed-ipc-contract-preload-alignment.md`   |
| lessons                   | `references/lessons-learned-auth-ipc-skill-creator-sync-auth-timeout.md` |
| workflow root             | `docs/30-workflows/completed-tasks/runtime-skill-creator-ipc-wiring/`    |

---

### Runtime Skill Creator Workflow Engine Orchestration / Failure Lifecycle（2026-03-26）

| 目的                                                      | 最初に開くファイル                                                                             |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| owner 分離と failure review return                        | `references/architecture-overview-core.md`                                                     |
| facade / engine / transition guard / artifact append 詳細 | `references/arch-electron-services-details-part2.md`                                           |
| public IPC と `execute-plan` failure lifecycle 契約       | `references/api-ipc-system-core.md`                                                            |
| auth / ipc 教訓                                           | `references/lessons-learned-auth-ipc-skill-creator-sync-auth-timeout.md`                       |
| completed ledger                                          | `references/task-workflow-completed.md`                                                        |
| follow-up backlog                                         | `references/task-workflow-backlog.md`                                                          |
| workflow root                                             | `docs/30-workflows/completed-tasks/step-02-seq-task-02-workflow-engine-runtime-orchestration/` |
| failure lifecycle follow-up                               | `docs/30-workflows/completed-tasks/ut-imp-runtime-workflow-engine-failure-lifecycle-001/`      |
| path sync follow-up                                       | `docs/30-workflows/completed-tasks/ut-imp-task-sdk-02-system-spec-and-path-sync-001/`          |

---

### Runtime Skill Creator Execute-plan Fire-and-Forget（2026-04-01）

| 目的                                              | 最初に開くファイル                                                                                     |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| ack + snapshot relay の current facts             | `references/api-ipc-system-core.md`                                                                    |
| security / response contract                      | `references/security-electron-ipc-details.md`                                                         |
| fire-and-forget の owner 分離                     | `references/architecture-overview-core.md`                                                            |
| public IPC / renderer bridge の整合               | `references/api-ipc-agent-core.md`                                                                    |
| completed ledger                                  | `references/task-workflow-completed-ipc-contract-preload-alignment.md`                               |
| follow-up backlog                                 | `references/task-workflow-backlog.md`                                                                 |
| lessons                                           | `references/lessons-learned-ipc-preload-runtime.md`                                                   |
| workflow root                                     | `docs/30-workflows/fix-step3-seq-execute-plan-nonblocking/`                                           |

---

### Runtime Skill Creator Resource Selection Hardening（2026-03-27）

| 目的                                              | 最初に開くファイル                                                                                     |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Task03 実装全体像                                 | `docs/30-workflows/completed-tasks/step-03-par-task-03-context-budget-and-resource-selection/index.md` |
| multi-root / budget / degrade の current contract | `references/interfaces-agent-sdk-skill-reference.md`                                                   |
| service owner と pipeline detail                  | `references/arch-electron-services-details-part2.md`                                                   |
| completed ledger                                  | `references/task-workflow-completed.md`                                                                |
| 苦戦箇所 / provenance 教訓                        | `references/lessons-learned-auth-ipc-skill-creator-sync-auth-timeout.md`                               |

---

### Skill Creator Create Mainline Entry（2026-03-27）

| 目的                           | 最初に開くファイル                                                                                        |
| ------------------------------ | --------------------------------------------------------------------------------------------------------- |
| Task05 の全体像                | `docs/30-workflows/step-04-par-task-05-create-entry-mainline-unification/index.md`                        |
| 一次導線と ViewType 契約       | `references/ui-ux-navigation.md`, `references/workflow-skill-lifecycle-routing-render-view-foundation.md` |
| state owner / handoff 境界     | `references/arch-state-management-core.md`                                                                |
| create 後の downstream journey | `references/workflow-skill-lifecycle-created-skill-usage-journey.md`                                      |
| completed ledger               | `references/task-workflow-completed.md`                                                                   |
| Phase 12 教訓                  | `references/lessons-learned-phase12-workflow-lifecycle.md`                                                |

---

### Skill Creator SDK Event Normalization (TASK-RT-06)

**概要:** SDKMessage → SkillCreatorSdkEvent 変換契約の安定化

| 項目 | 詳細 |
|---|---|
| 型 | `SkillCreatorSdkEvent` (7フィールド), `SkillCreatorSdkEventType` ("init"\|"assistant"\|"result"\|"error") |
| normalizer | `normalizeSdkMessage(msg, sessionId?)`, `normalizeSdkStream(msgs)` |
| IPCチャネル | `skill-creator:normalize-sdk-messages` |
| sessionId伝播 | init → 後続メッセージへ自動伝播 |
| テスト | 32件, Line 99.35% / Branch 91.22% / Function 100% |
| 未タスク | SkillExecutor.convertToStreamMessage()との統合候補（1件） |

---

### Skill Creator Conversation UI（TASK-SDK-SC-02 / 2026-04-03 実装済み）

| 目的                                                 | 最初に開くファイル                                                                                              |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Task02 の全体像・Phase 仕様書                        | `docs/30-workflows/step-02-par-task-02-conversation-ui/index.md`                                                |
| 5 コンポーネント Props API・使用例                   | `docs/30-workflows/step-02-par-task-02-conversation-ui/phase-12-documentation.md`                               |
| アーキテクチャ・型マッピング・IPC 通信フロー         | `outputs/phase-12/implementation-guide.md`                                                                      |
| Session Bridge 型定義                                | `packages/shared/src/types/skillCreatorSession.ts`（`UserInputQuestion` / `UserInputAnswer`）                   |
| Workflow UI 型定義                                   | `packages/shared/src/types/skillCreator.ts`（`SkillCreatorUserInputRequest` / `InterviewUserAnswer`）           |
| IPC チャネル定義                                     | `packages/shared/src/ipc/channels.ts`（`SKILL_CREATOR_SESSION_CHANNELS`）                                      |
| Preload API                                          | `apps/desktop/src/preload/skill-creator-session-api.ts`（`window.skillCreatorSessionAPI`）                      |
| Organism コンポーネント（ブリッジ層）                | `apps/desktop/src/renderer/components/skill-creator/SkillCreatorConversationPanel.tsx`                           |
| テスト（57 件）                                      | `apps/desktop/src/renderer/components/skill-creator/__tests__/`                                                 |
| completed ledger                                     | `references/task-workflow-completed.md`                                                                         |

---

### Skill Creator External API Support（TASK-SDK-SC-03 / 2026-04-03 実装済み）

| 目的                                                    | 最初に開くファイル                                                                      |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| External API IPC チャネル4本の契約                      | `references/api-ipc-system-core.md`（§Skill Creator External API Support）              |
| 型定義（ExternalApiConnectionConfig / AuthType / Error） | `packages/shared/src/types/skillCreatorExternalApi.ts`                                   |
| チャネル定数定義                                         | `packages/shared/src/ipc/channels.ts`（SKILL_CREATOR_EXTERNAL_API_CHANNELS）            |
| credential 秘匿化セキュリティ契約                       | `references/security-electron-ipc-core.md`（§Credential 秘匿化）                       |
| IpcBridge バリデーション / SdkSession custom tool       | `apps/desktop/src/main/services/runtime/SkillCreatorIpcBridge.ts` / `SkillCreatorSdkSession.ts` |
| ExternalApiConfigForm UI                                | `apps/desktop/src/renderer/components/skill/ExternalApiConfigForm.tsx`                   |
| 苦戦箇所5件                                             | `references/lessons-learned-current.md`（§TASK-SDK-SC-03）                              |
| completed ledger                                        | `references/task-workflow-completed.md`                                                  |
| workflow root                                           | `docs/30-workflows/completed-tasks/step-02-par-task-03-external-api-support/`           |

---
### Skill Creator Skill Output Integration（TASK-SDK-SC-04 / 2026-04-04 実装済み）

| 目的                                                          | 最初に開くファイル                                                                                                          |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Skill Output IPC チャネル3本の契約                            | `references/api-ipc-system-core.md`（§Skill Creator Output Integration）                                                    |
| 型定義（SkillOutputReadyPayload / SkillOpenPayload 等）        | `packages/shared/src/ipc/channels.ts`（`SKILL_CREATOR_OUTPUT_CHANNELS`）                                                    |
| チャネル定数定義                                              | `packages/shared/src/ipc/channels.ts`（`SKILL_CREATOR_OUTPUT_READY` / `SKILL_CREATOR_OUTPUT_OVERWRITE_APPROVED` / `SKILL_CREATOR_OPEN_SKILL`） |
| OutputHandler 実装（マーカー検出・SKILL.md抽出・ファイル保存） | `apps/desktop/src/main/services/runtime/SkillCreatorOutputHandler.ts`                                                       |
| SkillRegistry 実装（インメモリ・DI対応）                      | `apps/desktop/src/main/services/runtime/SkillRegistry.ts`                                                                   |
| IpcBridge outputHandler DI 追加                               | `apps/desktop/src/main/services/runtime/SkillCreatorIpcBridge.ts`                                                           |
| Preload onOutputReady() リスナー                              | `apps/desktop/src/preload/skill-creator-api.ts`（`onOutputReady()`）                                                        |
| SkillCreatorResultPanel UI（プレビュー・上書き確認）          | `apps/desktop/src/renderer/components/skill-creator/SkillCreatorResultPanel.tsx`                                            |
| 苦戦箇所4件                                                   | `references/lessons-learned-current.md`（§TASK-SDK-SC-04）                                                                  |
| completed ledger                                              | `references/task-workflow-completed.md`                                                                                      |

---

### execute→SkillFileWriter persist 統合（TASK-P0-05 / 2026-04-05 実装済み）

| 目的                                                          | 最初に開くファイル                                                                                                          |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| persist 統合パイプライン（Step 3.5-3.6）                      | `apps/desktop/src/main/services/runtime/RuntimeSkillCreatorFacade.ts`                                                       |
| LLM応答→コンテンツ抽出                                       | `apps/desktop/src/main/services/runtime/parseLlmResponseToContent.ts`                                                       |
| SkillFileWriter persist / rollback                            | `apps/desktop/src/main/services/skill/SkillFileWriter.ts`                                                                   |
| 二重パイプライン B経路（OutputHandler→SkillRegistry）         | `apps/desktop/src/main/services/runtime/SkillCreatorOutputHandler.ts`                                                       |
| パストラバーサル対策（toSlug / PATH_TRAVERSAL）               | `SkillCreatorOutputHandler.ts`（toSlug）、`SkillFileWriter.ts`（PATH_TRAVERSAL バリデーション + rollback）                   |
| LLMAdapter Setter Injection（P34 準拠）                       | `RuntimeSkillCreatorFacade.ts`（setLlmAdapter）                                                                             |
| 統合テスト 22 件                                              | `apps/desktop/src/main/services/runtime/__tests__/RuntimeSkillCreatorFacade.persist-integration.test.ts`                     |
| OutputHandler テスト 22 件                                    | `apps/desktop/src/main/services/runtime/__tests__/SkillCreatorOutputHandler.test.ts`                                        |
| 苦戦箇所（L-P005-001〜004）                                   | `references/lessons-learned-current.md`（§TASK-P0-05）                                                                      |
| completed ledger                                              | `references/task-workflow-completed.md`（§TASK-P0-05）                                                                      |
| workflow root                                                 | `docs/30-workflows/skill-creator-agent-sdk-lane/task-spec-sdk-interactive-skill-creator-v3/step-03-seq-task-04-skill-output-integration/` |

---

### Verify Execution Engine Layer 1/2（TASK-P0-01 / 2026-04-04 実装済み）

| 目的                                              | 最初に開くファイル                                                                                     |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| verify contract 仕様                              | `references/interfaces-skill-verify-contract.md`                                                       |
| workflow root                                     | `docs/30-workflows/step-09-par-task-p0-01-verify-execution-engine-layer12/`                            |
| completed ledger                                  | `references/task-workflow-completed.md`                                                                |
| 苦戦箇所（L-VE-001〜003）                         | `references/lessons-learned-current.md`                                                                |
| 実装ファイル                                      | `apps/desktop/src/main/services/runtime/SkillCreatorVerificationEngine.ts`                             |

---
### Skill Creator SDK Event Normalization (TASK-RT-06)

**概要:** SDKMessage → SkillCreatorSdkEvent 変換契約の安定化

| 項目 | 詳細 |
|---|---|
| 型 | `SkillCreatorSdkEvent` (7フィールド), `SkillCreatorSdkEventType` ("init"\|"assistant"\|"result"\|"error") |
| normalizer | `normalizeSdkMessage(msg, sessionId?)`, `normalizeSdkStream(msgs)` |
| IPCチャネル | `skill-creator:normalize-sdk-messages` |
| sessionId伝播 | init → 後続メッセージへ自動伝播 |
| テスト | 32件, Line 99.35% / Branch 91.22% / Function 100% |
| 未タスク | ~~SkillExecutor.convertToStreamMessage()との統合候補（1件）~~ → **UT-RT-06-SKILL-STREAM-SKCE-TYPE-UNIFICATION-001 にて完了** |

### SDK 出力型統合 (UT-RT-06-SKILL-STREAM-SKCE-TYPE-UNIFICATION-001)

**概要:** 実行 lane と skill-creator lane の出力型を `packages/shared` に集約

| 項目 | 詳細 |
|---|---|
| 共通基底型 | `SdkOutputMessageBase` (`timestamp?: number`) |
| 実行 lane 型 | `SkillExecutorStreamMessage extends SdkOutputMessageBase` (executionId / id / type / content / timestamp / isComplete) |
| 実行 lane 種別 | `SkillExecutorStreamMessageType` ("text"\|"tool_use"\|"error"\|"complete"\|"retry") |
| skill-creator lane 型 | `SkillCreatorSdkEvent extends SdkOutputMessageBase` (変更: 共通基底を継承) |
| @deprecated | `SkillExecutor.ts` ローカル `SkillStreamMessage` / `SkillStreamMessageType` は型エイリアスとして残存 |
| 型定義場所 | `packages/shared/src/types/skillCreator.ts` |

---

### Runtime Skill Creator Session Persistence（TASK-SDK-08 / 2026-03-28 実装済み）

| 目的                                                            | 最初に開くファイル                                                                                                                                     |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Task08 の全体像（checkpoint / lease / resume 契約）             | `docs/30-workflows/step-06-seq-task-08-session-persistence-and-resume-contract/index.md`                                                               |
| WorkflowSessionStorage（checkpoint / lease / revision 管理）   | `apps/desktop/src/main/services/session/WorkflowSessionStorage.ts`                                                                                     |
| ResumeCompatibilityEvaluator（compatible / incompatible 判定）  | `apps/desktop/src/main/services/session/ResumeCompatibilityEvaluator.ts`                                                                               |
| SkillCreatorWorkflowSessionRepository（保存 / ロード / 互換性） | `apps/desktop/src/main/services/session/SkillCreatorWorkflowSessionRepository.ts`                                                                      |
| session index（SessionService 登録）                            | `apps/desktop/src/main/services/session/index.ts`                                                                                                      |
| 型定義（WorkflowSession / ResumeCompatibilityResult）           | `packages/shared/src/types/skillCreator.ts`                                                                                                            |
| persistence contract と resume namespace rule                   | `references/api-ipc-system-core.md`                                                                                                                    |
| esbuild mismatch / artifact 命名 / Phase 11 判定 教訓          | `references/lessons-learned-current.md`（TASK-SDK-08 セクション）                                                                                     |
| completed ledger                                                | `references/task-workflow-completed.md`                                                                                                                |

---

### Skill Creator Execution Governance Bundle（2026-03-28 実装済み）

| 目的                                                                     | 最初に開くファイル                                                                          |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| Task07 governance bundle の全体像                                        | `docs/30-workflows/step-05-seq-task-07-execution-governance-and-handoff-alignment/index.md` |
| route authority / route owner                                            | `references/workflow-ai-runtime-execution-responsibility-realignment.md`                    |
| shared `HandoffGuidance` / Manual Boundary                               | `references/ui-ux-agent-execution-core.md`                                                  |
| approval / disclosure contract                                           | `references/api-ipc-system-core.md`                                                         |
| shared DTO / consumer mapping                                            | `references/interfaces-agent-sdk-skill-reference-share-debug-analytics.md`                  |
| Preload 実装（respondToApproval / getDisclosureInfo）                    | `apps/desktop/src/preload/skill-creator-api.ts`                                             |
| Renderer 実装（disclosure summary UI / handoff 分岐）                    | `apps/desktop/src/renderer/components/skill/SkillLifecyclePanel.tsx`                        |
| preload governance test（7テスト）                                       | `apps/desktop/src/preload/__tests__/skill-creator-api.governance.test.ts`                   |
| governance bundle 統合テスト（18テスト）                                 | `apps/desktop/src/main/services/runtime/__tests__/governance-bundle.test.ts`                |
| Phase 12 教訓（shared channel 再利用 / disclosure graceful degradation） | `references/lessons-learned-phase12-workflow-lifecycle.md`                                  |
| UT-SDK-07-APPROVAL-REQUEST-SURFACE-001 完了（2026-04-06）               | `onApprovalRequest()` Preload API / `SkillLifecyclePanel` 承認リクエスト表示 UI・lifecycle reset。テスト 17 件 PASS |
| 未タスク backlog（2件残）                                                | `references/task-workflow-backlog.md`（UT-SDK-07-PHASE11-SCREENSHOT-EVIDENCE-001 / UT-SDK-07-SHARED-IPC-CHANNEL-CONTRACT-001） |

---

### Runtime Workflow Engine Failure Lifecycle（2026-03-26）

| 目的                                     | 最初に開くファイル                                                                                                |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 実装済み failure lifecycle task の全体像 | `docs/30-workflows/completed-tasks/ut-imp-runtime-workflow-engine-failure-lifecycle-001/index.md`                 |
| owner / consumer rule の current fact    | `references/architecture-overview-core.md`, `references/arch-electron-services-details-part2.md`                  |
| public IPC と workflow engine の境界     | `references/api-ipc-system-core.md`                                                                               |
| 親 task の foundation                    | `docs/30-workflows/completed-tasks/step-02-seq-task-02-workflow-engine-runtime-orchestration/`                    |
| completed ledger / close-out             | `references/task-workflow-completed.md`, `references/lessons-learned-auth-ipc-skill-creator-sync-auth-timeout.md` |

---

### Runtime Skill Creator Verify Detail / Reverify（2026-03-27）

| 目的                                 | 最初に開くファイル                                                                   |
| ------------------------------------ | ------------------------------------------------------------------------------------ |
| public IPC 契約                      | `references/api-ipc-agent-core.md`                                                   |
| main / preload / shared current fact | `references/api-ipc-system-core.md`                                                  |
| renderer consumer / DTO 利用面       | `references/interfaces-agent-sdk-skill-reference.md`                                 |
| backlog / carry-forward root         | `references/task-workflow-backlog.md`                                                |
| workflow root                        | `docs/30-workflows/completed-tasks/ut-imp-task-sdk-06-layer34-verify-expansion-001/` |
| Phase 11/12 教訓                     | `references/lessons-learned-phase12-workflow-lifecycle.md`                           |

---

### RuntimePolicyResolver subscription 判定統合（2026-03-22）

| 目的                            | 最初に開くファイル                                                                                                                                                                                                                                                      |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3パターン分岐ロジック           | `references/arch-electron-services-details-part2.md`                                                                                                                                                                                                                    |
| execution capability 契約       | `references/arch-execution-capability-contract.md`                                                                                                                                                                                                                      |
| Implementation Anchor close-out | `docs/30-workflows/completed-tasks/step-01-seq-task-01-execution-responsibility-contract-foundation/outputs/phase-1/scope-definition.md`, `docs/30-workflows/completed-tasks/task-exec-scope-definition-path-update-001/outputs/phase-12/system-spec-update-summary.md` |
| IPC 契約（resolveWithService）  | `references/api-ipc-system-core.md`                                                                                                                                                                                                                                     |
| lessons learned                 | `references/lessons-learned-ipc-preload-runtime.md`                                                                                                                                                                                                                     |
| workflow root                   | `docs/30-workflows/w1b-sc-runtime-policy-closure/`                                                                                                                                                                                                                      |

---

### Execution Responsibility follow-up path correction（2026-03-27）

| 目的                               | 最初に開くファイル                                                                                                                       |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `UT-EXEC-01` workflow 全体像       | `docs/30-workflows/completed-tasks/task-exec-scope-definition-path-update-001/index.md`                                                  |
| actual patch target                | `docs/30-workflows/completed-tasks/step-01-seq-task-01-execution-responsibility-contract-foundation/outputs/phase-1/scope-definition.md` |
| execution capability 契約背景      | `references/arch-execution-capability-contract.md`, `references/interfaces-auth-core.md`                                                 |
| close-out ledger                   | `references/task-workflow-completed.md`                                                                                                  |
| stale path / duplicate source 教訓 | `references/lessons-learned-phase12-workflow-lifecycle.md`                                                                               |

---

### Advanced Console Safety Governance（2026-03-25）

| 目的                              | 最初に開くファイル                                                                                                  |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| ApprovalGate セキュリティ契約     | `references/security-electron-ipc-core.md`                                                                          |
| 5 IPC channel 契約                | `references/api-ipc-system-core.md`                                                                                 |
| ApprovalGate Enforcement パターン | `references/architecture-implementation-patterns-core.md`                                                           |
| 3層レイヤー / handler 登録        | `references/architecture-overview-core.md`                                                                          |
| 設計レッスン                      | `references/lessons-learned-current.md`                                                                             |
| 未タスク（UT-6〜10）              | `references/task-workflow-backlog.md`                                                                               |
| production 統合 workflow root     | `docs/30-workflows/safety-gov-production-integration/index.md`                                                      |
| 実装ガイド                        | `docs/30-workflows/step-03-seq-task-03-advanced-console-safety-governance/outputs/phase-12/implementation-guide.md` |

---

### Safety Governance Production Integration 本番配線完了（2026-03-31 実装済み）

| 目的                                              | 最初に開くファイル                                                                                                              |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 本番配線タスク全体像（Phase 1-12 完了）           | `docs/30-workflows/safety-gov-production-integration/index.md`                                                                  |
| ExecutionAPI preload namespace 型定義             | `apps/desktop/src/preload/types.ts`                                                                                             |
| contextBridge execution 公開実装                  | `apps/desktop/src/preload/index.ts`                                                                                             |
| DefaultApprovalGate DI / handler 登録             | `apps/desktop/src/main/ipc/index.ts`, `apps/desktop/src/main/ipc/approvalHandlers.ts`                                          |
| APPROVAL_CHANNELS / EXECUTION_CHANNELS 定数       | `packages/shared/src/ipc/channels.ts`                                                                                           |
| session cleanup（revokeAll on session destroy）   | `apps/desktop/src/main/ipc/approvalHandlers.ts`                                                                                 |
| follow-up 未タスク 4件（HIGH×3 / LOW×1）         | `docs/30-workflows/unassigned-task/UT-IMP-SAFETY-GOV-PUSH-REQUEST-PRODUCER-001.md` 等                                          |
| completed ledger                                  | `references/task-workflow-completed.md`                                                                                         |
| workflow pack formalize 教訓                      | `references/lessons-learned-current.md`                                                                                         |

---

### LLM provider registry SSoT（2026-04-01 更新）

| 目的                          | 最初に開くファイル                                                                        |
| ----------------------------- | ----------------------------------------------------------------------------------------- |
| provider / model 正本 (SSOT)  | `packages/shared/src/types/llm/schemas/provider-registry.ts`                             |
| LLM IPC 型定義                | `references/llm-ipc-types.md`                                                             |
| UI surface                    | `references/ui-ux-llm-selector.md`                                                        |
| LLM 全体インデックス          | `references/interfaces-llm.md`                                                            |
| 教訓                          | `references/lessons-learned-test-typesafety.md`                                           |
| completed ledger              | `references/task-workflow-completed.md`                                                   |
| workflow pack root            | `docs/30-workflows/llm-provider-model-modernization/`                                     |
| Task05 schema-extension root  | `docs/30-workflows/llm-provider-model-modernization/tasks/step-04-seq-task-05-schema-extension/` |

---

### TASK-SDK-01 Phase 12 close-out / follow-up sync（2026-03-26）

| 目的                            | 最初に開くファイル                                                                                      |
| ------------------------------- | ------------------------------------------------------------------------------------------------------- |
| close-out follow-up の全体像    | `references/task-workflow-completed.md`                                                                 |
| manifest foundation の教訓      | `references/lessons-learned-phase12-workflow-lifecycle.md`                                              |
| runtime hardening current facts | `references/interfaces-agent-sdk-skill-reference.md`                                                    |
| backlog / carry-forward 判定    | `references/task-workflow-completed.md`                                                                 |
| workflow ledger 導線            | `references/task-workflow.md`                                                                           |
| 実装完了 root                   | `docs/30-workflows/completed-tasks/step-01-seq-task-01-manifest-contract-foundation/`                   |
| follow-up workflow root         | `docs/30-workflows/completed-tasks/task-sdk-01-phase12-compliance-sync/`                                |
| follow-up 指示書                | `docs/30-workflows/completed-tasks/unassigned-task/task-imp-task-sdk-01-phase12-compliance-sync-001.md` |

---

### Skill Creator Workflow State / User Input / Verify API（2026-03-27）

| 目的                    | API / 型名                                                                      | 最初に開くファイル                                                       |
| ----------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| verify detail 取得      | `getVerifyDetail(planId)` → `RuntimeSkillCreatorVerifyDetail`                   | `references/api-ipc-system-core.md`                                      |
| reverify 要求           | `requestReverify(planId)` → `RuntimeSkillCreatorReverifyResult`                 | `references/api-ipc-system-core.md`                                      |
| workflow state 取得     | `getWorkflowState(planId)` → `SkillCreatorWorkflowUiSnapshot`                   | `references/api-ipc-system-core.md`                                      |
| ユーザー入力送信        | `submitUserInput(submission)` → `SkillCreatorWorkflowUiSnapshot`                | `references/api-ipc-system-core.md`                                      |
| workflow state 変更通知 | `onWorkflowStateChanged(callback)` → unsubscribe                                | `references/api-ipc-system-core.md`                                      |
| 教訓                    | 苦戦箇所4件（artifact ID / PhaseResourcePlanner / IPC型境界 / verify evidence） | `references/lessons-learned-auth-ipc-skill-creator-sync-auth-timeout.md` |

---

### 監視・アラート設計 / Observability（UT-08 / 2026-04-27）

| 目的 | 最初に開くファイル |
| --- | --- |
| WAE 6イベント設計 / 無料枠境界 / アラート閾値 | `references/observability-monitoring.md` |
| 苦戦箇所（設計/実装境界・WAE無料枠・アラート疲れ・identifier drift・DEFERRED解消） | `references/lessons-learned-monitoring-design-2026-04.md` |
| 05a 観測マトリクス（手動観測の正本） | `docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails/outputs/phase-02/observability-matrix.md` |
| 05a コストガードレール runbook | `docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails/outputs/phase-05/cost-guardrail-runbook.md` |
| Cloudflare デプロイ正本 | `references/deployment-cloudflare.md` |
| シークレット管理（Slack Webhook 等） | `references/deployment-secrets-management.md` |
| 未タスク仕様 | `docs/30-workflows/unassigned-task/UT-08-monitoring-alert-design.md` |

---

### KV セッションキャッシュ設計（UT-13 / 2026-04-27）

| 目的 | 最初に開くファイル |
| --- | --- |
| KV 最終的一貫性 / 無料枠書き込み制限 / Namespace 分離教訓 | `references/lessons-learned-kv-session-cache-2026-04.md` |
| KV 書き込み計装の `kv_op` イベント仕様 | `references/observability-monitoring.md`（§2 WAE 6イベント設計） |
| Cloudflare バインディング正本 | `references/deployment-cloudflare.md` |
| 未タスク仕様 | `docs/30-workflows/unassigned-task/UT-13-cloudflare-kv-session-cache.md` |
| 検出元 | `docs/01b-parallel-cloudflare-base-bootstrap/` UN-02 |

---

## 型定義クイックアクセス

| 用途                        | 型名                                                                                 | ファイル                                                                                                                      |
| --------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| API結果                     | `OperationResult<T>`                                                                 | interfaces-core.md                                                                                                            |
| IPC transport               | `IPCResponse<T>`                                                                     | interfaces-auth.md                                                                                                            |
| 認証方式状態                | `AuthModeStatus`                                                                     | interfaces-auth.md                                                                                                            |
| スキル情報                  | `Skill`, `SkillMetadata`                                                             | interfaces-agent-sdk.md                                                                                                       |
| 実行ステータス              | `SkillExecutionStatus`                                                               | packages/shared/src/types/skill.ts                                                                                            |
| チャットメッセージ          | `ChatMessage`                                                                        | interfaces-llm.md                                                                                                             |
| 会話セッション              | `ChatSession`                                                                        | interfaces-chat-history.md                                                                                                    |
| RAG検索結果                 | `SearchResult`                                                                       | interfaces-rag-search.md                                                                                                      |
| エラー                      | `AppError`, `ValidationError`                                                        | error-handling.md                                                                                                             |
| CTA制御                     | `CTAVisibility`, `CTAState`                                                          | workflow-skill-lifecycle-created-skill-usage-journey.md                                                                       |
| ViewType拡張                | `ViewType` (`skillAnalysis` / `skillCreate`)                                         | ui-ux-navigation.md                                                                                                           |
| Agent改善導線               | `currentSkillName`, `selectedSkillName`, `skillExecutionStatus`, `viewHistory`       | workflow-skill-lifecycle-routing-render-view-foundation.md, arch-state-management-core.md, arch-state-management-reference.md |
| SkillCenter analyze handoff | `handleAnalyzeSkill`, `setCurrentSkillName`, `setCurrentView("skillAnalysis")`       | workflow-skill-lifecycle-created-skill-usage-journey.md, arch-state-management-reference-permissions-import-lifecycle.md      |
| SkillAnalysis close 契約    | `onClose`, `currentSkillName ?? "demo-skill"`, `viewHistory`, `goBack()`             | ui-ux-navigation.md, workflow-skill-lifecycle-routing-render-view-foundation.md                                               |
| 権限フォールバック          | `AbortReason`, `PermissionFlowContext`, `PermissionFlowResult`                       | interfaces-agent-sdk-executor-core.md                                                                                         |
| 権限リトライ上限            | `PERMISSION_MAX_RETRIES`                                                             | interfaces-agent-sdk-executor-core.md                                                                                         |
| SafetyGate評価              | `SafetyGatePort`, `DefaultSafetyGate`, `evaluateSafety`                              | api-ipc-agent-safety.md, security-skill-execution.md                                                                          |
| Permission Fallback Hook    | `processPermissionFallback`, `revokeSessionEntries`                                  | interfaces-agent-sdk-executor-details.md                                                                                      |
| スキル公開レベル            | `SkillVisibility`                                                                    | interfaces-agent-sdk-skill.md                                                                                                 |
| 公開メタデータ              | `SkillPublishingMetadata`                                                            | interfaces-agent-sdk-skill.md                                                                                                 |
| 互換性チェック結果          | `CompatibilityCheckResult`                                                           | interfaces-agent-sdk-skill.md                                                                                                 |
| 公開準備状態                | `PublishReadiness`                                                                   | interfaces-agent-sdk-skill.md                                                                                                 |
| スキルレジストリ            | `SkillRegistryService`                                                               | interfaces-agent-sdk-skill.md                                                                                                 |
| スキル配布                  | `SkillDistributionService`                                                           | interfaces-agent-sdk-skill.md                                                                                                 |
| LLMヘルスチェック結果       | `HealthCheckResult`                                                                  | llm-ipc-types.md                                                                                                              |
| LLM設定同期                 | `SetSelectedConfigParams`                                                            | llm-ipc-types.md                                                                                                              |
| RAG LLMクライアント         | `ILLMClient`（crag/types.ts 版 / llm/types.ts 版）型ドリフト→P64                     | lessons-learned-rag-embedding-runtime.md (L-RAG-06)                                                                           |
| Slide UI状態                | `SlideUIStatus` (`synced` / `running` / `degraded` / `guidance`)                     | arch-state-management-core.md                                                                                                 |
| Slide レーン分離            | `SlideLane` (`integrated` / `manual`)                                                | arch-state-management-core.md                                                                                                 |
| Slide 能力DTO               | `SlideCapabilityDTO` (laneType / modifier / agentClient / fallbackReason / guidance) | arch-state-management-core.md                                                                                                 |
| 承認ゲート                  | `IApprovalGate`, `DefaultApprovalGate`                                               | security-electron-ipc-core.md                                                                                                 |
| Consumer Auth Guard         | `isConsumerToken()` (`sess-` / `sessionKey=` prefix)                                 | security-electron-ipc-core.md                                                                                                 |
| API Key 除去                | `sanitizeForApiKeys()`                                                               | security-electron-ipc-core.md                                                                                                 |
| External API 認証タイプ     | `ExternalApiAuthType`                                                                | skillCreatorExternalApi.ts                                                                                                     |
| External API 接続設定       | `ExternalApiConnectionConfig`                                                        | skillCreatorExternalApi.ts                                                                                                     |
| External API タイムアウト   | `ExternalApiTimeoutError`                                                            | skillCreatorExternalApi.ts                                                                                                     |
| External API HTTP エラー    | `ExternalApiHttpError`                                                               | skillCreatorExternalApi.ts                                                                                                     |

---

## docs-only status sync

> `SkillExecutionStatus` / status type spec sync 系タスクで、最初に見るべき現状と前提ブロッカー。

| 項目            | 値                                                                                                                                                                                                                                                         |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| current blocker | `packages/shared/src/types/skill.ts` の `SkillExecutionStatus` は現状 6 値。Task12 は `spec_created` 前提で、Phase 1 では実体確認が先。                                                                                                                    |
| primary refs    | `task-workflow-completed-skill-lifecycle-design.md`, `task-workflow-completed-skill-lifecycle-ui.md`, `interfaces-agent-sdk-integration.md`, `arch-state-management-core.md`, `task-workflow.md`, `lessons-learned-current-electron-menu-docs-task0912.md` |
| read order      | `resource-map.md` -> `task-workflow-completed-skill-lifecycle-design.md` -> `task-workflow-completed-skill-lifecycle-ui.md` -> `skill.ts` -> `task-workflow.md`                                                                                            |

---

## IPCチャンネル早見表

### 認証・ユーザー

| チャンネル           | 用途                             |
| -------------------- | -------------------------------- |
| `auth:get-session`   | セッション取得                   |
| `auth:sign-out`      | ログアウト                       |
| `auth-mode:get`      | 現在の認証方式取得               |
| `auth-mode:set`      | 認証方式の切替                   |
| `auth-mode:status`   | 現在 mode の資格情報状態取得     |
| `auth-mode:validate` | 対象 mode の有効性検証           |
| `auth-mode:changed`  | Main→Renderer の認証方式変更通知 |

### スキル管理

| チャンネル             | 用途           |
| ---------------------- | -------------- |
| `skill:list-available` | スキルスキャン |
| `skill:list-imported`  | インポート済み |
| `skill:execute`        | スキル実行     |
| `skill:permission`     | 権限確認       |

### スキル公開・配布

| チャンネル                             | 用途               |
| -------------------------------------- | ------------------ |
| `skill:publishing:register`            | スキル登録         |
| `skill:publishing:update`              | メタデータ更新     |
| `skill:publishing:check-compatibility` | 互換性チェック     |
| `skill:publishing:check-readiness`     | 公開準備確認       |
| `skill:publishing:publish`             | スキル公開         |
| `skill:publishing:unpublish`           | スキル非公開化     |
| `skill:publishing:get-status`          | 公開状態取得       |
| `skill:distribution:import`            | スキルインポート   |
| `skill:distribution:export`            | スキルエクスポート |
| `skill:distribution:fork`              | スキルフォーク     |
| `skill:distribution:share`             | 共有リンク生成     |

### 承認・安全ガバナンス

| チャンネル                      | 用途                               |
| ------------------------------- | ---------------------------------- |
| `approval:respond`              | Renderer→Main 承認/拒否応答送信    |
| `approval:request`              | Main→Renderer 承認要求プッシュ通知 |
| `execution:get-disclosure-info` | AI開示情報取得                     |
| `execution:get-terminal-log`    | ターミナルログ取得                 |
| `execution:get-copy-command`    | コピーコマンド取得                 |

### スキルクリエイター 外部API連携（TASK-SDK-SC-03）

| チャンネル                                     | 用途                         |
| ---------------------------------------------- | ---------------------------- |
| `skill-creator:configure-api`                  | Renderer→Main 外部API設定送信 |
| `skill-creator:api-configured`                 | Main→Renderer API設定完了通知 |
| `skill-creator:api-test-result`                | Main→Renderer API接続テスト結果 |
| `skill-creator:external-api-config-required`   | Main→Renderer API設定要求    |

### スキルクリエイター Skill Output統合（TASK-SDK-SC-04）

| チャンネル                                      | 用途                                           |
| ----------------------------------------------- | ---------------------------------------------- |
| `skill-creator:output-ready`                    | Main→Renderer スキル生成完了通知（プレビュー・上書き確認フロー） |
| `skill-creator:output-overwrite-approved`       | Renderer→Main 上書き確認承認                   |
| `skill-creator:open-skill`                      | Main→Renderer 生成スキルを開く指示             |

### チャット

| チャンネル                | 用途                           |
| ------------------------- | ------------------------------ |
| `chat:send`               | メッセージ送信                 |
| `chat:stream`             | ストリーミング                 |
| `conversation:*`          | 会話履歴管理                   |
| `llm:check-health`        | LLMヘルスチェック（primary）   |
| `llm:set-selected-config` | Renderer→Main 選択同期         |
| `AI_CHECK_CONNECTION`     | legacy接続確認（新規利用禁止） |

**詳細**: api-endpoints.md L126-736

---

### IPC契約ドリフト自動検出（UT-TASK06-007）

| 項目         | 値                                                                                                                                                                                                                                                                         |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| スクリプト   | `apps/desktop/scripts/check-ipc-contracts.ts`                                                                                                                                                                                                                              |
| テスト       | `apps/desktop/scripts/__tests__/check-ipc-contracts.test.ts`                                                                                                                                                                                                               |
| 実行         | `pnpm tsx apps/desktop/scripts/check-ipc-contracts.ts --report-only`                                                                                                                                                                                                       |
| ルール       | R-01(孤児), R-02(引数不一致/P44), R-03(ハードコード/P27), R-04(未登録)                                                                                                                                                                                                     |
| 仕様         | `ipc-contract-checklist.md` / `quality-requirements.md` / `architecture-implementation-patterns-reference-ipc-drift-detection.md`                                                                                                                                          |
| 導線         | `task-workflow.md` / `task-workflow-backlog.md` / `task-workflow-completed-ipc-contract-preload-alignment.md` / `docs/30-workflows/completed-tasks/UT-TASK06-007-ipc-contract-drift-auto-detect/` / `docs/30-workflows/UT-TASK06-007-EXT-006-new-function-test-expansion/` |
| 未タスク     | EXT-001(タプル配列), EXT-002(alias/再export/動的定数), EXT-003(ipcMain.on/safeOn), EXT-004(モジュール分割), EXT-005(R-02精度向上)                                                                                                                                          |
| 完了済み拡張 | EXT-006（5関数/パターン export追加 + 20件追加テスト）                                                                                                                                                                                                                      |
| テスト       | 69件（Line 95.79% / Branch 91.55% / Function 100%）                                                                                                                                                                                                                        |
| 実行時間     | 約2.1秒（NFR-01: 10秒以内）                                                                                                                                                                                                                                                |
| 実測値       | Main 217 handlers / Preload 189 entries / Drifts 198 / Orphans 120 / `passed=false`                                                                                                                                                                                        |

#### CLI コマンド早見表

| コマンド                                                                           | 用途                              |
| ---------------------------------------------------------------------------------- | --------------------------------- |
| `pnpm tsx apps/desktop/scripts/check-ipc-contracts.ts --report-only`               | Phase 9 品質ゲート（常に exit 0） |
| `pnpm tsx apps/desktop/scripts/check-ipc-contracts.ts --format json --report-only` | CI/CD 統合（JSON出力）            |
| `pnpm tsx apps/desktop/scripts/check-ipc-contracts.ts --strict`                    | error + warning で exit 1         |

#### 検出ルール早見表

| ルール | 名称               | 重大度  | 検出パターン                                     |
| ------ | ------------------ | ------- | ------------------------------------------------ |
| R-01   | チャンネル孤児     | warning | Main/Preload の片方のみに存在                    |
| R-02   | 引数形式不一致     | error   | Main=object, Preload=primitive（P44対応）        |
| R-03   | ハードコード文字列 | warning | IPC_CHANNELS 定数でなく文字列リテラル（P27対応） |
| R-04   | 未登録チャンネル   | error   | Preload にあるが Main にない                     |

---

## ディレクトリ構成早見表

```
apps/
  desktop/
    src/
      main/           # Electron Main Process
        services/     # ビジネスロジック
        ipc/          # IPCハンドラ
        settings/     # 設定管理
      renderer/       # React UI
        store/        # Zustand
        views/        # ページ
        components/   # 共通コンポーネント
      preload/        # Preload API
  web/                # Next.js (将来)
packages/
  shared/             # 共通型・ユーティリティ
    src/types/        # 型定義
  ui/                 # UIコンポーネント
```

**詳細**: directory-structure.md

---

## エラーコード早見表

| プレフィックス | 種別             | 例                     |
| -------------- | ---------------- | ---------------------- |
| ERR_1xxx       | システムエラー   | ERR_1001 INTERNAL      |
| ERR_2xxx       | 認証・認可       | ERR_2006 UNAUTHORIZED  |
| ERR_3xxx       | バリデーション   | ERR_3001 INVALID_INPUT |
| ERR_4xxx       | ビジネスロジック | ERR_4001 NOT_FOUND     |

**詳細**: error-handling.md L8-230

---

## テスト基準早見表

| メトリクス        | 必須 | 推奨 |
| ----------------- | ---- | ---- |
| Line Coverage     | 80%  | 90%+ |
| Branch Coverage   | 75%  | 85%+ |
| Function Coverage | 90%  | 100% |

**詳細**: quality-requirements.md L94-256

---

## セキュリティチェックリスト

- [ ] 入力バリデーション（Zod）
- [ ] IPCチャンネルホワイトリスト
- [ ] XSS対策（DOMPurify）
- [ ] パストラバーサル防止
- [ ] 機密情報ログ出力禁止

**詳細**: security-implementation.md, security-api-electron.md

---

## 新機能追加フロー

1. **型定義**: `packages/shared/src/types/`
2. **サービス**: `apps/desktop/src/main/services/`
3. **IPCハンドラ**: `apps/desktop/src/main/ipc/`
4. **Preload API**: `apps/desktop/src/preload/`
5. **React Hook**: `apps/desktop/src/renderer/hooks/`
6. **UIコンポーネント**: `apps/desktop/src/renderer/components/`
7. **テスト**: 各ディレクトリの`__tests__/`

**詳細**: architecture-patterns.md L8-74

---

## 仕様書テンプレート選択

| 作成対象                  | テンプレート               |
| ------------------------- | -------------------------- |
| インターフェース/型定義   | interfaces-template.md     |
| アーキテクチャ/パターン   | architecture-template.md   |
| API/エンドポイント        | api-template.md            |
| React Hook                | react-hook-template.md     |
| UIコンポーネント          | ui-ux-template.md          |
| テスト仕様                | testing-template.md        |
| エラーハンドリング        | error-handling-template.md |
| セキュリティ              | security-template.md       |
| データベース              | database-template.md       |
| デプロイ/CI/CD            | deployment-template.md     |
| 技術スタック              | technology-template.md     |
| Claude Code               | claude-code-template.md    |
| ワークフロー              | workflow-template.md       |
| 汎用                      | spec-template.md           |

---

## 関連ドキュメント

| ドキュメント                 | 用途                      |
| ---------------------------- | ------------------------- |
| resource-map.md              | タスク種別→ファイル逆引き |
| topic-map.md                 | セクション・行番号詳細    |
| spec-guidelines.md           | 仕様書作成ルール          |
| spec-splitting-guidelines.md | ファイル分割ルール        |

---

### Approval Request Surface (UT-SDK-07)
| 観点 | 参照先 |
| --- | --- |
| IPC surface (onApprovalRequest) | `references/api-ipc-system-core.md` → `onApprovalRequest` セクション |
| ApprovalRequestPayload shared type | `references/interfaces-agent-sdk-skill-reference.md` |
| UI コンポーネント (ApprovalRequestPanel) | `references/arch-ui-components.md` |

### Path-Scoped Governance Enforcement (TASK-P0-09-U1)
| 観点 | 参照先 |
| --- | --- |
| canUseTool path-scoped 判定 | `references/arch-state-management-core.md` → governance セクション |
| extractTargetPath / allowedSkillRoot | `references/api-ipc-system-core.md` |
| SafetyGovernance Production Integration | `references/arch-state-management-core.md` |

---

### Cloudflare デプロイ・本番運用

| 目的 | 参照先 |
| --- | --- |
| デプロイ戦略・全体像 | `references/deployment-core.md` |
| Cloudflare セットアップ手順 | `references/deployment-cloudflare.md` |
| モニタリング・チェックリスト | `references/deployment-details.md` |
| ブランチ戦略（feature→dev→main） | `references/deployment-branch-strategy.md` |
| シークレット管理（CF/GitHub） | `references/deployment-secrets-management.md` |
| UT-27 GitHub Secrets / Variables 配置決定マトリクス | `references/deployment-gha.md`（UT-27 章）|
| `CLOUDFLARE_ACCOUNT_ID` 参照規約 | GitHub Repository Variable として管理し、workflow では `${{ vars.CLOUDFLARE_ACCOUNT_ID }}` を使う（Secret ではない） |
| UT-27 1Password 正本→GitHub 派生コピー同期パターン（`op read` + 一時環境変数 + `unset` + Last-Updated メモ） | `references/deployment-secrets-management.md`（UT-27 章）|
| UT-27 `if: secrets.X != ''` 無音失敗の env 受け shell 判定回避 / 同名併存禁止 / API Token 最小スコープ + 命名規則 / rollback 3 経路 | `references/deployment-gha.md` + `references/deployment-secrets-management.md` + `lessons-learned/lessons-learned-ut-27-github-secrets-variables-2026-04.md`（L-UT27-001〜006）|
| インテグレーションパッケージ設計 | `references/arch-integration-packages.md` |

### 無料枠 / コストガードレール参照時（05a-parallel-observability-and-cost-guardrails）

| 目的 | 参照先 |
| --- | --- |
| Cloudflare 無料枠数値（Pages / Workers / D1 / KV / R2） | `references/deployment-cloudflare.md` |
| GitHub Actions minutes（public/private 区別） | `references/deployment-gha.md` |
| デプロイ品質ゲート / rollback 手順 | `references/deployment-core.md` |
| secret 配置（Cloudflare / GitHub / 1Password） | `references/environment-variables.md` |
| 観測対象一覧・閾値（warning / action） | `docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails/outputs/phase-02/observability-matrix.md` |
| 閾値別対処・degrade / rollback runbook | `docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails/outputs/phase-05/cost-guardrail-runbook.md` |
| 月次・週次の手動 ops チェックリスト | `docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails/outputs/phase-11/manual-ops-checklist.md` |
| 運用ガイド（同 wave 05b への handoff） | `docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails/outputs/phase-12/operations-guide.md` |
| CI/CD workflow識別子 mapping（対象5 workflow sync） | `docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails/outputs/phase-02/observability-matrix.md`（作業証跡: `docs/30-workflows/completed-tasks/ut-cicd-drift-impl-observability-matrix-sync/outputs/phase-12/main.md`） |

### UBM-Hyogo D1 Schema / Repository 早見（01a / 02a current）

| 観点 | 値 / 参照先 |
| --- | --- |
| 01a canonical task root | `docs/30-workflows/01a-parallel-d1-database-schema-migrations-and-tag-seed/` |
| 02a canonical task root | `docs/30-workflows/02a-parallel-member-identity-status-and-response-repository/` |
| legacy 03-serial contract | `member_responses` / `member_identities` / `member_status` / `sync_audit` は旧4テーブル契約として参照。01a以降の物理実装では20テーブル構成を正とする |
| 02a repository root | `apps/api/src/repository/` |
| 02a repository tables | `member_identities` / `member_status` / `member_responses` / `response_sections` / `response_fields` / `member_field_visibility` / `member_tags` / `tag_definitions` / `deleted_members` |
| UT-02A tag assignment queue write workflow | `docs/30-workflows/issue-109-ut-02a-tag-assignment-queue-management/`（implemented-local / implementation / NON_VISUAL / Phase 1-12 completed / Phase 13 pending_user_approval） |
| UT-02A formal stub | `docs/30-workflows/unassigned-task/UT-02A-TAG-ASSIGNMENT-QUEUE-MANAGEMENT.md` |
| D1 interface | `D1Db` / `D1Stmt` / `DbCtx` を `apps/api/src/repository/_shared/db.ts` で定義し、テスト時は `@cloudflare/workers-types` に依存しない |
| View assembler | `buildPublicMemberProfile` / `buildMemberProfile` / `buildAdminMemberDetailView` / `buildPublicMemberListItems` |
| Public list reads | `listMembersByIds` + `listStatusesByMemberIds` + `listResponsesByIds` によるバッチ読み取り |
| visibility default | 未設定時は privacy first で `member` |
| admin notes | `AdminMemberDetailView` へ引数で渡す。public/member view model には混ぜない |
| DB 名（staging） | `ubm-hyogo-db-staging`（`apps/api/wrangler.toml` `[env.staging]`） |
| DB 名（production） | `ubm-hyogo-db-prod`（`apps/api/wrangler.toml` top-level production） |
| binding 経由アクセス | `apps/api` のみ（`apps/web` から直接アクセス禁止） |

### UBM-Hyogo Attendance Profile Integration 早見（UT-02A follow-up / 2026-05-01）

| 観点 | 値 / 参照先 |
| --- | --- |
| canonical task root | `docs/30-workflows/ut-02a-attendance-profile-integration/` |
| 状態 | implemented / Phase 1-12 completed / Phase 13 pending_user_approval / NON_VISUAL |
| legacy stub | `docs/30-workflows/completed-tasks/UT-02A-ATTENDANCE-PROFILE-INTEGRATION.md` |
| 実装 root | `apps/api/src/repository/attendance.ts` + `apps/api/src/repository/_shared/builder.ts` attendance provider injection |
| interface boundary | `MemberProfile.attendance: AttendanceRecord[]` は 02a 確定契約として変更しない |
| runtime evidence | `outputs/phase-11/evidence/api-curl/*` and `outputs/phase-11/evidence/ui-smoke/*`（NON_VISUAL local evidence captured） |
| read path | `createAttendanceProvider(ctx).findByMemberIds()` が `member_attendance` と `meeting_sessions` を `session_id` で INNER JOIN。80-id chunk、`held_on DESC` + `session_id ASC`、session 不在 row 除外、同一 session 重複正規化 |
| 直交タスク | 09a staging smoke / 09b release runbook / 09c production deploy / 06b visual evidence / U-UT01-08 enum canonicalization は本 workflow で代替しない |

### UBM-Hyogo DevEx Conflict Prevention Spec Wave（2026-04-28）

| 順序 | canonical task root | 状態 |
| --- | --- | --- |
| 1 | `docs/30-workflows/task-conflict-prevention-skill-state-redesign/` | spec_created / docs-only / NON_VISUAL |
| 2 | `docs/30-workflows/task-git-hooks-lefthook-and-post-merge/` | spec_created / docs-only / NON_VISUAL |
| 3 | `docs/30-workflows/task-worktree-environment-isolation/` | spec_created / docs-only / NON_VISUAL |
| 4 | `docs/30-workflows/task-github-governance-branch-protection/` | spec_created / docs-only / NON_VISUAL |
| 5 | `docs/30-workflows/ut-gov-003-codeowners-governance-paths/` | Phase 1-12 completed / NON_VISUAL / CODEOWNERS current applied |
| 6 | `docs/30-workflows/task-claude-code-permissions-decisive-mode/` | spec_created / docs-only / NON_VISUAL |

横断順序: skill ledger 再設計 → Git hook 再生成停止 → worktree 分離 → GitHub governance → Claude Code permissions。

### モニタリング/アラート 早見（UT-08 monitoring-alert-design）

| 観点 | 値 / 参照先 |
| --- | --- |
| canonical workflow root | `docs/30-workflows/completed-tasks/ut-08-monitoring-alert-design/` |
| 派生実装タスク | `docs/30-workflows/unassigned-task/UT-08-IMPL-monitoring-alert-implementation.md` |
| WAE binding / dataset | `MONITORING_AE` / `ubm_hyogo_monitoring` |
| 主要イベント | `api.request` / `api.error` / `d1.query.fail` / `cron.sync.start` / `cron.sync.end` |
| 通知 | Slack Webhook + Email fallback（30 分 dedupe / 5 件以上 summary） |
| 外部監視 | UptimeRobot 無料プラン（5 分間隔） |
| SSOT 参照 | `references/workflow-ut08-monitoring-alert-design-artifact-inventory.md` |
| 苦戦箇所と知見 | `references/lessons-learned-ut08-monitoring-design-2026-04.md` |

### UBM-Hyogo D1 Repository 早見（02b: meeting/tag queue + schema diff repository）

| 観点 | 値 / 参照先 |
| --- | --- |
| canonical task root | `docs/30-workflows/completed-tasks/02b-parallel-meeting-tag-queue-and-schema-diff-repository/` |
| 実装パス | `apps/api/src/repository/`（attendance / meetings / schemaDiffQueue / schemaQuestions / schemaVersions / tagDefinitions / tagQueue + `_shared/`） |
| schema diff queue 未解決 status 正本 | `'queued'`（`pending` / `unresolved` / `open` 等は不可。不変条件 #14） |
| `schemaVersions.getLatestVersion()` | `ORDER BY synced_at DESC` で確定（不変条件 #15） |
| tag 書き込み境界 | `tag_assignment_queue` への enqueue/resolve のみ。`tag_definitions` は read-only マスタ（不変条件 #13）。UT-02A は enqueue 側（`idempotency_key=<memberId>:<responseId>`, retry max=3 / backoff `30s × 2^(attempt-1)`, partial unique index `WHERE idempotency_key IS NOT NULL`, `dlq` status terminal）、07a は resolve 側 |
| UT-02A 早見 | canonical: `docs/30-workflows/issue-109-ut-02a-tag-assignment-queue-management/`、migration: `apps/api/migrations/0009_tag_queue_idempotency_retry.sql`、repository: `apps/api/src/repository/tagQueue.ts`（既存規約 `repository/` 単数形・`tagQueue.ts` 短縮名を優先 / spec の `repositories/tagAssignmentQueue.ts` 表記とは差分あり）、type-level read-only test: `apps/api/src/repository/__tests__/memberTags.readonly.test-d.ts`、苦戦知見: `references/lessons-learned-ut-02a-tag-assignment-queue-2026-05.md`（L-UT02A-001〜007） |
| `tag_definitions` カテゴリ | 6 カテゴリ single source（41 行 seed） |
| fake D1 テストパターン | `apps/api/src/repository/_shared/__fakes__/fakeD1.ts`（in-memory pattern-matching SQL） |
| 状態遷移系 repository の必須設計 | Phase 2 で **ALLOWED 表**（from→to の許可遷移行列）を提示 |
| 苦戦知見 | `references/lessons-learned-02b-schema-diff-and-tag-queue.md` (L-02B-001〜005) |
| 02b 由来未タスク | `docs/30-workflows/unassigned-task/02b-followup-00{1,2,3}-*.md` |
| free tier 実測（02b 単体） | reads 0.24% / writes 0.11% |

### UBM-Hyogo Schema Sync 早見（03a-parallel-forms-schema-sync-and-stablekey-alias-queue / 2026-04-29）

| 観点 | 値 / 参照先 |
| --- | --- |
| canonical task root | `docs/30-workflows/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/` |
| 手動 entry point | `POST /admin/sync/schema`（Bearer `SYNC_ADMIN_TOKEN` 必須 / 200 success / 401 missing or invalid token / 403 forbidden / 409 already running / 500 internal）。詳細: `references/api-endpoints.md` |
| 自動実行 cron | `0 18 * * *` UTC = 03:00 JST schema sync（`apps/api/wrangler.toml` `[triggers] crons`）。詳細: `references/deployment-details.md` |
| 関連 D1 tables | `schema_versions` / `schema_questions` / `schema_diff_queue` / `sync_jobs`（詳細: `references/database-implementation-core.md`） |
| `schema_diff_queue.unresolved` 型 | 不変条件 #14 に従い `'queued'`（本タスクは登録だけを担当、解決は 07b に委譲） |
| 関連 env vars | `SYNC_ADMIN_TOKEN` / `GOOGLE_FORM_ID` / `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY`（詳細: `references/environment-variables.md`） |
| 実装モジュール | `apps/api/src/sync/schema/` / `apps/api/src/middleware/admin-gate.ts` / `apps/api/src/routes/admin/sync-schema.ts` |
| 苦戦知見 | `references/lessons-learned-03a-parallel-forms-schema-sync.md`（L-03a-001〜005） |

### 03a stableKey Literal Lint Enforcement 早見（2026-05-01）

| 観点 | 値 / 参照先 |
| --- | --- |
| canonical task root | `docs/30-workflows/03a-stablekey-literal-lint-enforcement/` |
| 状態 | `enforced_dry_run` / warning mode / NON_VISUAL / Phase 1-12 completed / Phase 13 pending_user_approval |
| 実装 | `scripts/lint-stablekey-literal.mjs` + `package.json` `lint:stablekey` / `lint:stablekey:strict` |
| allow-list | `packages/shared/src/zod/field.ts`, `packages/integrations/google/src/forms/mapper.ts` |
| strict blocker | 既存 stableKey literal 147 件。`fully enforced` は 0 violation + strict CI gate 後 |
| follow-up | `docs/30-workflows/unassigned-task/task-03a-stablekey-literal-legacy-cleanup-001.md`, `docs/30-workflows/unassigned-task/task-03a-stablekey-strict-ci-gate-001.md` |
| inventory | `references/workflow-03a-stablekey-literal-lint-enforcement-artifact-inventory.md` |

### UBM-Hyogo Admin Backoffice API 早見（04c / 2026-04-29）

| 観点 | 値 / 参照先 |
| --- | --- |
| canonical task root | `docs/30-workflows/04c-parallel-admin-backoffice-api-endpoints/` |
| API master | `references/api-endpoints.md`（管理バックオフィス API） |
| 実装 root | `apps/api/src/routes/admin/` |
| dashboard repository | `apps/api/src/repository/dashboard.ts` |
| 認可境界 | 04c は `SYNC_ADMIN_TOKEN` Bearer gate。05a で Auth.js + `admin_users` active 判定へ差し替える |
| 不在 endpoint | `PATCH /admin/members/:memberId/profile` / `PATCH /admin/members/:memberId/tags` は作らない |
| tag 書き込み境界 | `POST /admin/tags/queue/:queueId/resolve` のみ |
| schema 書き込み境界 | `/admin/schema/*` のみに集約 |
| attendance error | duplicate は `409`、deleted member は `422`、session not found は `404` |
| phase 11 判定 | API-only / NON_VISUAL。スクリーンショット対象外、curl smoke 手順と Vitest を証跡にする |

### UBM-Hyogo Admin Tag Queue Resolve Contract（UT-07A-02 / 2026-05-01）

| 観点 | 値 / 参照先 |
| --- | --- |
| canonical workflow | `docs/30-workflows/completed-tasks/ut-07a-02-search-tags-resolve-contract-followup/` |
| shared schema SSOT | `packages/shared/src/schemas/admin/tag-queue-resolve.ts` |
| body type | `{ action: "confirmed"; tagCodes: string[] } | { action: "rejected"; reason: string }` |
| mixed body | 400 `validation_error`（strict discriminated union） |
| API consumer | `apps/api/src/routes/admin/tags-queue.ts` |
| web consumer | `apps/web/src/lib/admin/api.ts` の `resolveTagQueue(queueId, body)` |
| focused evidence | `pnpm exec vitest run --root=. --config=vitest.config.ts apps/api/src/routes/admin/tags-queue.test.ts apps/api/src/workflows/tagQueueResolve.test.ts apps/api/src/schemas/tagQueueResolve.test.ts` |
| handoff | UT-07A-03 staging smoke with real admin auth / deployed Worker |

### UBM-Hyogo Admin UI 早見（06c / 2026-04-29）

| 観点 | 値 / 参照先 |
| --- | --- |
| canonical task root | `docs/30-workflows/02-application-implementation/06c-parallel-admin-dashboard-members-tags-schema-meetings-pages/` |
| 実装 root | `apps/web/app/(admin)/admin/`, `apps/web/src/components/admin/`, `apps/web/src/lib/admin/` |
| admin layout | `apps/web/app/(admin)/layout.tsx` (`getSession` + `isAdmin` gate + `AdminSidebar`) |
| API proxy | `apps/web/app/api/admin/[...path]/route.ts`（client mutation -> apps/api、secret 注入） |
| 5画面 | `/admin`, `/admin/members`, `/admin/tags`, `/admin/schema`, `/admin/meetings` |
| 不変条件 | profile本文編集なし / tag直接編集なし / schema解消は`/admin/schema`のみ / deleted attendance除外 / duplicate attendance disabled |
| 検証 | `@ubm-hyogo/web` typecheck PASS、Vitest 7 files / 36 tests PASS。スクリーンショットは D1 fixture / staging admin 前提のため 08b/09a に委譲 |
| UI/UX 詳細 | `references/ui-ux-admin-dashboard.md`（5画面のレイアウト/状態遷移/不変条件/エラー文言） |
| API client 詳細 | `references/architecture-admin-api-client.md`（Server Component `fetchAdmin` / client mutation helper / proxy / 認可境界） |
| 教訓 | `references/lessons-learned-06c-admin-ui-2026-04.md`（L-06C-001〜005） |

### UBM-Hyogo Staging Smoke / Forms Sync Validation 早見（09a / 2026-05-01）

| 観点 | 値 / 参照先 |
| --- | --- |
| canonical task root | `docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/` |
| 状態 | `spec_created` / implementation execution spec / `VISUAL_ON_EXECUTION` / Phase 13 blocked until user approval |
| 実測境界 | Phase 11 の `manual-smoke-log.md` / `sync-jobs-staging.json` / `wrangler-tail.log` は現状 `NOT_EXECUTED` placeholder。実測 PASS として扱わない |
| consumes | 05a OAuth/admin gate、06a public web、06b login/profile、06c admin UI、08b Playwright scaffold、03a/03b/U-04 Forms sync |
| blocks | 09c production deploy。09a の実 staging evidence 完了まで GO 判定不可 |
| follow-up | `docs/30-workflows/unassigned-task/task-09a-exec-staging-smoke-001.md` |
| execution workflow | `docs/30-workflows/ut-09a-exec-staging-smoke-001/`（spec_created / implementation / VISUAL_ON_EXECUTION。2026-05-02 user 明示指示後に Phase 11 を試行し、`cloudflare_unauthenticated + 09a_directory_missing` で `EXECUTED_BLOCKED`） |
| execution blockers | `docs/30-workflows/unassigned-task/task-09a-cloudflare-auth-token-injection-recovery-001.md`, `docs/30-workflows/unassigned-task/task-09a-canonical-directory-restoration-001.md` |
| artifact inventory | `references/workflow-task-09a-parallel-staging-deploy-smoke-and-forms-sync-validation-artifact-inventory.md` |
| 苦戦知見 | `references/lessons-learned-09a-staging-smoke-forms-sync-validation-2026-05.md`（L-09A-001〜005） |

### skill-ledger 4 施策（task-conflict-prevention-skill-state-redesign）

> 本ファイル 500 行超過のため詳細は分離。`indexes/quick-reference-search-patterns-skill-ledger.md` を参照。

| キーワード | 1 行誘導 |
| --- | --- |
| `skill-ledger`, `4施策`, `A-1/A-2/A-3/B-1` | `references/skill-ledger-overview.md` |
| `fragment`, `escapedBranch`, `nonce`, `render-api` | `references/skill-ledger-fragment-spec.md` |
| `gitignore`, `keywords.json` 自動生成 | `references/skill-ledger-gitignore-policy.md` |
| `progressive-disclosure`, `200 行ガード` | `references/skill-ledger-progressive-disclosure.md` |
| `merge=union`, `_legacy.md` | `references/skill-ledger-gitattributes-policy.md` |
| 苦戦箇所 (L-SLR-001〜009) | `references/lessons-learned-skill-ledger-redesign-2026-04.md` |
| 全クエリ早見 | `indexes/quick-reference-search-patterns-skill-ledger.md` |
| A-2 fragment 経路（2026-04-28〜） | canonical: `LOGS/<fragment>.md` / `changelog/<fragment>.md` / `lessons-learned/<fragment>.md`（旧 `LOGS.md` / `SKILL-changelog.md` / `references/lessons-learned-*.md` は `_legacy*.md` に退避済み・履歴参照のみ） |
| fragment append / render | `pnpm skill:logs:append` / `pnpm skill:logs:render`（writer は `scripts/skill-logs-append.ts` に一本化。直接 fragment を手書きしない） |
| fragment 命名 | `<YYYYMMDD-HHMMSS>-<escapedBranch>-<nonce>.md`（`scripts/lib/branch-escape.ts` で escapedBranch 生成、衝突時は `scripts/lib/retry-on-collision.ts` で nonce 再生成） |
| T-6 hook 冪等化 / 4 worktree smoke 仕様 | `docs/30-workflows/completed-tasks/skill-ledger-t6-hook-idempotency/index.md`（AC-1〜AC-11 / 2 worktree 事前 smoke → 4 worktree full smoke 二段構え / 部分 JSON リカバリ / `wait $PID` 個別集約）。実装は `docs/30-workflows/unassigned-task/task-skill-ledger-t6-implementation.md` |

### Git Hook 統一・post-merge indexes 再生成廃止 早見（task-git-hooks-lefthook-and-post-merge / 2026-04-28）

| 観点 | 値 / 参照先 |
| --- | --- |
| canonical task root | `docs/30-workflows/task-git-hooks-lefthook-and-post-merge/` |
| Git hook 正本 | `lefthook.yml`（root） / `.git/hooks/*` は派生物 |
| pre-commit 正本 | `scripts/hooks/staged-task-dir-guard.sh`（branch slug と staged task-dir の整合チェック） |
| post-merge 正本 | `scripts/hooks/stale-worktree-notice.sh post-merge`（read-only 通知のみ・自動再生成なし） |
| post-fetch | lefthook supported hook に未含のため lane 化しない（M-04 / P0-01 由来） |
| 自動配置 | `package.json` `"prepare": "lefthook install"`（`pnpm install` 連動） |
| indexes 再生成 | 明示コマンド `pnpm indexes:rebuild`（post-merge から廃止） |
| drift gate | `.github/workflows/verify-indexes.yml`（job/check 名: `verify-indexes-up-to-date`。`pnpm indexes:rebuild` 後 `git diff --exit-code` で `.claude/skills/aiworkflow-requirements/indexes` drift を検出） |
| 仕様正本 | `references/technology-devops-core.md`（§Git hook 運用正本 L351-365） |
| 苦戦知見 | `references/lessons-learned-lefthook-unification-2026-04.md`（L-LH-001〜L-LH-005） |
| 運用ガイド | `doc/00-getting-started-manual/lefthook-operations.md` / `CLAUDE.md`（Git hook の方針節） |
| 関連 baseline 未タスク | `husky` 不採用判断の ADR 化は 2026-04-28 に [`doc/decisions/0001-git-hook-tool-selection.md`](../../../../doc/decisions/0001-git-hook-tool-selection.md) として resolved / 後続: [`task-adr-template-standardization`](../../../../docs/30-workflows/unassigned-task/task-adr-template-standardization.md), [`task-lefthook-ops-adr-backlink`](../../../../docs/30-workflows/unassigned-task/task-lefthook-ops-adr-backlink.md)（既存 worktree への一括再 install runbook は task-lefthook-multi-worktree-reinstall-runbook で formalize 済み） |

### Multi-Worktree Lefthook Reinstall Runbook 早見（task-lefthook-multi-worktree-reinstall-runbook / 2026-04-28）

| 観点 | 値 / 参照先 |
| --- | --- |
| canonical task root | `docs/30-workflows/completed-tasks/task-lefthook-multi-worktree-reinstall-runbook/` |
| 派生元 baseline | `task-git-hooks-lefthook-and-post-merge`（B-1 を formalize） |
| 並列禁止理由 | pnpm content-addressable store の競合（worktree 横断で共有） |
| 対象抽出 | `git worktree list --porcelain` から `prunable` を除外（detached HEAD は対象に含める） |
| 実コマンド | `mise exec -- pnpm install --prefer-offline` → `mise exec -- pnpm exec lefthook version` を逐次 |
| 旧 hook 検出 | `.git/hooks/post-merge` の `LEFTHOOK` sentinel 不在を STALE 扱い（手動削除のみ・自動削除しない） |
| バイナリ不一致 | 一次対処 `pnpm rebuild lefthook` / 二次対処 `pnpm install --force`（Apple Silicon ケア） |
| べき等性 | 公式仕様で再実行可・失敗 worktree から再開可 |
| 運用ログ | `outputs/phase-11/manual-smoke-log.md`（Markdown 表 + ISO8601 / 見本行は実機反映後も削除しない） |
| 仕様書差分追記 | `doc/00-getting-started-manual/lefthook-operations.md`（Step 2-1〜2-4 specify 済み） |
| 苦戦知見 | `references/lessons-learned-lefthook-mwr-runbook-2026-04.md`（L-MWR-001〜L-MWR-006） |
| baseline 不採用 | ALT-A（CI 全 worktree 検証）/ ALT-B（per-clone 化）/ ALT-C（post-merge 復活）— `outputs/phase-12/unassigned-task-detection.md` |
| 派生未タスク | N-01 `scripts/reinstall-lefthook-all-worktrees.sh` 実装 Wave + CI smoke（index.md 依存関係表で追跡・重複起票しない） |

### Indexes Drift Detection 早見（task-verify-indexes-up-to-date-ci / 2026-04-28）

| 観点 | 値 / 参照先 |
| --- | --- |
| canonical task root | `docs/30-workflows/completed-tasks/task-verify-indexes-up-to-date-ci/` |
| CI gate 名（job / required status check） | `verify-indexes-up-to-date` |
| ワークフロー定義 | `.github/workflows/verify-indexes.yml` |
| 監視範囲（diff 対象パス） | `.claude/skills/aiworkflow-requirements/indexes`（`topic-map.md` / `keywords.json` の auto-generated drift） |
| 検出コマンド | `pnpm indexes:rebuild` を CI 上で実行し、続けて `git diff --exit-code -- .claude/skills/aiworkflow-requirements/indexes` で drift 判定（非ゼロ exit で fail） |
| Node / pnpm 固定 | Node 24（`.mise.toml`） / pnpm 10.33.2（`package.json` `packageManager`）。CI も同バージョンを `mise` 経由で利用 |
| ローカル再生成 | `mise exec -- pnpm indexes:rebuild`（post-merge から廃止された自動再生成の正規後継経路） |
| branch protection 連携 | `main` / `dev` の `required_status_checks` 候補として `verify-indexes-up-to-date` を登録（solo 運用ポリシー: レビュー必須化はせず CI gate で品質担保） |
| トリガー | `pull_request`（push / merge 経路で indexes drift を pre-merge ブロック） |
| 失敗時の対処 | ローカルで `pnpm indexes:rebuild` を実行 → 差分をコミット → 再 push（ジェネレータ `scripts/generate-index.js` が正本） |
| 関連未タスク | `docs/30-workflows/unassigned-task/U-VIDX-01-verify-indexes-actions-smoke-and-branch-protection.md`（実 PR での smoke / required status 登録） |

### GitHub Governance / branch protection apply（solo 運用 / UT-GOV-001 / 2026-04-28）

| 観点 | 値 / 参照先 |
| --- | --- |
| canonical task root | `docs/30-workflows/ut-gov-001-github-branch-protection-apply/` |
| 適用予定値（dev / main 共通） | `required_pull_request_reviews=null` / `lock_branch=false` / `enforce_admins=true` / `required_linear_history=true` / `required_conversation_resolution=true` / force-push & deletions = false |
| payload 正規化 | GET 形（snapshot）→ PUT 形（payload）adapter で `enforce_admins.enabled→bool` / `restrictions.users[].login→配列` / `required_pull_request_reviews=null` を必ず変換（snapshot を直接 PUT すると HTTP 422） |
| rollback 境界戦略 | snapshot / payload / rollback / applied JSON を `{branch}` サフィックスで分離。bulk PUT 禁止。enforce_admins DELETE 経路を事前準備 |
| 上流前提 | UT-GOV-004（`required_status_checks.contexts` の実 job 名同期）。未完了時は `contexts=[]` の 2 段階適用 fallback |
| 実 PUT のゲート | Phase 12 = `spec_created`（仕様書整備のみ）/ Phase 13 = `blocked_until_explicit_user_approval`（ユーザー明示承認後の別オペレーションでのみ実行） |
| 苦戦知見 | `references/lessons-learned-ut-gov-001-2026-04.md`（L-GOV-001 payload adapter / L-GOV-002 5 重明記 / L-GOV-003 Phase 12-13 二重ゲート / L-GOV-004 NON_VISUAL evidence） |
| 正本仕様 | `references/deployment-branch-strategy.md`（pending apply: UT-GOV-001 セクション） |

### GitHub Governance / UT-GOV-001 second-stage reapply（2026-04-30）

UT-GOV-004 で確定した required status checks を、UT-GOV-001 の `contexts=[]` fallback 適用後に再 PUT するための approval-gated implementation / NON_VISUAL workflow。

| 観点 | 値 / 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/` |
| confirmed contexts | `ci`, `Validate Build`, `verify-indexes-up-to-date` |
| 実行ゲート | Phase 13 でユーザー明示承認後のみ `gh api -X PUT` / commit / push / PR 作成を実行する |
| evidence 境界 | Phase 13 の fresh GET output だけを適用証跡にできる。placeholder / PUT payload / expected contexts は current applied の入力にしない |
| final references 反映 | `docs/30-workflows/completed-tasks/task-utgov001-references-reflect-001/` で反映済み。dev/main contexts は `ci`, `Validate Build`; strict は dev=false / main=true; `verify-indexes-up-to-date` は expected-context drift |
| downstream precondition | `docs/30-workflows/unassigned-task/task-utgov-downstream-precondition-link-001.md` で UT-GOV-005〜007 の上流前提へ反映 |

### Lefthook Multi-Worktree Reinstall（task-lefthook-multi-worktree-reinstall / 2026-04-28）

| 観点 | 値 / 参照先 |
| --- | --- |
| canonical runbook | `docs/30-workflows/completed-tasks/task-lefthook-multi-worktree-reinstall-runbook.md` |
| 実行コマンド | `bash scripts/reinstall-lefthook-all-worktrees.sh`（dry-run は `bash scripts/reinstall-lefthook-all-worktrees.sh --dry-run`） |
| スクリプト本体 | `scripts/reinstall-lefthook-all-worktrees.sh` |
| 用途 | `lefthook.yml` 改定時 / 新規 worktree 追加時に、全 worktree の `.git/hooks/*` を一括で `lefthook install` し直す |
| 並列実行 | **禁止**（worktree のロックや `.git/hooks/` 上書きが競合するため、必ず順次 1 worktree ずつ処理する。スクリプトは sequential loop で実装） |
| 判定 | SKIP: 対象 worktree が `.git/hooks` 未保有 / 既に同 commit の lefthook が install 済み（idempotency 達成）／ PASS: `lefthook install` が exit 0 で完了し hook ファイル群が期待 hash になる ／ FAIL: install 失敗 or 検証不一致（その worktree のみ赤、後続は継続） |
| 出力契約 | 各 worktree について `[SKIP] / [PASS] / [FAIL]` を 1 行ずつ stdout に出力。最後に集計サマリ。`--dry-run` は副作用なしで「何が走るか」のみ表示 |
| 運用契約（Phase 11 manual-smoke-log） | 実行ログ（stdout 全文）を該当タスクの `outputs/phase-11/manual-smoke-log.md` に転記必須。SKIP/PASS/FAIL の件数と、FAIL があった worktree のフルパス・原因仮説を併記する |
| 前提 | mise で Node 24 / pnpm 10.33.2 が解決済み（`mise exec --` 経由でないと `lefthook` バイナリが解決できないケースあり） |
| 運用ガイド | `doc/00-getting-started-manual/lefthook-operations.md`（§複数 worktree 一括再インストール） |
| 関連未タスク | `docs/30-workflows/unassigned-task/U-LFT-07-multi-worktree-reinstall-operations.md`（CI 化検討 / stale worktree 検出強化） |

### 公開ディレクトリ API（04a）早見

| 観点 | 値 / 参照先 |
| --- | --- |
| canonical task root | `docs/30-workflows/completed-tasks/04a-parallel-public-directory-api-endpoints/` |
| 4 endpoint | `GET /public/stats`（`public, max-age=60`） / `GET /public/members`（`no-store`） / `GET /public/members/:memberId`（`no-store`） / `GET /public/form-preview`（`public, max-age=60`） |
| 認証 | 未認証で叩ける（session middleware 非適用 / `createPublicRouter()` で `/public/healthz` 直後に mount） |
| 公開条件 | `publishState='published' AND publicConsent='consented' AND is_deleted=0`（`_shared/public-filter.ts` の `buildPublicWhereParams`） |
| 除外キー | `FORBIDDEN_KEYS = ['responseEmail','rulesConsent','adminNotes']`（runtime delete 必須） |
| visibility 既定値 | `member`（privacy first。`schema_questions.visibility='public'` のみ公開） |
| 6 層 leak 防御 | 1. SQL where / 2. repository EXISTS（`existsPublicMember` → `UBM-1404`） / 3. converter 内 `isPublicStatus` / 4. `keepPublicFields`（visibility filter） / 5. FORBIDDEN_KEYS runtime delete / 6. Zod `.strict()` parse fail close |
| 主要ハンドラ | `apps/api/src/routes/public/{index,stats,members,member-profile,form-preview}.ts` |
| 主要 helper | `apps/api/src/_shared/{visibility-filter,public-filter,pagination,search-query-parser}.ts` |
| 主要 view-model | `apps/api/src/view-models/public/{public-stats-view,public-member-list-view,public-member-profile-view,form-preview-view}.ts` |
| query 契約 | `q`（max 200 文字） / `zone` / `status` / `tag` / `sort` / `density`（`comfy/dense/list`） / `page` / `limit`（max 100, min 1） |
| 関連 references | `references/api-endpoints.md`（公開ディレクトリ API 章） / `lessons-learned/lessons-learned-04a-public-api-security-layers.md`（L-04A-001〜007） / `references/workflow-task-04a-parallel-public-directory-api-endpoints-artifact-inventory.md` |
| Follow-up 未タスク | `docs/30-workflows/unassigned-task/task-04a-followup-001〜005-*.md`（miniflare contract / KV cache / shared parser / cache rules / N+1） |

---

### Governance / Branch Protection 系タスクの Step 2=N/A ショートカット（UT-GOV-002 由来 / 2026-04-29）

> **趣旨**: GitHub Actions governance / branch protection / safety gate 系タスクは API/D1/IPC/UI/auth/Cloudflare Secret 変更を伴わない場合が多く、aiworkflow-requirements の Step 2（正本仕様更新）は原則 N/A。ただし以下の再判定トリガに該当する場合は Step 2 を再実施する。

| 観点 | 値 |
| --- | --- |
| 原則 | GitHub Actions ワークフロー / branch protection / squash-only / linear history / required status checks / CODEOWNERS / pull_request_target safety gate 系のタスクは Step 2 = **N/A**（references/ 配下の仕様編集は不要） |
| 例: N/A 判定済み | UT-GOV-001（branch protection 草案）/ UT-GOV-002（pull_request_target safety gate dry-run）/ task-github-governance-branch-protection（squash-only 等の草案） |
| 再判定トリガ① OIDC | `id-token: write` を伴う OIDC token の新規採用、`aws-actions/configure-aws-credentials` 等の federation 設定追加（Cloudflare Secret / IAM 境界に影響するため `references/deployment-secrets-management.md` / `deployment-cloudflare.md` を更新） |
| 再判定トリガ② workflow_run | `workflow_run` 経由で別ワークフローへデプロイ権限を委譲する場合（権限境界が変わるため `deployment-gha.md` / `deployment-core.md` を更新） |
| 再判定トリガ③ メタデータ参照 | PR triage / governance gate が D1 / KV / R2 メタデータ（member_responses / sync_audit / SESSION_KV 等）を参照する場合（データ境界に影響するため `database-admin-repository-boundary.md` 等を更新） |
| 再判定トリガ④ Secret 追加 | governance gate が新しい Cloudflare Secret / GitHub Secret を要求する場合（`deployment-secrets-management.md` の Secret inventory に追記）。配置層判定（Secret/Variable + repository-scoped/environment-scoped）は UT-27 配置決定マトリクスのフロー（マスク要否 → ログ可視性要否 → 環境別ローテーション要否）を踏襲する |
| 再判定トリガ⑤ auth / RBAC | branch protection が CODEOWNERS 経由で auth / RBAC を実装に拡張する場合（`references/02-auth.md` 系を更新） |
| Step 2 = N/A 時の最低限の同期 | LOGS.md ヘッドラインへの 1 エントリ追加と、SKILL.md 変更履歴への version 追加のみ（references/ 配下は触らない） |
| 一次正本（重複時） | governance / branch protection の運用ルール本文は `CLAUDE.md` のブランチ戦略節を一次正本とし、aiworkflow-requirements は補強として扱う（下表参照） |

---

### CLAUDE.md と aiworkflow-requirements の重複正本判定（UT-GOV-002 由来 / 2026-04-29）

> **趣旨**: 同一トピックが `CLAUDE.md` と aiworkflow-requirements の両方で言及される場合、どちらを一次正本とするか曖昧だと参照ループや矛盾の温床になる。以下の領域は **CLAUDE.md が一次正本**であり、aiworkflow-requirements 配下の記述は補強・派生情報として扱う。

| トピック | 一次正本 | 補強（aiworkflow-requirements 内） | 矛盾検出時の優先順 |
| --- | --- | --- | --- |
| ブランチ戦略（feature/dev/main の役割と PR フロー） | `CLAUDE.md` 「ブランチ戦略」節 | `references/deployment-branch-strategy.md` / `deployment-core.md` | CLAUDE.md > aiworkflow-requirements。差異検出時は CLAUDE.md を正として references/ を補正 |
| solo 運用 CI gate 方針（`required_pull_request_reviews=null` / `required_status_checks` / `required_linear_history` / `required_conversation_resolution`） | `CLAUDE.md` ブランチ戦略の solo 運用ポリシー注記 | `references/deployment-branch-strategy.md` の draft proposal セクション | CLAUDE.md > aiworkflow-requirements。レビュー必須数を変更する場合は CLAUDE.md を先に更新 |
| Cloudflare CLI ラッパー方針（`scripts/cf.sh` 経由・`wrangler` 直接禁止・`wrangler login` 禁止） | `CLAUDE.md` 「Cloudflare 系 CLI 実行ルール」節 | `references/deployment-cloudflare.md` / `deployment-secrets-management.md` の `scripts/cf.sh` 統合章 | CLAUDE.md > aiworkflow-requirements。コマンド形式・禁止事項は CLAUDE.md を起点に同期 |
| ローカル `.env` の op 参照運用 | `CLAUDE.md` 「ローカル `.env` の運用ルール」節 | `references/deployment-secrets-management.md` の op 章 | CLAUDE.md > aiworkflow-requirements |
| Git hook 運用（lefthook 正本 / `.git/hooks/*` 手書き禁止 / post-merge 廃止） | `CLAUDE.md` 「Git hook の方針」節 | `references/technology-devops-core.md` Git hook 運用章 / `lessons-learned-lefthook-unification-2026-04.md` | CLAUDE.md > aiworkflow-requirements。ただし lessons-learned の教訓 ID は references/ 側が一次正本 |
| Node / pnpm バージョン固定（Node 24 / pnpm 10.33.2 / mise） | `CLAUDE.md` 「開発環境セットアップ」節 | `references/technology-devops-core.md` baseline 章 | CLAUDE.md > aiworkflow-requirements |
| references/ 配下の API/D1/IPC/UI/auth 仕様 | `references/*.md`（aiworkflow-requirements が一次正本） | `CLAUDE.md` は概要のみ言及 | aiworkflow-requirements > CLAUDE.md。実装契約・schema・状態定数は references/ を正とする |
| 教訓 / lessons-learned ID（L-XXX-NNN） | `references/lessons-learned-*.md`（aiworkflow-requirements が一次正本） | CLAUDE.md には記載しない | aiworkflow-requirements > CLAUDE.md |
