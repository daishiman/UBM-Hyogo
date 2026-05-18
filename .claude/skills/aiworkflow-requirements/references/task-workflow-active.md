# タスク実行仕様書生成ガイド / active guide

> 親仕様書: [task-workflow.md](task-workflow.md)
> 役割: active guide
> 区分: 正本（current contract）

## 概要

本ドキュメントは、複雑なタスクを単一責務の原則に基づいて分解し、各サブタスクに最適なスラッシュコマンド・エージェント・スキルの組み合わせを選定するためのガイドラインを定義する。

### Issue #749 Primitive Adoption Tracker（2026-05-17）
### Issue #747 Vitest esbuild arch & worktree isolation（2026-05-17）

| 項目 | 値 |
| --- | --- |
| ステータス | `implemented_local_runtime_blocked_node_arch / implementation / NON_VISUAL / PARTIAL_LOCAL_EVIDENCE_NODE_ARCH_BLOCKED` |
| 成果物 | `docs/30-workflows/issue-747-vitest-esbuild-arch-and-worktree-isolation/` |
| source | Issue #747 CLOSED / `docs/30-workflows/unassigned-task/parallel-09-followup-002-vitest-esbuild-version-alignment.md` consumed |
| 目的 | focused Vitest 2 spec の起動 blocker を、Node arch / worktree topology / esbuild version parity の3層で検出・復旧する |
| 実装 | `scripts/verify-node-arch.mjs`, `scripts/verify-worktree-node-modules-isolation.mjs`, `scripts/verify-esbuild-version.mjs`, root `package.json` scripts + `esbuild@0.27.3`, `pnpm-lock.yaml`, `lefthook.yml`, `.github/workflows/verify-esbuild.yml`, `.mise.toml`, `CLAUDE.md` runbook link |
| evidence | focused Vitest 2 specs, worktree isolation, and esbuild version parity pass locally; `verify:node-arch` fails on this Rosetta/x64 Node and remains the active runtime blocker |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-747-vitest-esbuild-arch-and-worktree-isolation-artifact-inventory.md` |
| user gate | arm64 Node reinstall on local host, commit, push, PR, GitHub Actions runtime evidence, parent repository `node_modules` cleanup |

### Issue #748 jest-axe primitive a11y integration（2026-05-17）

| 項目 | 値 |
| --- | --- |
| ステータス | `implemented_local_evidence_captured / implementation / NON_VISUAL / Phase 12 strict 7 present` |
| 成果物 | `docs/30-workflows/completed-tasks/issue-748-jest-axe-primitive-a11y-integration/` |
| Issue | #748 CLOSED。PR 文脈は `Refs #748` |
| source | `docs/30-workflows/completed-tasks/parallel-09-followup-003-jest-axe-real-a11y-integration.md` consumed |
| 目的 | parallel-09 primitive 5 種に real `jest-axe` component test を統合し、proxy assertion だけの a11y gate を解消する |
| implementation targets | `apps/web/src/test/axe.ts`, `apps/web/src/components/ui/__tests__/parallel09-primitives.component.spec.tsx` |
| evidence | `outputs/phase-11/local-test.log`, `typecheck.log`, `lint.log`; Phase 12 strict 7 |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-748-jest-axe-primitive-a11y-integration-artifact-inventory.md` |
| user gate | commit / push / PR / issue mutation |

### Issue #730 Phase 11 evidence existence validator（2026-05-17）

| 項目 | 値 |
| --- | --- |
| ステータス | `implemented_local_evidence_captured / implementation / NON_VISUAL / local evidence PASS` |
| 成果物 | `docs/30-workflows/issue-730-phase11-evidence-existence-validator/` |
| Issue | #730 CLOSED。PR 文脈は `Refs #730` のみ |
| source unassigned | `docs/30-workflows/unassigned-task/task-27-followup-002-phase11-evidence-existence-validator.md` consumed |
| 目的 | Phase 12 compliance check の Phase 11 evidence inventory で `present` 宣言された path の物理実在を検証する |
| implementation targets | `scripts/lib/phase12-compliance/parse-phase11-evidence.ts`, `verify-phase11-evidence-existence.ts`, `verify-compliance-file.ts`, `types.ts`, `scripts/__tests__/verify-phase12-compliance.spec.ts` |
| evidence | `outputs/phase-11/main.md`, `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| runtime boundary | `pnpm test:phase12-compliance` and `pnpm verify:phase12-compliance` pass locally. GitHub-hosted CI evidence remains user-gated |
| user gate | commit / push / PR / Issue mutation |

### i02-admin-error-type-unify（2026-05-17）

| 項目 | 値 |
| --- | --- |
| ステータス | `implemented_local_evidence_captured / implementation / VISUAL_RUNTIME_PENDING / Phase 12 strict 7 present` |
| 成果物 | `docs/30-workflows/completed-tasks/issue-749-primitive-adoption-tracker/` |
| source | Issue #749 CLOSED。PR 文脈は `Refs #749` のみ |
| parent / route SSOT | `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SCOPE.md` |
| 目的 | completed SCOPE の 19 routes x 6 primitive 採用を `outputs/adoption-tracker.md` と `verify-primitive-adoption` gate で機械検証可能にする |
| implementation targets | `apps/web/src/components/admin/{MeetingPanel,AuditLogPanel,TagQueuePanel,SchemaDiffPanel,RequestQueuePanel,IdentityConflictRow}.tsx`, `apps/web/src/components/public/DensityToggle.client.tsx`, `apps/web/app/(admin)/admin/**/page.tsx`, `scripts/verify-primitive-adoption.sh`, `.github/workflows/verify-primitive-adoption.yml` |
| same-cycle sync | `CLAUDE.md` 不変条件 9 / 10、quick-reference、resource-map、task-workflow-active、changelog、LOGS |
| evidence boundary | `apps/web` implementation、Phase 11 grep/typecheck/focused tests、Phase 12 strict 7 は captured。runtime screenshot、branch protection PUT、commit、push、PR は user-gated |
### i02-admin-error-type-unify（2026-05-17）

| ステータス | `implemented_local_evidence_captured / implementation / NON_VISUAL / Phase 12 strict 7 present / completed-tasks moved` |
| 成果物 | `docs/30-workflows/completed-tasks/i02-admin-error-type-unify/` |
| source | `docs/30-workflows/completed-tasks/integration-fixes-i02-admin-error-type-unify.md` consumed |
| 目的 | `useAdminMutation` の 401 を `AuthRequiredError`、非 2xx を `FetchAuthedError` に統一し、401 を `/login?redirect=...` redirector へ接続する |
| 実装 | `apps/web/src/features/admin/hooks/useAdminMutation.ts`, `apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts` |
| 不変条件 | 既存 caller の hook 利用形と API/D1 schema は変更しない。`FetchAuthedError` constructor signature も維持 |
| evidence | Phase 11 focused command evidence captured / Phase 12 strict 7 present |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-i02-admin-error-type-unify-artifact-inventory.md` |
| user gate | commit / push / PR |

### UT-07A-FU-01 memberTags.assignTagsToMember cleanup（2026-05-15）

| 項目 | 値 |
| --- | --- |
| ステータス | `implemented_local_evidence_captured / implementation / NON_VISUAL / Phase 12 strict 7 present` |
| 成果物 | `docs/30-workflows/ut-07a-01-member-tags-assign-cleanup/` |
| source | Issue #294 CLOSED / `docs/30-workflows/completed-tasks/COMPLETED-UT-07A-01-member-tags-assign-cleanup.md` consumed |
| 目的 | `assignTagsToMember` を削除せず、`tagQueueResolve` workflow 専用 helper としてコード本体で明示する |
| 実装 | `apps/api/src/repository/memberTags.ts` のファイル冒頭コメント、関数 JSDoc、provider interface JSDoc、`memberTags.readonly.test-d.ts` / `memberTags.repository.spec.ts` boundary gates |
| evidence | Phase 11 tracked `.txt` local evidence / grep topology / git diff、Phase 12 strict 7 |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-ut-07a-01-member-tags-assign-cleanup-artifact-inventory.md` |
| user gate | commit / push / PR / issue mutation |

### serial-05-step-03 schema diff resolve UI（2026-05-16）

| 項目 | 値 |
| --- | --- |
| ステータス | `implemented-local-runtime-pending / implementation / VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` |
| 成果物 | `docs/30-workflows/serial-05-step-03-schema-diff-resolve/` |
| 親 workflow | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/serial-05-admin-mutation-ui/` |
| 目的 | `/admin/schema` の既存 `SchemaDiffPanel` を現行 schema alias API contract に合わせて hardening する |
| implementation targets | `apps/web/src/components/admin/SchemaDiffPanel.tsx`, `apps/web/src/lib/admin/api.ts`, `apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx`, `apps/web/src/lib/admin/__tests__/api.spec.ts` |
| API boundary | 既存 `GET /admin/schema/diff` / `POST /admin/schema/aliases` を利用。新 endpoint / D1 schema / env gate 追加なし |
| UI contract | 4 ペイン table semantics、stableKey regex `/^[a-zA-Z][a-zA-Z0-9_]*$/`、row select 後 input focus、409 `existingStableKey` / 422 `existingQuestionIds` 表示、202 retryable status、queued/resolved 日本語 label |
| evidence | `docs/30-workflows/serial-05-step-03-schema-diff-resolve/outputs/phase-11/evidence/`, `docs/30-workflows/serial-05-step-03-schema-diff-resolve/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| user gate | runtime screenshots、staging smoke、commit、push、PR |

### admin-tags-queue-resolver-drawer（2026-05-17）

| 項目 | 値 |
| --- | --- |
| ステータス | `implemented_local_evidence_captured / implementation / VISUAL / local tests passed / Phase 12 strict 7 present` |
| 成果物 | `docs/30-workflows/completed-tasks/admin-tags-queue-resolver-drawer/` |
| source | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/serial-05-admin-mutation-ui/step-04-tags-assignment/spec.md` |
| 目的 | `/admin/tags` の既存 `TagQueuePanel` から resolve UI を `TagsQueueResolveDrawer` として抽出し、a11y drawer pattern、schema validation、`useAdminMutation` 経由 mutation に再設計する |
| implementation targets | `apps/web/src/components/admin/TagQueuePanel.tsx`, `apps/web/src/components/admin/TagsQueueResolveDrawer.tsx`, `apps/web/src/components/admin/_tagQueueStatus.ts`, `apps/web/src/features/admin/hooks/useAdminMutation.ts`, `apps/web/src/lib/admin/server-fetch.ts`, `apps/web/playwright/tests/admin-tags-resolve-drawer.spec.ts`, `apps/web/src/styles/tokens.css` |
| API boundary | 既存 upstream `POST /admin/tags/queue/:queueId/resolve` のみ。browser path は `/api/admin/tags/queue/:queueId/resolve`。新 endpoint / D1 schema / shared schema 変更なし |
| evidence | `docs/30-workflows/completed-tasks/admin-tags-queue-resolver-drawer/outputs/phase-12/phase12-task-spec-compliance-check.md`; local Vitest 626 passed / 1 skipped; Phase 11 screenshots 5 PNG; axe violations 0 |
| lessons | `references/lessons-learned-admin-tags-queue-resolver-drawer-2026-05.md` |
| user gate | runtime screenshots、staging smoke、commit、push、PR |

### UT-07A-04 member_tags assigned_via_queue_id decision（2026-05-16）

| 項目 | 値 |
| --- | --- |
| ステータス | `implemented_local_evidence_captured / docs-only / NON_VISUAL / Phase 13 blocked_pending_user_approval` |
| 成果物 | `docs/30-workflows/issue-296-ut-07a-04-assigned-via-queue-id-decision/` |
| Issue | #296 CLOSED。PR 文脈は `Refs #296` のみ |
| 親 workflow | `docs/30-workflows/completed-tasks/07a-parallel-tag-assignment-queue-resolve-workflow/` |
| 判断 | `member_tags.assigned_via_queue_id` は追加しない。queue trace は `audit_log.target_type='tag_queue'` / `target_id=<queueId>` と `member_tags.source='admin_queue'` で担保 |
| 実行境界 | ADR 0002、`08-free-database.md`、`database-implementation-core.md`、07a 親 back-link、grep evidence、source UT-07A-04 consumed trace は実行済み。commit / push / PR のみ user-gated |
| skill promotion | `task-specification-creator` docs-only grep/back-link rule、`aiworkflow-requirements` schema drift ADR gate を同一改善 cycle で反映済み |

### serial-05-step-02 identity-conflicts merge UI（2026-05-16）

| 項目 | 値 |
| --- | --- |
| ステータス | `implemented_local_visual_evidence_captured / implementation / VISUAL / Phase 13 blocked_pending_user_approval` |
| 成果物 | `docs/30-workflows/serial-05-step-02-identity-conflicts-merge/` |
| 親 workflow | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/serial-05-admin-mutation-ui/` |
| 目的 | `/admin/identity-conflicts` の既存 row-local merge / dismiss UI を `useAdminMutation` に寄せ、400 / 409 error mapping、reason retention、inline alert、visual evidence を hardening する |
| implementation targets | `apps/web/src/components/admin/IdentityConflictRow.tsx`, `apps/web/src/features/admin/hooks/useAdminMutation.ts`, `apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx`, `apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts` |
| API boundary | 既存 `POST /admin/identity-conflicts/:id/merge` / `POST /admin/identity-conflicts/:id/dismiss` を利用。新 endpoint / D1 schema / shared export 追加なし |
| evidence | `docs/30-workflows/serial-05-step-02-identity-conflicts-merge/outputs/phase-11/main.md`, `docs/30-workflows/serial-05-step-02-identity-conflicts-merge/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| user gate | staging / production authenticated evidence、commit、push、PR |

### parallel-09 UX cross-cutting primitives contract（2026-05-15）

| 項目 | 値 |
| --- | --- |
| ステータス | `implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION / implementation_complete_visual_evidence_captured / Phase 12 strict 7 present` |
| 成果物 | `docs/30-workflows/completed-tasks/parallel-09-ux-cross-cutting/` |
| 親 workflow | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/` |
| 原典 | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-09-ux-cross-cutting/spec.md` |
| 目的 | 19 routes 横断 UX primitive（FormField / EmptyState / Pagination / Icon / Breadcrumb / responsive / focus-visible / mutation guard / form preserve）を `apps/web` に実装し、後続 parallel-01〜08 の入力正本として固定する |
| evidence | `outputs/phase-07/test-results.md`, `outputs/phase-11/main.md`, `outputs/phase-11/screenshots/*.png` (12), `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| 境界 | 本 wave は `apps/web` 共通 primitive 実装、local typecheck、Issue #746 local visual screenshots まで完了。staging/production smoke、19-route adoption、commit、push、PR は user-gated |

### PARALLEL-01-NAV admin navigation wayfinding（2026-05-15）

| 項目 | 値 |
| --- | --- |
| ステータス | `implemented_local_runtime_pending / implementation / VISUAL / Phase 12 strict 7 present` |
| 成果物 | `docs/30-workflows/parallel-01-navigation-admin-wayfinding/` |
| source | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-01-navigation/spec.md` |
| 実装 | `AdminSidebar` home link、`MemberDrawer` encoded tags link |
| evidence | component/typecheck/lint/build logs、DOM snapshot、mock fallback PNG 2 files |
| runtime boundary | real authenticated screenshots / staging smoke / commit / push / PR は user-gated |

### Issue #668 residual RB-3b-03 / RB-3b-04 paths filter + shell helper（2026-05-14）

| 項目 | 値 |
| --- | --- |
| ステータス | `implemented-local-runtime-pending / implementation / NON_VISUAL / Phase 12 strict 7 present` |
| 成果物 | `docs/30-workflows/issue-668-stage3b-rb03-rb04-paths-filter-shell-helper/` |
| 親 Issue | Issue #668 CLOSED。PR / Issue comment 文脈は `Refs #668` のみ |
| scope | RB-3b-03 `e2e-tests.yml` single-workflow paths precheck、RB-3b-04 `ci-shell-prelude.sh` + `lint-shell.yml` shellcheck gate + 3-script shellcheck cleanup |
| required context | `e2e-tests-coverage-gate` を維持し、branch protection mutation は不要 |
| implementation targets | `.github/workflows/e2e-tests.yml`, `.github/workflows/lint-shell.yml`, `scripts/lib/ci-shell-prelude.sh`, `scripts/coverage-gate-e2e.sh`, `scripts/coverage-guard.sh`, `scripts/cf-waf-apply/lib.sh`, `scripts/observability-target-diff.sh`, `scripts/verify-09c-no-visual-values.sh` |
| evidence | tracked `outputs/phase-11/local-evidence-summary.md`; raw ignored local logs captured; governance / CI8 dry-run files pending user-gated PR |
| source trace | `docs/30-workflows/unassigned-task/task-e2e-stage3b-rb-followup-composite-actions-001.md` is historical; RB-3b-03 / RB-3b-04 split-migrated here |
| artifact inventory | `references/workflow-issue-668-paths-filter-shell-prelude-artifact-inventory.md` |
| lessons | `references/lessons-learned-issue-668-paths-filter-shell-prelude-2026-05.md` |
| user gate | dry-run PRs, GitHub Actions runtime evidence, `gh issue comment`, commit, push, PR |

### Issue #666 fetch/public service binding regression（2026-05-14）

| 項目 | 値 |
| --- | --- |
| ステータス | `verified / implementation_complete_pending_pr / implementation / NON_VISUAL` |
| 成果物 | `docs/30-workflows/completed-tasks/issue-666-fetch-public-service-binding-regression/` |
| Issue | #666 OPEN。PR 文脈は `Refs #666` |
| source unassigned | `docs/30-workflows/completed-tasks/task-e2e-stage3b-fetch-public-service-binding-priority-regression-001.md`（consumed by Issue #666 workflow） |
| 目的 | `PUBLIC_API_BASE_URL` が production / staging に誤設定されても service binding を skip しない regression guard |
| implementation targets | `apps/web/src/lib/fetch/public.ts`, `apps/web/src/lib/fetch/public.spec.ts` |
| evidence boundary | focused Vitest, typecheck, lint, build, inverse assertion, and grep evidence captured locally; GitHub Actions PR runtime remains user-gated |
| Phase 12 | strict 7 outputs present under `outputs/phase-12/`; root `artifacts.json` is the only artifact ledger |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-666-fetch-public-service-binding-regression-artifact-inventory.md` |
| user gate | commit / push / PR / CI runtime evidence |

### U-FIX-CF-ACCT-01-DERIV-04-FU-03-D-FU-01 metrics dash（2026-05-14）

| 項目 | 値 |
| --- | --- |
| ステータス | `implemented_local_runtime_pending / implementation / VISUAL` |
| 成果物 | `docs/30-workflows/u-fix-cf-acct-01-deriv-04-fu-03-d-fu-01-metrics-dash/` |
| 親 | Issue #586 post-switch 7-day close-out / 祖父 Issue #549 |
| Issue 取扱 | Issue #656 は CLOSED 維持。PR 文脈は `Refs #549, Refs #586, Refs #656` のみ |
| 目的 | `hourly-run-7day-summary.json` を週次集約し、fallback rate / p95 latency / Issue 起票数 / leakage 件数を静的 HTML dashboard で可視化する実装仕様 |
| rendering decision | 現 worktree に admin audit route が無いため static HTML を採択。admin UI は本サイクル外 |
| schema contract | missing version skip、unsupported explicit version / 型不正 throw、`1.0.0` の `week_starting` 欠落は native ISO week 補完 |
| Phase 12 | strict files present under `outputs/phase-12/`; `implementation-guide-part2.md` は root artifacts 由来の追加成果物 |
| user gate | production/staging runtime summary evidence / commit / push / PR |

### fix-cf-deploy-esbuild-import-source-staging-failure（2026-05-17）

| 項目 | 値 |
| --- | --- |
| ステータス | `implemented_local_evidence_captured / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING / Phase 12 strict 7 present` |
| 成果物 | `docs/30-workflows/fix-cf-deploy-esbuild-import-source-staging-failure/` |
| 目的 | `wrangler@4.85.0` が要求する `esbuild@0.27.3` と root `pnpm.overrides.esbuild=0.25.4` の不整合を解消し、Cloudflare deploy build error `"import-source" is not a valid feature name` を修復する |
| implementation targets | `package.json`, `pnpm-lock.yaml`, `scripts/cf.sh` |
| evidence | `outputs/phase-11/main.md`, `outputs/phase-11/manual-smoke-log.md`, `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-fix-cf-deploy-esbuild-import-source-staging-failure-artifact-inventory.md` |
| local verification | `mise exec -- pnpm install --force`, `pnpm why esbuild`, `pnpm exec esbuild --version`, `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare`, `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --dry-run --outdir /tmp/api-bundle` |
| user gate | GitHub Actions deploy-staging, runtime smoke, commit, push, PR |

### Issue #667 Stage 3b mock API fixture coverage（2026-05-14）

| 項目 | 値 |
| --- | --- |
| ステータス | `runtime_pending / implementation / NON_VISUAL / existing-hardening / IMPLEMENTED_LOCAL_RUNTIME_PENDING` |
| 成果物 | `docs/30-workflows/completed-tasks/issue-667-stage3b-mock-api-fixture-coverage/` |
| source unassigned | `docs/30-workflows/unassigned-task/task-e2e-stage3b-mock-api-fixture-coverage-001.md`（implemented_local_runtime_pending） |
| 目的 | `scripts/e2e-mock-api.mjs` を contracts SSOT + contract spec + readiness evidence で harden する |
| implementation targets | `packages/contracts/`, `scripts/e2e-mock-api.mjs`, `scripts/__tests__/e2e-mock-api.contract.spec.ts`, `.github/workflows/e2e-tests.yml`, `.github/workflows/ci.yml` |
| evidence boundary | Runtime implementation and focused Phase 11 local evidence are complete. GitHub Actions runtime evidence remains pending. |
| user gate | commit / push / PR / Issue mutation は user approval 後 |

### Issue #638 CLOUDFLARE_PAGES_PROJECT GitHub Variable deletion（2026-05-14）

| 項目 | 値 |
| --- | --- |
| ステータス | `implemented_local_pending_pr / implementation / NON_VISUAL / external_mutation_completed / Phase 12 strict 7 present` |
| 成果物 | `docs/30-workflows/completed-tasks/issue-638-cloudflare-pages-project-var-deletion/` |
| source unassigned | `docs/30-workflows/unassigned-task/issue-331-followup-001-cloudflare-pages-project-var-deletion.md`（superseded marker 付与） |
| Issue | #638 CLOSED 維持。PR / docs では `Refs #638` のみ |
| 目的 | Issue #331 後に未参照となった GitHub repository variable `CLOUDFLARE_PAGES_PROJECT` を削除し、未参照 variable 0 baseline を確立する |
| evidence | `outputs/phase-11/evidence/current-repo-variables.json`（before variable present）, `source-grep-preflight.txt`（`.github apps packages scripts` hit 0）, `pre-mutation-static-summary.txt`, `user-approval-marker.md`, `before.json`, `before-single.json`, `after.json`（total_count=3）, `after-single.txt`（HTTP 404）, `grep-gate.txt`, `deletion-log.md` |
| user gate | DELETE は approval marker 後に完了済み。rollback `POST`, push, PR, Issue 操作は別途 user approval 後 |
| downstream | `issue-331-followup-002` Pages project physical deletion and OIDC cutover remain separate |

### Issue #616 Miniflare / undici upstream tracking（2026-05-11）


>### UI prototype alignment / MVP recovery task-23 verification status matrix（2026-05-14）

| 項目 | 値 |
| --- | --- |
| ステータス | `verified / docs-only / NON_VISUAL / Phase 12 strict 7 present / Phase 13 blocked_pending_user_approval` |
| 成果物 | `docs/30-workflows/completed-tasks/task-23-ui-mvp-w8-par-verification-status-matrix/` |
| 親 workflow | `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/` |
| 目的 | task-01〜22 を 4 条件（矛盾なし / 漏れなし / 整合性あり / 依存関係整合）で評価する 22 x 4 matrix を生成する |
| generated deliverable | `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/VERIFICATION-STATUS.md` |
| evidence boundary | root/output `artifacts.json` parity、Phase 5/7/9 deterministic matrix evidence、Phase 11 NON_VISUAL marker、Phase 12 strict 7 outputs、compliance check は present、documentation-changelog の Entry Checklist + Validator Execution Log は転記済み |
| lessons-learned | `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-task-23-docs-only-final-deliverable-state-gate-2026-05.md`（L-T23-001..005） |
| skill promotion | `.claude/skills/task-specification-creator/references/phase-12-documentation-guide.md`（final deliverable state gate / `required_at` wording gate / planned wording grep close-out gate）、`.claude/skills/task-specification-creator/SKILL-changelog.md`（v2026.05.14-task23 entry） |
| downstream | `docs/30-workflows/task-27-ui-mvp-w9-solo-mvp-3-layer-task-mapping/` は generated `VERIFICATION-STATUS.md` を入力にできる |
| user gate | commit、push、PR は user approval 後 |

### UI prototype alignment / MVP recovery task-27 3-layer task mapping（2026-05-15）

| 項目 | 値 |
| --- | --- |
| ステータス | `verified / docs-only / NON_VISUAL / Phase 1-12 completed / Phase 13 blocked` |
| 成果物 | `docs/30-workflows/task-27-ui-mvp-w9-solo-mvp-3-layer-task-mapping/` |
| 親 workflow | `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/` |
| generated deliverable | `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/MVP-3LAYER-TASK-MAPPING.md` |
| 目的 | task-01〜22 を `PUB / MEM / ADM / COM` の 88 セル double-entry matrix に整理し、WARN/FAIL、invariant、smoke、readiness を層別に逆引き可能にする |
| inputs | task-23 `VERIFICATION-STATUS.md`、task-24 `INVARIANT-AUDIT.md`、task-25 `SMOKE-COVERAGE-MATRIX.md`、completed task-26 common-surface context |
| evidence | root/output `artifacts.json` parity、`outputs/phase-5/implementation-notes.md`、`outputs/phase-7/coverage.md`、Phase 12 strict 7 |
| artifact inventory | `references/workflow-task-27-ui-mvp-w9-solo-mvp-3-layer-task-mapping-artifact-inventory.md` |
| user gate | commit、push、PR は user approval 後 |

### Issue #616 Miniflare / undici upstream tracking（2026-05-11）
### Issue #623 Vitest spec suffix convergence（2026-05-12）

### UI prototype alignment / MVP recovery task-25 smoke coverage matrix（2026-05-14）

| 項目 | 値 |
| --- | --- |
| ステータス | `spec_created / docs-only / NON_VISUAL / verify_existing / Phase 12 strict 7 present` |
| 成果物 | `docs/30-workflows/task-25-ui-mvp-w8-par-routes-smoke-coverage/` |
| 主成果物 | `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md` |
| 親 workflow | `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/` |
| current fact | `apps/web/playwright/tests/full-smoke.spec.ts` has 17 URL smoke entries; parent SCOPE surfaces total 19 because `error.tsx` and `loading.tsx` are component-only surfaces |
| visual baseline | 4 specs: login, public-top, admin-dashboard, profile |
| evidence | `outputs/phase-11/manual-test-result.md`, `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| artifact inventory | `references/workflow-task-25-ui-mvp-w8-par-routes-smoke-coverage-artifact-inventory.md` |
| user gate | commit / push / PR |

### task-25 follow-up loading state observation fixture（2026-05-16）

| 項目 | 値 |
| --- | --- |
| ステータス | `verified / implementation / NON_VISUAL / implementation_complete_pending_pr` |
| 成果物 | `docs/30-workflows/task-25-followup-loading-state-observation-fixture/` |
| Issue | #711 CLOSED 維持。PR 文脈は `Refs #711` のみ |
| 親 workflow | `docs/30-workflows/completed-tasks/task-25-ui-mvp-w8-par-routes-smoke-coverage/` |
| source unassigned | `docs/30-workflows/completed-tasks/unassigned-task/task-25-followup-loading-state-observation-fixture.md`（consumed） |
| 目的 | `loading.tsx` の `N/A-runtime-observation` を deterministic `/smoke/loading-state` fixture で解消する |
| implementation targets | `apps/web/app/__smoke__/_lib/fixture-guard.ts`, `apps/web/app/__smoke__/_lib/fixture-guard.spec.ts`, `apps/web/app/__smoke__/error-boundary/page.tsx`, `apps/web/app/__smoke__/members-list/page.tsx`, `apps/web/app/__smoke__/loading-state/page.tsx`, `apps/web/app/__smoke__/loading-state/loading.tsx`, `apps/web/app/smoke/error-boundary/page.tsx`, `apps/web/app/smoke/members-list/page.tsx`, `apps/web/app/smoke/loading-state/page.tsx`, `apps/web/app/smoke/loading-state/loading.tsx`, `apps/web/tests/e2e/staging-smoke.spec.ts`, `docs/00-getting-started-manual/specs/09-ui-ux.md` |
| final deliverable | `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md` |
| evidence boundary | Phase 12 strict 7 present。local static evidence captured; full staging runtime smoke / CI / commit / push / PR are user-gated |
| artifact inventory | `references/workflow-task-25-followup-loading-state-observation-fixture-artifact-inventory.md` |

### Issue #616 Miniflare / undici upstream tracking（2026-05-11）

| 項目 | 値 |
| --- | --- |
| ステータス | `verified_current_no_code_change_pending_pr / implementation / NON_VISUAL / conditional / Phase 12 strict 7 present` |
| 成果物 | `docs/30-workflows/completed-tasks/task-issue-577-followup-002-miniflare-undici-upstream-tracking/` |
| 親 workflow | `docs/30-workflows/completed-tasks/issue-577-api-coverage-rerun-miniflare-port-exhaustion/` |
| source unassigned | `docs/30-workflows/completed-tasks/task-issue-577-followup-002-miniflare-undici-upstream-tracking.md`（consumed trace） |
| Issue | #616 CLOSED 維持。#617 は followup-003 のため誤参照禁止 |
| 目的 | Miniflare / undici / workerd の socket / keep-alive / port reuse 改善を triage し、`apps/api` coverage の worker cap 緩和可否を判定する |
| current cap | `apps/api/package.json#scripts.test:coverage` の `--maxWorkers=1 --minWorkers=1` |
| 採用条件 | `--maxWorkers=2 → 4 → auto` の段階評価。候補 N は連続 3 回 133/133 PASS、0 EADDRNOTAVAIL、coverage regression なし。低い候補が fail した場合、より大きい候補は skip 理由を記録して打ち切る |
| 採用時 script 方針 | `--minWorkers` を削除し、`--maxWorkers=<採用N>` のみを正本化 |
| 不変条件 | apps/api runtime code / D1 schema / Cloudflare binding は変更しない |
| artifact inventory | `references/workflow-issue-616-miniflare-undici-upstream-tracking-artifact-inventory.md` |
| user gate | `apps/api/package.json` 編集、commit、push、PR、Issue 操作は user approval 後 |

### task-10 follow-up 002 runtime visual + axe evidence（2026-05-11）

| 項目 | 値 |
| --- | --- |
| ステータス | `verified / implementation / VISUAL_ON_EXECUTION` |
| 成果物 | `docs/30-workflows/completed-tasks/task-10-followup-002-runtime-visual-axe-evidence/` |
| 親 workflow | `docs/30-workflows/completed-tasks/task-10-ui-primitives-spec/` |
| source unassigned | `docs/30-workflows/completed-tasks/task-10-followup-002-runtime-visual-axe-evidence.md` |
| 実装対象 | `apps/web/app/(dev)/primitives-harness/page.tsx`, `apps/web/app/(dev)/layout.tsx`, `apps/web/playwright/tests/ui-primitives-visual.spec.ts`, `apps/web/playwright.config.ts`, `apps/web/src/components/ui/Stat.tsx`, `apps/web/src/components/ui/Sidebar.tsx` |
| evidence boundary | Phase 11 screenshot 37 件 + axe JSON violations 0 は取得済み。`build:cloudflare` は followup-001 esbuild mismatch blocker 継続 |
| user gate | commit / push / PR / staging deploy / production smoke |

### E2E quality uplift Stage 2 sub-task 2d contract-stage-2 spec（2026-05-11）

| 項目 | 値 |
| --- | --- |
| ステータス | implemented-local-runtime-pending / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING / Phase 12 strict 7 present |
| 成果物 | `docs/30-workflows/completed-tasks/task-spec-2d-contract-stage-2/` |
| 親 workflow | `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-2/` |
| source spec | `docs/30-workflows/e2e-quality-uplift-stage-2-sub-tasks/2d-contract-stage-2.md` |
| 実装対象 | `apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts` |
| route export boundary | `DeleteBodyZ`, `ListRequestsQueryZ`, `ListAuditQueryZ` are non-breaking named exports from existing route modules |
| schema boundary | 2d test imports route/shared schemas, parses request/audit response fixtures through exported route response schemas, and keeps `z.object(` count at 0 |
| fixture boundary | 2a/2b/2c inline fixtures must match the 2d standard; `MergeIdentityResponseZ` shared schema wins over handwritten shape |
| evidence | `docs/30-workflows/completed-tasks/task-spec-2d-contract-stage-2/outputs/phase-11/main.md`, `docs/30-workflows/completed-tasks/task-spec-2d-contract-stage-2/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| runtime gate | local implementation test creation, focused Vitest, typecheck, lint, and grep gates passed; commit, push, PR, and CI runtime are user-gated |

### Issue #621 apps/web test suffix rename（2026-05-10）

| 項目 | 値 |
| --- | --- |
| ステータス | implemented-local / implementation / NON_VISUAL / Phase 12 strict outputs present / Phase 13 pending_user_approval |
| 成果物 | `docs/30-workflows/issue-621-apps-web-test-suffix-rename/` |
| Issue | Issue #621 OPEN。PR 文脈は `Refs #621` のみ |
| scope | `apps/web/**/*.test.ts(x)` 70 files; existing Playwright/E2E `*.spec.ts(x)` 17 files untouched |
| classification | component 36 / route 4 / page 1 / runtime 5 / lib-unit 24 |
| implementation sync | `apps/web/package.json`, `.github/workflows/ci.yml`, `apps/web/src/__tests__/static-invariants.runtime.spec.ts`, `scripts/lint-boundaries.mjs`, `scripts/lint-stablekey-literal.mjs`, `apps/web/src/lib/api/me-types.spec-d.ts` |
| evidence | `docs/30-workflows/issue-621-apps-web-test-suffix-rename/outputs/phase-11/main.md`, `rename-mapping.csv`, `test-count-diff.log`, `typecheck.log`, `lint.log`, `verify-design-tokens.log` |
| ADR | `docs/30-workflows/issue-621-apps-web-test-suffix-rename/outputs/phase-12/test-file-suffix-adr-apps-web.md` |
| consumed input | `docs/30-workflows/unassigned-task/task-issue-325-followup-001-apps-web-test-suffix-rename.md` |

### Issue #626 RB-01 build output sharing between Lighthouse and PR build（2026-05-12）

| 項目 | 値 |
| --- | --- |
| ステータス | PASS_BOUNDARY_SYNCED_RUNTIME_PENDING / implementation / NON_VISUAL |
| 成果物 | `docs/30-workflows/completed-tasks/issue-626-rb01-share-build-output-lighthouse-pr-build/` |
| 親 Issue | Issue #626（CLOSED） / parent Stage 3 Issue #608（CLOSED） |
| backlog | `docs/30-workflows/e2e-quality-uplift/backlog.md` RB-01 |
| 目的 | `.github/workflows/lighthouse.yml` の standalone Lighthouse build と `.github/workflows/pr-build-test.yml` の web build を統合し、`.next` artifact を `build-test` から `lighthouse-ci` へ共有する |
| implementation target | `.github/workflows/pr-build-test.yml` edit、`.github/workflows/lighthouse.yml` delete、RB-01 backlog status update |
| trigger boundary | 現行 Lighthouse の dev-base PR 境界を維持し、統合後 `lighthouse-ci` は `if: github.base_ref == 'dev'`。`build-test` は全 PR 継続 |
| evidence boundary | Phase 11 は local command logs、read-only current branch protection JSON、dry-run PR checks pending、merge-time branch protection before/after diff pending を canonical evidence とする |
| state vocabulary | root は `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`。local implementation + deterministic evidence は取得済み、GitHub Actions PR runtime evidence と merge-time governance diff は user-gated。N-day close-out 専用語彙は使わない |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-626-rb01-share-build-output-lighthouse-pr-build-artifact-inventory.md` |
| user gate | commit / push / PR / merge / Issue close mutation は user approval 後 |

### E2E Stage 2 sub-task 2d contract test（2026-05-11）

| 項目 | 値 |
| --- | --- |
| ステータス | verified / implementation / NON_VISUAL / PASS_LOCAL_CANONICAL / Phase 13 pending_user_approval |
| 成果物 | `docs/30-workflows/completed-tasks/e2e-stage-2-2d-contract-stage-2/` |
| 親 workflow | `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-2/` |
| source spec | `docs/30-workflows/e2e-quality-uplift-stage-2-sub-tasks/2d-contract-stage-2.md` |
| source unassigned | `docs/30-workflows/completed-tasks/e2e-stage-2-2d-contract-stage-2-001.md` consumed |
| 目的 | 2a/2b/2c の UI fixture object と admin route zod schema の同型性を pure unit contract test で検証する |
| 実装対象 | `apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts`, `apps/api/src/routes/admin/{member-delete,requests,audit}.ts`, `apps/web/src/lib/admin/server-fetch.ts`, `apps/web/playwright/tests/admin-identity-conflicts.spec.ts` |
| schema boundary | `MergeIdentityResponseZ` は shared schema が正本。2d test 内 `z.object(` は 0 件。requests/audit response envelope は route exported type + `satisfies` で接続 |
| evidence | focused Vitest 23/23 PASS, `@ubm-hyogo/api` typecheck PASS, `@ubm-hyogo/api` lint PASS, grep gate PASS |
| root lint boundary | root `pnpm lint` は既存 `apps/web` `monocart-reporter` type resolution で blocked。本 API contract change の判定には `@ubm-hyogo/api` lint/typecheck を使う |
| artifact inventory | `references/workflow-e2e-stage-2-2d-contract-artifact-inventory.md` |
| user gate | commit / push / PR は user approval 後のみ |

### Issue #590 Phase 11 canonical evidence paths（2026-05-10）

| 項目 | 値 |
| --- | --- |
| ステータス | implemented-local / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING |
| 成果物 | `docs/30-workflows/completed-tasks/issue-590-phase11-canonical-evidence-paths/` |
| 目的 | Phase 11 runtime evidence path の表記揺れを `outputs/phase-11/canonical-paths.json` と validator で排除する |
| 実装対象 | `.claude/skills/task-specification-creator/schemas/phase11-evidence-canonical-paths.schema.json`, `.claude/skills/task-specification-creator/scripts/validate-phase11-canonical-evidence-paths.js`, `.claude/skills/task-specification-creator/scripts/__tests__/validate-phase11-canonical-evidence-paths.test.mjs`, `.claude/skills/task-specification-creator/package.json`, `package.json#scripts.validate:phase11-paths` |
| 親適用 | `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/outputs/phase-11/canonical-paths.json` |
| source unassigned | `docs/30-workflows/completed-tasks/u-fix-cf-acct-01-deriv-04-fu-03-d-followup-05.md`（superseded / consumed） |
| evidence boundary | 本タスクは schema / validator 導入のみ。親 #549 の post-merge 7 day runtime observation は別 gate |
| artifact inventory | `references/workflow-issue-590-phase11-canonical-evidence-paths-artifact-inventory.md` |
| user gate | commit / push / PR は user approval 後 |

### UT-15 WAF / Rate Limiting Rules Setup（2026-05-09）

### Issue #589 Gate metadata structured ledger（2026-05-10）

| 項目 | 値 |
| --- | --- |
| ステータス | `implemented_local_runtime_pending / implementation / NON_VISUAL` |
| 成果物 | `docs/30-workflows/completed-tasks/issue-589-gate-metadata-structured-ledger/` |
| 親 | Issue #549 Cloudflare Audit Logs ML production switch |
| source | `docs/30-workflows/unassigned-task/u-fix-cf-acct-01-deriv-04-fu-03-d-followup-04.md` |
| 目的 | `artifacts.json.metadata.gates[]` の schema / validator / CI gate / Phase 12 結線 / Issue #549 backfill を実装・仕様化する |
| SSOT | `references/gate-metadata.md` |
| local implementation | `packages/shared/src/gate-metadata/**`, `scripts/gate-metadata/**`, `.github/workflows/verify-gate-metadata.yml`, root `package.json`, Issue #549 artifacts mirror backfill |
| evidence boundary | schema / validator / CI workflow file / #549 backfill / Phase 12 strict 7 / aiworkflow discovery sync は完了。branch protection PUT / commit / push / PR は user-gated |
| pending user-gated operation | PR/merge 承認後に `verify-gate-metadata / validate` を dev/main required status check へ追加する。実 `gh api -X PUT` はユーザー明示承認まで禁止 |
| Issue 取扱 | #589 / #549 CLOSED 維持。PR 文脈は `Refs #589` / `Refs #549` のみ |


### E2E quality uplift Stage 2 sub-task 2c admin member delete spec（2026-05-10）

| 項目 | 値 |
| --- | --- |
| ステータス | implemented-local-runtime-pending / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING / Phase 12 completed |
| 成果物 | `docs/30-workflows/admin-member-delete-e2e-spec/` |
| 親 workflow | `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-2/` |
| source spec | `docs/30-workflows/e2e-quality-uplift-stage-2-sub-tasks/2c-admin-member-delete.md` |
| source unassigned | `docs/30-workflows/unassigned-task/e2e-stage-2-2c-admin-member-delete-001.md`（consumed trace） |
| 実装対象 | `apps/web/playwright/tests/admin-member-delete.spec.ts`, `apps/web/src/lib/admin/server-fetch.ts`, `apps/web/playwright.config.ts` |
| mock boundary | initial members/audit は Server Component `fetchAdmin()` 経由の server-side fetch。browser `page.route()` は drawer detail / delete mutation のみ |
| UI reflection | `MemberDrawer` delete/restore mutation result を `MembersClient` が受け、対象行の `削除済み` 表示を即時更新してから `router.refresh()` |
| reusable refs | `references/workflow-admin-member-delete-e2e-spec-artifact-inventory.md`, `lessons-learned/lessons-learned-admin-member-delete-e2e-2026-05.md` |
| evidence | `docs/30-workflows/admin-member-delete-e2e-spec/outputs/phase-11/evidence/e2e-run.txt`（desktop-chromium 5 passed / 1 skipped） |
| runtime gate | firefox / webkit / staging / CI、commit / push / PR は user approval 後 |

### UI prototype alignment task-17 admin schema-conflicts-audit（2026-05-10）

| 項目 | 値 |
| --- | --- |
| ステータス | `implemented-local / implementation / VISUAL_ON_EXECUTION / local_visual_evidence_pass` |
| 成果物 | `docs/30-workflows/completed-tasks/task-17-admin-schema-conflicts-audit/` |
| source spec | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/07-screens-admin/task-17-w6-par-admin-schema-conflicts-audit.md` |
| 目的 | `/admin/schema`、`/admin/identity-conflicts`、`/admin/audit` の既存 admin UI を current API contract に合わせて hardening する実装仕様 |
| 実装境界 | 新規 route tree ではなく `apps/web/app/(admin)/admin/{schema,identity-conflicts,audit}/page.tsx` と `apps/web/src/components/admin/*` / `apps/web/src/lib/admin/*` を patch |
| API 境界 | `apps/api/src/routes/admin/{schema,sync-schema,identity-conflicts,audit}.ts` は read-only。新 endpoint / D1 schema 追加なし |
| 依存 | task-09 / task-10 は completed-tasks、task-15 は `ui-prototype-alignment-mvp-recovery/07-screens-admin/task-15-w5-par-admin-dashboard-and-members.md`。task-16 と並列、task-18 は staging/CI smoke を継続 |
| evidence | `docs/30-workflows/completed-tasks/task-17-admin-schema-conflicts-audit/outputs/phase-11/phase11-capture-metadata.json` / `docs/30-workflows/completed-tasks/task-17-admin-schema-conflicts-audit/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| Phase 13 | commit / push / PR outputs は user approval 後のみ生成 |

### Issue #603 phase-12 compliance-check CI gate（2026-05-11）

| 項目 | 値 |
| --- | --- |
| ステータス | implemented_local_runtime_pending / implementation / NON_VISUAL / Phase 12 strict 7 outputs present / Phase 13 pending_user_approval |
| 成果物 | `docs/30-workflows/issue-603-phase12-compliance-check-ci-gate/` |
| Issue | Issue #603 CLOSED。PR 文脈は `Refs #603` のみ |
| CI gate | `.github/workflows/verify-phase12-compliance.yml` |
| implementation targets | `scripts/verify-phase12-compliance.ts`, `scripts/lib/phase12-compliance/**`, `scripts/__tests__/verify-phase12-compliance.test.ts`, `scripts/__tests__/fixtures/phase12-compliance/**` |
| canonical SSOT | `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md` Required Sections 9 項目 |
| user gate | commit / push / PR creation / PR-side CI log capture |
| artifact inventory | `references/workflow-issue-603-phase12-compliance-check-ci-gate-artifact-inventory.md` |

### UI prototype alignment / MVP recovery task-16 admin tags meetings requests（2026-05-10）

| 項目 | 値 |
| --- | --- |
| ステータス | implemented-local / implementation / VISUAL_ON_EXECUTION / IMPLEMENTED_LOCAL_RUNTIME_PENDING / Phase 12 completed |
| 成果物 | `docs/30-workflows/task-16-admin-tags-meetings-requests/` |
| 目的 | `/admin/tags`, `/admin/meetings`, `/admin/requests` を現行 admin 実装正本に合わせて補強・検証する仕様パッケージ |
| 実装対象 | `apps/web/app/(admin)/admin/{tags,meetings,requests}/page.tsx`, `apps/web/src/components/admin/{TagQueuePanel,MeetingPanel,RequestQueuePanel}.tsx`, `apps/web/src/lib/admin/{api,server-fetch}.ts` |
| API 境界 | `apps/api` と `apps/web/app/api/admin/[...path]/route.ts` は read-only。requests は `POST /admin/requests/:noteId/resolve`、tags は `POST /admin/tags/queue/:queueId/resolve` |
| drift 修正 | stale `apps/web/src/app` / `src/features/admin` / `lib/api/admin-*` / `adminClient` / `/decision` / `approved` を normative contract から撤回 |
| 上流 | task-09 tokens / task-10 primitives / task-15 admin layout / task-21 admin blueprint |
| 下流 | task-18 regression smoke / visual evidence |
| evidence boundary | Phase 12 strict 7 + artifacts parity + Phase 11 pending runtime evidence marker are present. Runtime screenshots, staging smoke, commit, push, and PR are user-gated |
| artifact inventory | `references/workflow-task-16-admin-tags-meetings-requests-artifact-inventory.md` |

### UT-15 WAF / Rate Limiting Rules Setup（2026-05-09）

| ステータス | implemented-local-runtime-pending / implementation / NON_VISUAL / Phase 12 strict 7 outputs present / Phase 13 blocked_pending_user_approval |
| 成果物 | `docs/30-workflows/completed-tasks/ut-15-waf-rate-limiting-rules-setup/` |
| Issue | Issue #18 CLOSED。PR 文脈は `Refs #18` のみ |
| Cloudflare phase contract | Custom Rules `http_request_firewall_custom` -> Rate Limiting `http_ratelimit` -> Managed Rules `http_request_firewall_managed` |
| Rate Limiting contract | `http_ratelimit` entry point ruleset with rule-level `ratelimit` object |
| Workers binding boundary | Optional Worker-side rate limit uses current `[[ratelimits]]`; initial UT-15 implementation keeps it no-op |
| user gate | Cloudflare mutation / production Enforce / seven-day observation / commit / push / PR are Phase 13 user-gated |
| inventory | `references/workflow-ut-15-waf-rate-limiting-rules-setup-artifact-inventory.md` |
| canonical spec | `references/cloudflare-edge-security.md` |
| lessons | `references/lessons-learned-ut-15-waf-rate-limiting.md` |

### E2E quality uplift Stage 2 sub-task 2b admin identity conflicts spec（2026-05-09）

| 項目 | 値 |
| --- | --- |
| ステータス | runtime_pending / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING / Phase 12 completed |
| 成果物 | `docs/30-workflows/2b-admin-identity-conflicts-spec/` |
| 親 workflow | `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-2/` |
| source spec | `docs/30-workflows/e2e-quality-uplift-stage-2-sub-tasks/2b-admin-identity-conflicts.md` |
| source unassigned | `docs/30-workflows/unassigned-task/e2e-stage-2-2b-admin-identity-conflicts-001.md`（formalized trace） |
| 実装対象 | `apps/web/playwright/tests/admin-identity-conflicts.spec.ts`, `apps/web/src/lib/admin/server-fetch.ts`, `apps/web/playwright.config.ts`, `packages/shared/src/schemas/identity-conflict.ts` |
| mock boundary | initial list は Server Component `fetchAdmin()` 経由の server-side fetch。browser `page.route()` は `/api/admin/identity-conflicts/*/{merge,dismiss}` のみ |
| schema boundary | `IdentityConflictRowZ` の `conflictId` / `candidateTargetMemberId` / `matchedFields` / `detectedAt` / `responseEmailMasked` / `syncJobId` を正本化 |
| fixture boundary | `test` / `expect` を `apps/web/playwright/fixtures/auth.ts` から import。`adminPage` named import 禁止 |
| evidence | `docs/30-workflows/2b-admin-identity-conflicts-spec/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| runtime gate | local chromium Phase 11 evidence 取得済み。firefox / webkit / staging / CI、commit / push / PR は user approval 後 |

### UI prototype alignment / MVP recovery task-14 my profile and requests（2026-05-09）

| 項目 | 値 |
| --- | --- |
| ステータス | PASS_BOUNDARY_SYNCED_RUNTIME_PENDING / implementation / VISUAL_ON_EXECUTION / IMPLEMENTED_LOCAL_RUNTIME_PENDING / Phase 13 pending_user_approval |
| 成果物 | `docs/30-workflows/task-14-my-profile-and-requests/` |
| 目的 | `/profile` を公開状態バナー / 公開範囲サマリ / 申請パネル / 削除申請 Dialog の 4 領域に再構成する実装仕様を固定する |
| API 境界 | `apps/api/src/routes/me/*` と `apps/web/app/api/me/*` は read-only。component は `fetchAuthed("/me/*")` を使い `/api/me/*` を hardcode しない |
| UI 境界 | 現 local 実装では Dialog が submit 副作用を保持。純 UI + client island submit 分離は設計目標だが未達のため runtime PASS 条件にしない |
| selector contract | `public-visibility-banner`, `status-summary`, `request-action-panel`, `visibility-request-dialog`, `delete-request-dialog` |
| 上流 | task-09 OKLch tokens / task-10 UI primitives / task-13 login redirect |
| 下流 | task-18 regression smoke / verify-design-tokens |
| evidence boundary | Phase 12 strict 7 + artifacts parity + Phase 11 deterministic evidence は present。apps/web implementation は local reflected。authenticated screenshot / visual runtime evidence / staging deploy / production smoke / commit / push / PR は user approval 後 |
| artifact inventory | `references/workflow-task-14-my-profile-and-requests-artifact-inventory.md` |

### parallel-i03 profile request dialog refresh order（2026-05-17）

| 項目 | 値 |
| --- | --- |
| ステータス | implemented_local_evidence_captured / implementation / NON_VISUAL / Phase 13 pending_user_approval |
| 成果物 | `docs/30-workflows/parallel-i03-dialog-refresh-order/` |
| 目的 | profile request dialog の success path を `router.refresh() -> onSubmitted -> onClose()` に固定し、unmount 後 refresh race と parent 側二重発火を排除する |
| 実装対象 | `apps/web/app/profile/_components/VisibilityRequestDialog.tsx`, `DeleteRequestDialog.tsx`, `RequestActionPanel.tsx` |
| test evidence | dialog 2 件の `callOrder` assertion と parent `router.refresh` 非発火 assertion |
| source spec | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i03-dialog-refresh-order/spec.md` |
| artifact inventory | `references/workflow-parallel-i03-dialog-refresh-order-artifact-inventory.md` |
| lessons-learned | `references/lessons-learned-parallel-i03-dialog-refresh-order-2026-05.md`（L-PARALLEL-I03-001..005: refresh 順序契約 / 409 分岐漏れ gate / `vi.hoisted` callOrder pattern / 親 spec の子 dialog inline mock / completed-tasks path drift） |
| user gate | commit / push / PR |

### E2E Quality Uplift Stage 0-3（2026-05-09）

| 項目 | 値 |
| --- | --- |
| ステータス | Stage 0: `implementation_complete_pending_pr` / Stage 1: `implemented_local / implementation_complete_e2e_verification_recorded` / Stage 2: `spec_verified_pending_dependency` / Stage 3: `implemented_local_runtime_pending`（branch protection apply + verify captured・Phase 12 strict 7 PASS / 2026-05-12 Issue #608 land） |
| 区分 | NON_VISUAL（4 stage いずれも） |
| 成果物 | `docs/30-workflows/e2e-quality-uplift-stage-{0,1,2,3}/` |
| 目的 | E2E 品質 uplift を 4 stage 分割: Stage 0 Playwright 整備 / Stage 1 regression assertion 拡充 / Stage 2 tier-aware coverage 自動 enforcement / Stage 3 branch protection contexts 正本化 |
| Stage 0 implementation | `apps/web/playwright/README.md`（7章）/ `playwright.config.ts` (`evidence-capture` project) / `apps/web/package.json#scripts.e2e`（`--project=desktop-chromium,desktop-firefox,mobile-webkit`）/ `tests/profile-readonly-logged-in.spec.ts` rename/extract / `quality-gates.md §7.1 (4)` 8 行例外 |
| Stage 1 implementation | `apps/web/playwright/fixtures/auth.ts`（HS256 JWT 署名）/ `/me/profile` server fetch 用 mock API fixture / regression assertion: email leak / visibility round-trip / delete round-trip / tracked `.txt` evidence |
| Stage 2 spec | tier 閾値 `critical ≥80% / standard ≥80% / experimental ≥50%`、workspace 80% guard と責務分離。実装 land は別 cycle |
| Stage 3 implementation | 3b `e2e-tests-coverage-gate` は `.github/workflows/e2e-tests.yml` で PR to `dev` / `main` に発火し、deterministic mock API (`scripts/e2e-mock-api.mjs`) + Monocart + line coverage 80% gate を実装済み。3a `lighthouse-ci` は `.github/workflows/lighthouse.yml` で `workflow_dispatch` と `wait-on` readiness を持つ。3c branch protection contexts の operational SSOT は GitHub branch protection fresh GET、repo 側 desired contexts manifest は `.github/branch-protection/{dev,main}.json`。drift 検出 `bash scripts/verify-branch-protection.sh` / `gh api repos/daishiman/UBM-Hyogo/branches/{dev,main}/protection | jq '.required_status_checks.contexts'`。branch protection PUT + verify evidence は `docs/30-workflows/e2e-quality-uplift-stage-3/outputs/phase-11/` に captured |
| 依存 | 逐次依存（Stage N+1 は Stage N の land 後）。Stage 2 は Stage 1 implemented_local + workspace guard 境界確定後 |
| evidence boundary | Stage 0/1 は tracked runtime evidence (`evidence/*.txt`)。Stage 2 は placeholder。Stage 3 は branch protection apply/verify captured + PR CI required 表示 / Lighthouse run pending user approval |
| Phase 12 strict 7 | 全 stage に present。validator-first close-out（prose-only done table より曖昧でない） |
| 苦戦箇所 | L-E2EQU-002A: Server Component の `fetchAuthed()` は Node 側で実行されるため、Playwright の `page.route("**/api/me/profile")` だけでは server state を差し替えられない。server fetch 用 mock fixture / `INTERNAL_API_BASE_URL` 差し替えが必須 |
| tier policy 正本 | `.claude/skills/task-specification-creator/references/coverage-standards.md`、`quality-gates.md §7.1 (4)` |
| artifact inventory | `references/workflow-e2e-quality-uplift-stage-0-3-artifact-inventory.md` |
| lessons | `lessons-learned/lessons-learned-e2e-quality-uplift-stages-2026-05.md`（L-E2EQU-001..015 + 002A + Stage 3 land で L-E2EQU-S3A-001 desired-state manifest 三層 / L-E2EQU-S3A-002 INV declared drift 同 PR 取り込み判定 / L-E2EQU-S3A-003 集約 required context + `nohup`+`wait-on` readiness を追加） |
| canonical refs | `references/branch-protection-desired-state-manifest.md`（Stage 3 land で新規 canonical 化。manifest/adapter/verifier 三層の SSOT） |
| changelog | `changelog/20260509-e2e-quality-uplift-stage0-3.md` |
| user gate | runtime tier enforcement / PR CI required 表示 / Lighthouse run / commit / push / PR は user approval 後 |

### CI pipeline recovery web CD and runtime smoke（2026-05-09）

| 項目 | 値 |
| --- | --- |
| ステータス | implemented-local-runtime-pending / implementation / NON_VISUAL / Phase 13 pending_user_approval |
| 成果物 | `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/` |
| 目的 | `web-cd / deploy-staging` の Pages 25 MiB failure と `runtime-smoke-staging` の environment secret 欠落 failure を同一 cycle で local 修復する |
| 実装対象 | `.github/workflows/web-cd.yml`, `.github/workflows/runtime-smoke-staging.yml`, `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md`; `scripts/smoke/provision-staging-secrets.sh` はユーザー実行用 helper |
| task-01 | `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/task-01-web-cd-secret-name-alignment/`。historical task-01 では `web-cd.yml` が environment-scoped `secrets.CLOUDFLARE_API_TOKEN` を job env `CLOUDFLARE_API_TOKEN` に注入し、staging/production 両 job で `Verify CF token is present` early-fail step を持っていた。Issue #640 以降の current contract は deploy step 内 validation + step-scoped token injection であり、job env / separate verify step は superseded |
| task-02 | `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/task-02-runtime-smoke-staging-secrets-provisioning/`。`runtime-smoke-staging.yml` は `STAGING_API_BASE` / `STAGING_ADMIN_BEARER` / `STAGING_MEMBER_ID` / `STAGING_ME_BEARER` を smoke 実行前に name-only early-fail し、`staging-runtime-smoke` secret 投入 runbook と Phase 12 strict 7 outputs を持つ |
| 正本同期 | `deployment-gha.md`, `deployment-cloudflare.md`, `deployment-secrets-management.md`, Issue #571 `phase-11.md` |
| evidence boundary | Phase 12 strict outputs present。secret placement / deploy run / runtime smoke / Slack failure injection は user approval 後 |
| compliance | task-01: `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/task-01-web-cd-secret-name-alignment/outputs/phase-12/phase12-task-spec-compliance-check.md`; task-02: `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/task-02-runtime-smoke-staging-secrets-provisioning/outputs/phase-12/phase12-task-spec-compliance-check.md` |

### web-app-route-bundle-parse-fix（2026-05-09）

| 項目 | 値 |
| --- | --- |
| ステータス | implemented-local / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING / Phase 13 blocked_pending_user_approval |
| 成果物 | `docs/30-workflows/web-app-route-bundle-parse-fix/` |
| 目的 | Next.js 16 Turbopack default が App Route Handler bundle に残す `[project]/...` virtual specifier による Cloudflare Worker parse fail を、OpenNext 互換の webpack build に切り替えて解消する |
| 実装対象 | `apps/web/package.json`, `scripts/patch-next-standalone-instrumentation.mjs` |
| evidence | typecheck / lint / `build:cloudflare` / `.open-next/worker.js` `[project]/` grep PASS |
| runtime gate | staging / production deploy, smoke, tail evidence, commit / push / PR are user-gated |
| inventory | `references/workflow-web-app-route-bundle-parse-fix-artifact-inventory.md` |
| lessons | `references/lessons-learned-web-app-route-bundle-parse-fix-2026-05.md` |

### UI prototype alignment / MVP recovery task-05 error boundary and staging smoke（2026-05-09）

| 項目 | 値 |
| --- | --- |
| ステータス | implemented-local / implementation / runtime evidence pending_user_approval / VISUAL_ON_EXECUTION / IMPLEMENTED_LOCAL_RUNTIME_PENDING |
| 成果物 | `docs/30-workflows/task-05-error-boundary-and-staging-smoke/` |
| 目的 | App Router `error.tsx` / `global-error.tsx` / `not-found.tsx` / `loading.tsx` と 19 routes staging smoke の実装仕様を固定する |
| route SSOT | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/specs/staging-smoke-checklist.md` |
| fixture gate | `ENABLE_STAGING_SMOKE_FIXTURE=1` required; `NODE_ENV` fixture control forbidden |
| 上流 | task-02 env / task-03 Sentry / task-04 logger |
| 下流 | task-18 regression smoke |
| evidence boundary | Phase 12 strict 7 + artifacts parity は present。staging deploy / runtime Playwright / Sentry dashboard / commit / push / PR は user approval 後 |
| artifact inventory | `references/workflow-task-05-error-boundary-and-staging-smoke-artifact-inventory.md` |

### UI prototype alignment task-26 error boundary token utility migration（2026-05-14）

| 項目 | 値 |
| --- | --- |
| ステータス | verified / implementation / VISUAL / Phase 13 pending_user_approval |
| 成果物 | `docs/30-workflows/completed-tasks/task-26-ui-mvp-w8-par-error-tsx-token-utility-migration/` |
| ステータス | implemented_local_evidence_captured / implementation / VISUAL / Phase 13 pending_user_approval |
| 成果物 | `docs/30-workflows/task-26-ui-mvp-w8-par-error-tsx-token-utility-migration/` |
| 実装対象 | `apps/web/app/error.tsx`, `apps/web/app/not-found.tsx`, `apps/web/app/loading.tsx` |
| テスト | `apps/web/app/__tests__/error.component.spec.tsx` |
| 視覚証跡 | `outputs/phase-11/screenshots/not-found-desktop.png` |
| artifact inventory | `references/workflow-task-26-ui-mvp-w8-par-error-tsx-token-utility-migration-artifact-inventory.md` |
| 境界 | token SSOT / Tailwind bridge は不変。consumer className の stale token literal のみ utility 化 |
| 下流 | task-18 verify-design-tokens / Playwright broad visual smoke |
| evidence boundary | Phase 11 screenshot + Phase 12 strict 7 + artifacts parity は present。task-18 broad visual smoke と commit / push / PR は user approval 後 |

### Issue #555 audit correlation salt rotation（2026-05-08）

| 項目 | 値 |
| --- | --- |
| ステータス | implemented-local / implementation / NON_VISUAL / runtime evidence blocked_upstream_pending |
| 成果物 | `docs/30-workflows/completed-tasks/issue-555-audit-correlation-salt-rotation-automation/` |
| parent | Issue #516 audit correlation |
| source | `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-04-FU-04-FU-03-salt-rotation-automation.md` |
| 目的 | `AUDIT_CORRELATION_SALT` の 4-mode rotation と `fingerprintVersion=2` bridge を local 実装する |
| type contract | 既存 `NormalizedAuditEvent` / `CorrelationKey` を拡張。並行 `FingerprintRecord` モデルは作らない |
| secret SSOT | `references/deployment-secrets-management.md`。`references/secrets-management.md` は新設しない |
| runtime gate | FU-01 live wiring 完了後に staging evidence を取得。production rotation / commit / push / PR は user approval 後。production mutating script mode requires `--confirm-production` |
| compliance | `docs/30-workflows/completed-tasks/issue-555-audit-correlation-salt-rotation-automation/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| inventory | `references/workflow-issue-555-audit-correlation-salt-rotation-artifact-inventory.md` |
| lessons | `references/lessons-learned-issue-555-audit-correlation-salt-rotation-2026-05.md` |
| phase-12 logs | `outputs/phase-12/indexes-rebuild.log`, `outputs/phase-12/issue-555-state.log` |

### UI prototype alignment / MVP recovery task-05 error boundary and staging smoke（2026-05-09）

| 項目 | 値 |
| --- | --- |
| ステータス | implemented-local / implementation / runtime evidence pending_user_approval / VISUAL_ON_EXECUTION / IMPLEMENTED_LOCAL_RUNTIME_PENDING |
| 成果物 | `docs/30-workflows/task-05-error-boundary-and-staging-smoke/` |
| 目的 | App Router `error.tsx` / `global-error.tsx` / `not-found.tsx` / `loading.tsx` と 19 routes staging smoke の実装仕様を固定する |
| route SSOT | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/specs/staging-smoke-checklist.md` |
| fixture gate | `ENABLE_STAGING_SMOKE_FIXTURE=1` required; `NODE_ENV` fixture control forbidden |
| 上流 | task-02 env / task-03 Sentry / task-04 logger |
| 下流 | task-18 regression smoke |
| evidence boundary | Phase 12 strict 7 + artifacts parity は present。staging deploy / runtime Playwright / Sentry dashboard / commit / push / PR は user approval 後 |
| artifact inventory | `references/workflow-task-05-error-boundary-and-staging-smoke-artifact-inventory.md` |

### Issue #553 Live audit-correlation endpoint（2026-05-08）

| 項目 | 値 |
| --- | --- |
| ステータス | implemented-local / implementation / NON_VISUAL / IMPLEMENTED_LOCAL_RUNTIME_PENDING / Phase 13 blocked_pending_user_approval |
| 成果物 | `docs/30-workflows/issue-553-live-audit-correlation-endpoint/` |
| 親 | Issue #516 GitHub audit log cross-source correlation |
| 目的 | FU-01 live wiring: Cloudflare Worker route + cron + D1 redact-safe persistence + HIGH Slack incoming webhook notification をローカル実装し、runtime operation を user gate に分離 |
| 実装対象 | `apps/api/src/routes/audit-correlation/`, `apps/api/src/audit-correlation/{scheduled,run-correlation,persist,notify-slack,runbook-url}.ts`, `apps/api/wrangler.toml`, `apps/api/migrations/*audit_correlation_findings.sql`, `scripts/audit-correlation/`, `.github/workflows/audit-correlation-verify.yml`, `docs/runbooks/audit-correlation.md` |
| evidence boundary | Phase 11 は local evidence / staging runtime evidence path を分離。Cloudflare deploy / D1 apply / secrets / production PASS は user approval 後に取得 |
| approval boundary | Cloudflare deploy / D1 apply / secret injection / commit / push / PR は G1-G4 user approval 後のみ |
| SSOT | `references/audit-correlation.md` §Issue #553 Live Wiring Formalization / §Live wiring (Issue #553) implementation landing / §Additional implementation surface / §Cloudflare Secrets (5 種) op-reference rule / §Salt rotation procedure / §Lessons learned (Issue #553 wave) |
| 苦戦記録 | L-AC553-001..007（scheduled retry 不可 / Slack per-finding 部分成功 / INSERT OR IGNORE dedup / fixture vs grep gate 整合 / runbook-url SSOT / env validate throw / redact 3 層） |

### Issue #549 Cloudflare Audit Logs ML production switch（2026-05-08 → 2026-05-09 #586 close-out）

| 項目 | 値 |
| --- | --- |
| ステータス | Issue #586（Refs #549）で workflow YAML 改修 + 7day summary workflow 新規 + SSOT 同期。本サイクル merge 前 = `implemented_local_runtime_pending` / merge 後 = `pass_boundary_synced_runtime_pending` / D+7 168 snapshots 完走後 = `pass_runtime_synced` |
| 成果物 | `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/` + `docs/30-workflows/issue-586-post-switch-7day-close-out/` |
| 親 | Issue #515 ML-ready classifier / Issue #518 HOLD（#586 で解除） |
| switch contract | production env で `vars.CF_AUDIT_CLASSIFIER=ml`（Gate-RUNTIME-CLASSIFIER-SET）+ `.github/workflows/cf-audit-log-monitor.yml` の hourly post-step 3 点 + artifact upload |
| model path | `ML_MODEL_PATH=op://Employee/ubm-hyogo-env/CF_AUDIT_ML_MODEL_PATH_PROD`（解決値は記録しない） |
| observation | production switch merge 後 7 日 / 168 hourly snapshots / fallback rate / p95 latency / leakage grep / `cf-audit-log-7day-summary.yml` で集約 |
| rollback | `gh variable set CF_AUDIT_CLASSIFIER --env production --body "threshold"` 1 行戻し。D1 `classifier_used` / `classifier_version` / `confidence` は削除しない |
| evidence | 本サイクル: local 5 evidence (`typecheck.log`/`lint.log`/`test.log`/`build.log`/`grep-gate.log`)。D+7: `hourly-run-7day.md` / `hourly-run-7day-summary.json` / `leakage-grep-7day.log` / `issue-rate-comparison.md` |
| 境界 | Issue #549 / #586 は CLOSED のまま `Refs #549, Refs #586`。D1 schema 変更なし（forward-safe）|

### Issue #655 D+7 recovery 2nd-cycle（2026-05-14）

| 項目 | 値 |
| --- | --- |
| 状態 | `implemented-local-runtime-pending / implementation / NON_VISUAL / IMPLEMENTED_LOCAL_RUNTIME_PENDING` |
| 成果物 | `docs/30-workflows/completed-tasks/issue-655-d7-recovery-2nd-cycle/` |
| parent | Issue #586 post-switch 7 day close-out |
| grandparent | Issue #549 Cloudflare Audit Logs ML production switch |
| 目的 | #586 D+7 evidence の不足または未生成を root-cause 分類し、PR-A で recovery support を実装、D'+7 後の PR-B で `*-recovery.*` evidence と SSOT 昇格を行う |
| evidence boundary | PR-A local implementation and local verification evidence are captured. 実 `gh run list` / workflow_dispatch / D'+7 aggregate は user approval 後 |
| state vocabulary | `recovery_active` 等は operation label として扱い、独自 workflow_state は使わず、canonical `implemented-local-runtime-pending` / `runtime_pending` / `completed` と分離 |
| user gate | commit / push / PR / workflow_dispatch / secret or variable mutation / `pass_runtime_synced` promotion は user approval 後のみ |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-655-d7-recovery-2nd-cycle-artifact-inventory.md` |

### Issue #720 CF audit monitor environment protection fix（2026-05-16）

| 項目 | 値 |
| --- | --- |
| 状態 | `implemented_local_runtime_pending / implementation / NON_VISUAL` |
| 成果物 | `docs/30-workflows/issue-720-cf-audit-monitor-env-protection-fix/` |
| source | `docs/30-workflows/completed-tasks/task-issue-655-cf-audit-log-monitor-production-env-protection-001.md` consumed |
| parent | `docs/30-workflows/completed-tasks/issue-655-d7-recovery-2nd-cycle/` |
| local diff | `.github/workflows/cf-audit-log-monitor.yml` から `environment: production` を削除 |
| purpose | GitHub production deployment environment branch policy による `dev` scheduled monitor run block を解消し、post-merge runtime evidence へ進める |
| evidence boundary | Phase 11 runtime paths are `PENDING_USER_GATE` placeholders; dry run / six scheduled successes / heartbeat are not local PASS |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-720-cf-audit-monitor-env-protection-fix-artifact-inventory.md` |
| user gate | repo secret/variable mirror / commit / push / PR / workflow_dispatch / six scheduled successes / D'+0 declaration / production env monitor secret cleanup |

### Issue #587 Cloudflare Audit Logs ML model artifact rotation（2026-05-10）

| 項目 | 値 |
| --- | --- |
| 状態 | `implemented_local_runtime_pending / implementation / NON_VISUAL` |
| 成果物 | `docs/30-workflows/issue-587-cf-audit-ml-artifact-rotation/` |
| parent | `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/` |
| runbook | `docs/30-workflows/runbooks/ml-model-artifact-rotation.md` |
| 目的 | 次世代 ML model artifact の candidate evaluation / canary / promotion / rollback を Gate-R0〜R3 と user approval 境界付きで再現可能にする |
| runtime境界 | rotation scripts / canary workflow は local 実装済み。Phase 11 evidence は typecheck / lint / focused tests / leakage grep / dataset grep / local fixture canary / rotation evidence を取得済み。production artifact promotion は Gate-R0〜R3 + user approval pending |
| 正本同期 | `references/observability-monitoring.md` / `references/deployment-secrets-management.md` / `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` / quick-reference / resource-map / LOGS |
| Issue 取扱 | Issue #587 / #549 は CLOSED 維持。PR 文脈は `Refs #549, #587` のみ |

### Issue #588 fallback alert Slack / mail extension（2026-05-10）

| 項目 | 値 |
| --- | --- |
| ステータス | implemented-local-runtime-pending / implementation / NON_VISUAL / IMPLEMENTED_LOCAL_RUNTIME_PENDING |
| 成果物 | `docs/30-workflows/issue-588-fallback-alert-slack-mail-extension/` |
| parent | Issue #549 Cloudflare Audit Logs ML production switch |
| source | `docs/30-workflows/unassigned-task/u-fix-cf-acct-01-deriv-04-fu-03-d-followup-03.md` consumed |
| 実装対象 | `scripts/cf-audit-log/observation/fallback-rate-alert.ts`, `scripts/cf-audit-log/observation/__tests__/fallback-rate-alert.test.ts`, `.github/workflows/cf-audit-log-monitor.yml` |
| 目的 | fallback rate > 5% x 3h 連続時に GitHub Issue 起票に加えて Slack / mail HTTP webhook 通知を行う |
| destinations | GitHub Issue は必須 audit trail。Slack は canonical `SLACK_WEBHOOK_INCIDENT`、mail は `EMAIL_WEBHOOK_URL` + `EMAIL_FROM` + `EMAIL_TO` の3点成立時のみ optional best-effort |
| failure isolation | Issue / Slack / mail dispatch は同一 alert cycle 内で開始し、Slack / mail の失敗は Issue 起票を阻害しない |
| workflow wiring | `analyze.ts` 後に `outputs/observation/*.json` が存在する場合のみ `fallback-rate-alert.ts` を実行。Issue #518 HOLD の `dry_run=true` 制約は維持 |
| evidence | focused Vitest 22 tests / `pnpm typecheck` / `pnpm lint` PASS。Phase 12 strict 7 files present |
| inventory | `references/workflow-issue-588-fallback-alert-slack-mail-extension-artifact-inventory.md` |
| 境界 | production delivery evidence、HOLD removal、GitHub secret / variable mutation、commit、push、PR は user approval 後 |

### Issue #532 write/tag/note provider ctx injection（2026-05-08）

| 項目 | 値 |
| --- | --- |
| ステータス | implemented-local / implementation / NON_VISUAL / local command evidence recorded / Phase 13 pending_user_approval |
| 成果物 | `docs/30-workflows/completed-tasks/issue-532-extend-ctx-injection-to-write-tag-note-providers/` |
| parent | `docs/30-workflows/completed-tasks/issue-371-ut-02a-followup-003-hono-ctx-di-migration/` |
| 目的 | Issue #371 の Hono ctx provider pattern を write/tag/note repositories へ実装展開する |
| provider set | `adminNotesProvider`, `auditLogProvider`, `notificationOutboxProvider`, `tagDefinitionsProvider`, `tagQueueProvider`, `memberTagsProvider` |
| scheduled boundary | Hono `c.var` は route 用。`tagQueueRetryTick` / `notificationDispatchTick` は明示 provider bundle を受け取る |
| route write consolidation | `/admin/requests` の note/status/audit guarded batch は `adminNotesProvider.resolveRequestAtomic()` が所有する |
| 境界 | D1 schema / API response shape / Auth.js admin gate は変更しない。DI container と optional `deps?` 再導入は禁止 |
| evidence | Phase 11 typecheck/lint/focused tests/grep logs captured。Full coverage attempted but blocked by local Miniflare port exhaustion |
| artifact inventory | `references/workflow-issue-532-write-tag-note-provider-ctx-injection-artifact-inventory.md` |
| lessons | `references/lessons-learned-issue-532-write-tag-note-provider-ctx-injection-2026-05.md` |
| Issue 取扱 | Issue #532 CLOSED 維持。PR 文脈は `Refs #532` のみ |
| user gate | commit / push / PR は user approval 後のみ |

### Issue #577 API full coverage rerun / Miniflare port exhaustion triage（2026-05-09）

| 項目 | 値 |
| --- | --- |
| ステータス | implemented_local_pending_pr / implementation / NON_VISUAL / runtime completed / Phase 12 strict 7 completed / PR pending_user_approval |
| 成果物 | `docs/30-workflows/completed-tasks/issue-577-api-coverage-rerun-miniflare-port-exhaustion/` |
| parent | Issue #532 write/tag/note provider ctx injection（CLOSED 維持） |
| source | `docs/30-workflows/unassigned-task/task-issue-532-api-full-coverage-rerun-miniflare-port-exhaustion-001.md` |
| GitHub Issue | #577 CLOSED（2026-05-08T21:36:04Z）。PR は `Refs #577` で追跡 |
| 目的 | `@ubm-hyogo/api` full coverage rerun を PR 前 evidence として固定し、Miniflare / undici `EADDRNOTAVAIL` を worker cap で解消する |
| evidence boundary | `outputs/phase-11/evidence/{baseline-rerun-*.log,full-coverage-rerun.log,triage-summary.md,env-snapshot.txt}` 取得済み。fail 時も exit code / duration / EADDRNOTAVAIL count を保存済み |
| close-out mode | baseline rerun 3 回で EADDRNOTAVAIL 再現（23/38/51）。軸 B `--maxWorkers=1 --minWorkers=1` 採用後、post-patch full coverage 133/133 PASS / 0 EADDRNOTAVAIL |
| sync target | `docs/30-workflows/completed-tasks/issue-532-extend-ctx-injection-to-write-tag-note-providers/outputs/phase-11/main.md` と Phase 12 changelog / implementation guide へ same-wave follow-up |
| guardrail | `coverage-guard.sh` no-op と full coverage PASS を混同しない。`coverage-guard.sh` は threshold guard 責務のため原則編集しない |
| user gate | commit / push / PR は user approval 後のみ。runtime rerun / Issue #532 sync はローカル完了済み |

### Issue #571 staging runtime smoke CI integration（2026-05-08）

| 項目 | 値 |
| --- | --- |
| ステータス | implemented-local / implementation / NON_VISUAL / IMPLEMENTED_LOCAL_RUNTIME_PENDING / Phase 13 pending_user_approval |
| 成果物 | `docs/30-workflows/issue-571-runtime-smoke-ci-staging-integration/` |
| parent | `docs/30-workflows/completed-tasks/issue-531-runtime-smoke-attendance-provider-migration/` |
| 目的 | attendanceProvider runtime smoke を staging deploy 後に GitHub Actions で自動実行する workflow / scripts / ADR を固定 |
| workflow | `.github/workflows/runtime-smoke-staging.yml` |
| trigger | reusable `workflow_call` from `backend-ci.yml` after API staging deploy + debug `workflow_dispatch` |
| runtime command | `bash scripts/smoke/runtime-attendance-provider.sh staging --out-dir ci-evidence --ci-summary` |
| secret境界 | staging runtime credentials は GitHub Environment `staging-runtime-smoke` only。repository-scoped dispatch token は不要 |
| evidence boundary | local PASS 5 点取得済み。G1-G4 approval 後に real workflow run / artifact redaction grep / Slack failure injection evidence を取得 |
| G1 wording | `prepared-local / pending user approval` を維持（name-only inventory と runtime smoke evidence 取得まで前進語彙へ昇格させない） |
| production boundary | production runtime smoke CI は staging 30 日観測後に起票・着手 |
| Issue 取扱 | Issue #571 CLOSED 維持。PR 文脈では `Refs #571` のみ |

### Issue #526 CI actionlint / shellcheck gate（2026-05-08）

| 項目 | 値 |
| --- | --- |
| ステータス | implemented-local / implementation / NON_VISUAL / IMPLEMENTED_LOCAL_RUNTIME_PENDING / Phase 13 pending_user_approval |
| 成果物 | `docs/30-workflows/completed-tasks/governance/issue-526-ci-actionlint-shellcheck-gate/` |
| Artifact inventory | `references/workflow-issue-526-ci-actionlint-shellcheck-gate-artifact-inventory.md` |
| Lessons | `references/lessons-learned-issue-526-ci-actionlint-shellcheck-gate-2026-05.md` |
| 実装対象 | `.github/workflows/ci.yml`, `package.json`, `scripts/observation/test/test-create-reminder-issue.sh` |
| lint対象 | `.github/workflows/post-release-observation-reminder.yml`, `.github/workflows/ci.yml`, `scripts/observation/*.sh`, `scripts/observation/test/*.sh` |
| merge gate | 既存 required context `ci` 内で `pnpm observation:lint` を実行。dedicated `workflow-shell-lint` job は見やすい分離証跡で、required context 追加は user-gated |
| 境界 | Reminder workflow の schedule / workflow_dispatch / Issue 作成副作用は変更しない。GitHub Actions runtime evidence、branch protection PUT、commit、push、PR は user approval 後 |
| Issue 取扱 | #526 / #350 CLOSED 維持。PR 文脈では `Refs #526, Refs #350` のみ |

### Issue #290 workflow lint gate（2026-05-17）

| 項目 | 値 |
| --- | --- |
| ステータス | implemented_local_evidence_captured / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING / Phase 13 pending_user_approval |
| 成果物 | `docs/30-workflows/completed-tasks/issue-290-workflow-lint-gate/` |
| Artifact inventory | `references/workflow-issue-290-workflow-lint-gate-artifact-inventory.md` |
| Lessons | `references/lessons-learned-issue-290-workflow-lint-gate-2026-05.md` |
| 実装対象 | `.github/workflows/ci.yml`, `package.json`, `docs/30-workflows/runbooks/workflow-lint-local-recovery.md` |
| lint対象 | `.github/workflows/*.yml`（現行 32 件） |
| merge gate | 既存 required context `ci` 内で `pnpm observation:lint` を実行。dedicated `workflow-shell-lint` job も同じ glob scope。required context 追加は user-gated |
| 境界 | yamllint は不採用。branch protection 変更、GitHub Actions runtime evidence、commit、push、PR は user approval 後 |
| Issue 取扱 | Issue #290 / parent UT-CICD-DRIFT。PR 文脈では `Refs #290, Refs UT-CICD-DRIFT` |

### UI prototype alignment / MVP recovery task-20 screen blueprints public/member（2026-05-07）

| 項目 | 値 |
| --- | --- |
| ステータス | implemented-local / docs-only / NON_VISUAL / Phase 13 blocked_pending_user_approval |
| 成果物 | `docs/30-workflows/completed-tasks/task-20-w2-screen-blueprints-public-and-member/` |
| 実 docs 正本 | `docs/00-getting-started-manual/specs/09e-screen-blueprints-public.md`, `docs/00-getting-started-manual/specs/09f-screen-blueprints-member.md` |
| 目的 | `pages-public.jsx` / `pages-member.jsx` の公開 6 routes + 会員 2 routes を screen blueprint として固定し、task-11..14 の入力にする |
| 境界 | apps / packages コード変更なし。新 endpoint / D1 schema / Secret 変更なし |
| 検証 | Phase 11 NON_VISUAL grep evidence、Phase 12 strict 7 files、visual literal gate は fenced JSX prototype 転記を除外 |
| 下流 | task-11 / task-12 / task-13 / task-14 / task-06 |
| user gate | commit / push / PR は未実行 |

### UI prototype alignment task-12 member detail / register / legal（2026-05-09）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/task-12-member-detail-register-legal/` |
| 状態 | `implemented-local / implementation / VISUAL_ON_EXECUTION / runtime evidence pending_user_approval / Phase 12 strict outputs present / Phase 13 blocked_pending_user_approval` |
| routes | `/members/[id]`, `/register`, `/privacy`, `/terms` |
| API surface | existing public API only: `GET /public/members/:memberId`, `GET /public/form-preview`; no `apps/api` endpoint addition |
| components | `ProfileHero`, `MemberDetailSections`, `MemberTags`, `MemberLinks`, `MemberActivity`, `RegisterCallout`, `FormPreviewSections`, `LegalProse` |
| invariants | `data-stable-key` for KV rows, Google Form external link only, `D1Database` reference 0 in `apps/web`, OKLch token discipline |
| AC canonical | `index.md` 13 items; Phase 7 / 10 / 12 synchronized to this count |
| strict evidence | `outputs/artifacts.json`, `outputs/phase-12/phase12-task-spec-compliance-check.md`, `outputs/phase-12/implementation-guide.md` |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-task-12-member-detail-register-legal-artifact-inventory.md` |
| downstream | task-18 regression smoke consumes `data-page`, `data-component`, `data-section`, `data-stable-key`, `data-role` selectors |

### UI prototype alignment / MVP recovery task-02 wrangler env injection（2026-05-07）

| 項目 | 値 |
| --- | --- |
| ステータス | implemented-local / implementation / NON_VISUAL / IMPLEMENTED_LOCAL_RUNTIME_PENDING / Phase 13 pending_user_approval |
| 成果物 | `docs/30-workflows/task-02-w2-wrangler-env-injection/` |
| 実装対象 | `apps/web/wrangler.toml`, `apps/web/.dev.vars.example`, `apps/web/src/lib/env.ts`, `apps/web/src/lib/__tests__/env.spec.ts` |
| env contract | `getEnv()` は Cloudflare `getCloudflareContext().env` を優先し、Node build/test では `process.env` fallback。全経路を zod schema で検証 |
| secret境界 | `SENTRY_DSN_WEB` / `AUTH_SECRET` は Cloudflare Secrets / 1Password 正本。`wrangler.toml` に値を書かない |
| 依存 | task-03 とは設計並列可。ただし `wrangler.toml` `[vars]` 実変更は task-02 owner で先行 |
| 境界 | runtime Cloudflare dry-run、secret put、commit、push、PR は user approval 後 |

### Issue #504 UT-07B-FU-01 extended fixture 50k stress trial（2026-05-07）

| 項目 | 値 |
| --- | --- |
| ステータス | spec_created / implementation / NON_VISUAL / Phase 12 strict outputs present / staging stress trial user-gated |
| 成果物 | `docs/30-workflows/completed-tasks/issue-504-ut-07b-fu-01-followup-extended-fixture-50k/` |
| Artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-504-extended-fixture-50k-artifact-inventory.md` |
| 起票元 | `docs/30-workflows/unassigned-task/task-ut-07b-fu-01-followup-extended-fixture-50k.md` |
| 実装対象 | `scripts/schema-alias-backfill/generate-50k-fixture.ts`, `seed-staging-50k.sh`, `cleanup-staging-50k.sh`, `run-stress-trial.sh`, vitest / bats tests |
| SSOT | `references/schema-alias-backfill-runbook.md` |
| fixture identity | `dedupe_key` prefix `ubm-test-fixture-50k-`; count / cleanup selector is `dedupe_key LIKE 'ubm-test-fixture-50k-%'` |
| trigger | `curl -fsS -X POST -H "Authorization: Bearer ${ADMIN_SESSION_JWT:?}" -H "Content-Type: application/json" --data '{"source":"issue-504-50k-trial"}' "${ADMIN_API_BASE_URL%/}/admin/schema/backfill/trigger"` |
| abort gates | retry_count <= 3, dlq_count = 0, cpu_ms <= 250000, timeout 1800s |
| 境界 | staging stress trial / D1 write / Cloudflare Queue runtime / commit / push / PR は user 明示承認後のみ。production bulk INSERT / DELETE は permanent ban |
| Issue 取扱 | #504 CLOSED 維持。PR 文脈では `Refs #504` のみ |

### Issue #531 attendanceProvider staging runtime smoke（2026-05-07）

| 項目 | 値 |
| --- | --- |
| ステータス | spec_created / implementation / NON_VISUAL / runtime evidence pending_user_credentials |
| 成果物 | `docs/30-workflows/issue-531-runtime-smoke-attendance-provider-migration/` |
| 親タスク | `docs/30-workflows/completed-tasks/issue-371-ut-02a-followup-003-hono-ctx-di-migration/` |
| 実装対象 | `scripts/smoke/runtime-attendance-provider.sh`, `scripts/smoke/redact.sh` |
| runtime contract | read-only GET smoke only: admin list/detail/attendance and me root/profile/attendance. DI-bound evidence is admin detail + me profile only |
| secret/PII境界 | persistent evidence is summary-only; raw body is temporary `mktemp` data removed by `trap` |
| state boundary | parent issue-371 remains `IMPLEMENTED_LOCAL_RUNTIME_PENDING` until real staging smoke PASS exists |
| Issue 取扱 | #531 CLOSED 維持。PR 文脈では `Refs #531` のみ |


### UI prototype alignment task-24 invariant audit（2026-05-14）

| 項目 | 値 |
| --- | --- |
| ステータス | implemented_local_runtime_pending / implementation / NON_VISUAL / W8-par / local audit evidence captured / Phase 13 blocked_pending_user_approval |
| 成果物 | `docs/30-workflows/completed-tasks/task-24-ui-mvp-w8-par-invariant-audit/` |
| parent | `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/` |
| final deliverable | `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/INVARIANT-AUDIT.md` |
| 目的 | task-01..22 の成果物と実装を INV-1..6 で read-only audit し、22×6 matrix と violation evidence を生成する |
| implementation boundary | audit-runner.sh と markdown evidence は生成済み。既存 apps/packages code mutation は禁止。commit / push / PR / CI は user approval 後 |
| dependency | upstream task-01..22、parallel task-23/25/26、downstream task-27 |
| evidence | `outputs/artifacts.json` parity、`outputs/phase-5/*` audit evidence、`outputs/phase-11/*` NON_VISUAL helper、`outputs/phase-12/*` strict 7、parent SCOPE / EXECUTION-ORDER W8/W9 sync |
| changelog | `.claude/skills/aiworkflow-requirements/changelog/20260514-task24-invariant-audit-spec-sync.md` |

### UI prototype alignment / MVP recovery task-01 scope gate（2026-05-07）

| 項目 | 値 |
| --- | --- |
| ステータス | spec_created / docs-only / NON_VISUAL / Phase 1-12 completed / Phase 13 blocked_pending_user_approval |
| 成果物 | `docs/30-workflows/completed-tasks/task-01-w1-solo-scope-gate-all-screens/` |
| scope SSOT | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` |
| 目的 | UI prototype alignment / MVP recovery の W1 gate として、19 routes、既存 API のみ接続、OKLch token 正本化、diff scope discipline を固定する |
| routes | 公開 6 / 会員 2 / 管理 8 / 共通 3 = 19 routes |
| 境界 | apps/packages コード変更なし。新 endpoint / D1 schema / Google Form 仕様変更なし。screenshot 不要の NON_VISUAL evidence |
| archive hygiene | 5 dir の削除混入は `docs/30-workflows/completed-tasks/` への archive rename として整理済み。task-02..22 は `SCOPE.md §6` を完了前に確認 |
| 検証 | `mise exec -- pnpm lint` exit 0、route count 19、staged diff 243 件は docs/archive 範囲のみ、apps/packages diff 0 |

### task-21 09g Admin Screen Blueprints（2026-05-07）

| 項目 | 値 |
| --- | --- |
| ステータス | spec_created / docs-only / NON_VISUAL / Phase 1-12 completed / Phase 13 blocked_pending_user_approval |
| 成果物 | `docs/30-workflows/completed-tasks/task-21-w2-par-screen-blueprints-admin/` |
| primary spec | `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` |
| 目的 | 管理層 8 routes + AdminSidebar を current admin API contract に沿って screen blueprint 化し、task-15/16/17 の実装入力にする |
| 境界 | apps/packages コード変更なし。新 endpoint / D1 schema / Google Form 仕様変更なし。screenshot 不要の NON_VISUAL evidence |
| 検証 | `bash scripts/verify-09g-screen-blueprints-admin.sh` PASS（lines=775 / sections=10 / mermaid=8 / derived=4） |
| 下流 | task-15 §2/§3、task-16 §4/§5/§7、task-17 §6/§8/§9、task-22 anchor verification |

### UI prototype alignment task-21 Admin Blueprint 09g（2026-05-07）

| 項目 | 値 |
| --- | --- |
| ステータス | spec_created / docs-only / NON_VISUAL / Phase 1-12 completed / Phase 13 blocked_pending_user_approval |
| 成果物 | `docs/30-workflows/completed-tasks/task-21-w2-screen-blueprints-admin/` |
| blueprint 正本 | `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` |
| 目的 | admin 8 routes と AdminSidebar の screen blueprint contract を後続 task-15 / task-16 / task-17 が実装できる粒度で固定する |
| 実装境界 | apps/packages code 変更なし。既存補助 route `/admin/dashboard/attendance` は既存 UT-02A 成果物として残し、task-21 は削除しない |
| API 境界 | 既存 admin endpoint surface のみ参照。`/admin/requests/:noteId/resolve`, `/admin/identity-conflicts/:id/merge`, `/admin/identity-conflicts/:id/dismiss` を正本化 |
| evidence | `outputs/phase-11/main.md`, `outputs/phase-11/manual-smoke-log.md`, `outputs/phase-11/link-checklist.md`, `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| Phase 13 | commit / push / PR outputs は user approval 後のみ生成 |

### UI prototype alignment task-15 Admin Dashboard and Members（2026-05-10）

| 項目 | 値 |
| --- | --- |
| ステータス | implemented-local-runtime-pending / implementation / VISUAL / Phase 1-12 completed / Phase 13 blocked_pending_user_approval |
| 成果物 | `docs/30-workflows/task-15-admin-dashboard-and-members/` |
| primary screens | `/admin`, `/admin/members` |
| implementation | `apps/web/app/(admin)/layout.tsx`, `apps/web/app/(admin)/admin/page.tsx`, `apps/web/app/(admin)/admin/members/page.tsx`, `apps/web/src/features/admin/components/**`, `apps/web/src/lib/admin/admin-dashboard-ui.ts` |
| evidence | local Playwright screenshot 9 files in `outputs/phase-11/`, Phase 12 strict 7 files, `jest-axe` unit a11y |
| boundary | existing `/admin/dashboard` and `/admin/members` API only; no new endpoint, no D1 schema change, no shared schema mutation |
| downstream | task-16 / task-17 may consume admin layout owner surface after branch integration; task-18 consumes visual/test evidence |
| Phase 13 | commit / push / PR outputs are user-gated |

### UI prototype alignment / task-19 09c primitives full spec（2026-05-07）

| 項目 | 値 |
| --- | --- |
| ステータス | spec_created / docs-only / NON_VISUAL / Phase 1-12 completed / Phase 13 blocked_pending_user_approval |
| 成果物 | `docs/30-workflows/task-19-w2-primitives-full-spec/` |
| primary spec | `docs/00-getting-started-manual/specs/09c-primitives.md` |
| 目的 | `primitives.jsx` の const-based primitive / helper set を 09c contract として固定し、task-10 ui-primitives 実装の入力正本にする |
| validation | 600-1200 lines、numbered headings + §99、17 JSX excerpts、HEX / `oklch()` / `px` / `bg-[` grep 0、`token-sized` / `09b-token-value` / `token-mix` grep 0 |
| upstream | task-01 scope gate completed、prototype `primitives.jsx` frozen |
| downstream | task-06 contract index、task-10 ui-primitives、task-11..17 screens、task-20..22 screen blueprints |
| boundary | task-19 primary deliverable は docs-only。2026-05-07 review cycle で検出した `apps/api/src/repository/identity-conflict.ts` の隣接 code diff は task-19 evidence から分離して記録 |
| evidence | `outputs/phase-11/evidence/grep-gate.log`, `scripts/verify-09c-no-visual-values.sh`, `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| 苦戦箇所 | `references/lessons-learned-task19-primitives-full-spec-2026-05.md`（L-T19-001..005: placeholder token grep / §99 keyword 二段検証 / docs-only staged path scope / prototype const 1:1 照合 / verify script Phase 1-4 雛形配置） |
| changelog | `changelog/20260507-task19-primitives-full-spec.md` |
| 運用 | docs-only / contract 系タスクの `scripts/verify-<task>-*.sh` は **Phase 1（task spec 確定時）または Phase 4（AC 確定時）に雛形を repo 配置**する。Phase 11 で初めて作る運用は禁止（後付けは shallow grep PASS の温床になる）。雛形は `set -euo pipefail` / 視覚値 grep / placeholder grep / §99 必須キーワード occurrence ≥ 1 / exit code を最小構成として明記 |

### Task 08 W2 design tokens doc（2026-05-07）

| 項目 | 値 |
| --- | --- |
| ステータス | spec_created / docs-only / NON_VISUAL / Phase 1-12 completed / Phase 13 blocked_pending_user_approval |
| 成果物 | `docs/30-workflows/task-08-w2-design-tokens-doc/` |
| token SSOT | `docs/00-getting-started-manual/specs/09b-design-tokens.md` |
| 出典 | `docs/00-getting-started-manual/claude-design-prototype/styles.css` L1-L70 |
| 目的 | stone / warm / cool の OKLch / HEX 値、radius、shadow、font、spacing、motion を `--ubm-*` 正本名で固定し、task-09 / task-10 / task-18 のブロッカーを解除する |
| 互換境界 | 旧 `--ubm-bg` / `--ubm-accent` / `--ubm-text-2` は 09b の互換 mapping で正本 `--ubm-color-*` へ置換する |
| 正本同期 | `00-overview.md`, quick-reference, resource-map, topic-map, keywords, changelog を同一 wave で更新 |
| 境界 | apps/packages コード変更なし。Tailwind `tokens.css` 実装、primitive 実装、verify script 実装は task-09 / task-10 / task-18 |
| 検証 | 09b 行数 380+、12章、JSON parse、84 token、styles.css L1-L70 full literal cross-check、Phase 12 strict 7 files |
| lessons | `references/lessons-learned-task-08-w2-design-tokens-doc-2026-05.md`（L-T08W2-001..004）|
| inventory | `references/workflow-task-08-w2-design-tokens-doc-artifact-inventory.md` |

### Task 09 W3 Tailwind v4 setup（2026-05-08）

| 項目 | 値 |
| --- | --- |
| ステータス | implemented-local / implementation / VISUAL_ON_EXECUTION / local PASS 5-point evidence captured / Phase 13 blocked_pending_user_approval |
| 成果物 | `docs/30-workflows/task-09-w3-par-tailwind-v4-setup/` |
| upstream | task-08 `docs/00-getting-started-manual/specs/09b-design-tokens.md` |
| 目的 | `apps/web` に Tailwind v4 CSS-first build pipeline を確立し、09b の `--ubm-*` token を `tokens.css` と `globals.css @theme inline` で utility 化する |
| 境界 | task-09 は単一 PR。task-10 primitives は別 PR で、task-09 完了後のみ着手 |
| 検証 | Phase 9 local 5点、Phase 11 `preview:cloudflare` 200、generated CSS `.bg-accent` + `var(--ubm-color-accent)`、HEX grep 0、apps/api diff 0 |
| 状態境界 | 現 wave で実コード実装と local PASS 証跡を取得済み。commit・push・PR は未実行 |
| Phase 11 evidence | `docs/30-workflows/task-09-w3-par-tailwind-v4-setup/outputs/phase-11/evidence/typecheck.log`、`outputs/phase-11/evidence/tokens-test.log`、`outputs/phase-11/evidence/build-output-test.log`、`outputs/phase-11/evidence/preview-200.log`、`outputs/phase-11/evidence/hex-grep-zero.log` |
| lessons | `references/lessons-learned-task-09-w3-tailwind-v4-setup-2026-05.md`（L-T09W3-001..003） |
| inventory | `references/workflow-task-09-w3-par-tailwind-v4-setup-artifact-inventory.md` |

### UI prototype mapping table task-07（2026-05-07）

| 項目 | 値 |
| --- | --- |
| ステータス | spec_created / docs-only / NON_VISUAL / Phase 1-12 completed / Phase 13 blocked_pending_user_approval |
| 成果物 | `docs/30-workflows/completed-tasks/task-07-prototype-mapping-table/` |
| artifact | `docs/00-getting-started-manual/specs/09a-prototype-map.md` |
| aiworkflow ref | `references/ui-ux-prototype-map.md` |
| inventory | `references/workflow-task-07-prototype-mapping-table-artifact-inventory.md` |
| 苦戦箇所 | `lessons-learned/lessons-learned-task-07-prototype-mapping-table-2026-05.md`（L-07-001..004） |
| 目的 | frozen prototype JSX の component / route / line range を本番実装 target へ逆引きできる 1 ファイル正本を作る |
| coverage | 13+ primitives、19 routes、shell/chrome、09c-09h source mapping、25+ line ledger、8 derivation rules |
| 境界 | apps/packages コード変更なし。token 値 / props-state / API schema 正本化なし。未掲載画面で新規 primitive を生やさない |
| 検証 | `bash scripts/verify-09a-prototype-line-ranges.sh` exit 0、`09-ui-ux.md` から 09a link あり |

### UI/UX Contract Rewrite task-06（2026-05-07）

| ステータス | implemented-local / implementation / NON_VISUAL / primary spec rewritten / Phase 13 pending_user_approval |
| 成果物 | `docs/30-workflows/completed-tasks/task-06-ui-ux-contract-rewrite/` |
| primary spec | `docs/00-getting-started-manual/specs/09-ui-ux.md` |
| 目的 | 09-ui-ux.md を「契約のみ」に再構成し、routes / component props / state / a11y / token prefix / API 接続だけを正本化する |
| routes | 公開 6 / 会員 2 / 管理 8 / 共通 4 = 19+1 entries。`global-error.tsx` を共通 fallback として契約化 |
| component | 13 primitives + feature components を contract 表で固定。Storybook VRT を component screenshot 正本にする |
| 境界 | 視覚値・余白値・font 値・prototype 行範囲は持たない。09a..09h / Storybook へ link 委譲 |
| diff discipline | Primary M: `docs/00-getting-started-manual/specs/09-ui-ux.md`; same-wave sync M: `.claude/skills/aiworkflow-requirements/{SKILL.md,LOGS/_legacy.md,indexes/{quick-reference,resource-map,topic-map,keywords}.md/json,references/task-workflow-active.md}`, `.claude/skills/task-specification-creator/{SKILL.md,LOGS/_legacy.md}`; A: `docs/30-workflows/completed-tasks/task-06-ui-ux-contract-rewrite/**`, `.claude/skills/aiworkflow-requirements/changelog/20260507-task-06-ui-ux-contract-rewrite.md`, `.claude/skills/aiworkflow-requirements/references/lessons-learned-task-06-ui-ux-contract-rewrite-2026-05.md`; D: なし。attendance 系 workflow 削除は参照破壊のため復元 |
| 検証 | 章数 10 / routes 20 / primitives 13 / 視覚詳細 grep 0 hits / route-API trace PASS / repository lint |

### UI prototype alignment task-03 Sentry Workers SDK unify（2026-05-07）
| ステータス | implemented-local / implementation / NON_VISUAL / IMPLEMENTED_LOCAL_RUNTIME_PENDING / Phase 12 strict outputs present / Phase 13 blocked_pending_user_approval |
| 成果物 | `docs/30-workflows/completed-tasks/task-03-w2-par-sentry-workers-sdk-unify/` |
| ステータス | implemented-local / implementation / NON_VISUAL / IMPLEMENTED_LOCAL_RUNTIME_PENDING / Phase 12 strict outputs present / Phase 13 blocked_pending_user_approval |
| 成果物 | `docs/30-workflows/task-03-w2-par-sentry-workers-sdk-unify/` |
| parent | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/` W2 runtime task |
| 契約 | Workers / Node SSR / Edge は `@sentry/cloudflare`、Browser は `@sentry/nextjs` に entry を分離し、`@sentry/nextjs` / browser SDK token の Workers bundle 混入を grep gate で禁止 |
| secret境界 | web server DSN は Cloudflare Secret `SENTRY_DSN_WEB`、1Password 正本は `op://UBM-Hyogo/Sentry Web DSN (<env>)/dsn`。Browser DSN は `[vars]` `NEXT_PUBLIC_SENTRY_DSN` |
| API | `captureException(error, ctx?)`, `captureMessage(message, ctx?)`, `register()` の contract を Phase 3 に固定 |
| evidence境界 | Phase 11 は local typecheck / tests / build / OpenNext worker grep を取得済みの `IMPLEMENTED_LOCAL_RUNTIME_PENDING`。staging deploy、Sentry dashboard event は user approval 後 |
| 下流 | task-04 logger、task-05 error boundary / staging smoke |
| 検証 | `pnpm --filter @ubm-hyogo/web exec tsc --noEmit` PASS、web Vitest 51 files / 420 tests PASS、`pnpm --filter @ubm-hyogo/web build:cloudflare` PASS、worker grep 0 hits、Phase 11 10 screenshots, Phase 12 strict 7 outputs、Phase 11 outputs、Phase 13 approval-boundary outputs を同 wave で配置 |
### Issue #559 task-03 follow-up 001 Sentry staging runtime evidence（2026-05-08）
| ステータス | spec_created / implementation / NON_VISUAL / IMPLEMENTED_LOCAL_RUNTIME_PENDING |
| 成果物 | `docs/30-workflows/issue-559-task-03-followup-001-sentry-staging-runtime-evidence/` |
| parent canonical | `docs/30-workflows/completed-tasks/task-03-w2-par-sentry-workers-sdk-unify/` |
| parent source spec | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-03-w2-par-sentry-workers-sdk-unify.md` |
| 目的 | parent task-03 の local Sentry SDK split を staging runtime で検証し、G0〜G5 完了後だけ `PASS_BOUNDARY_SYNCED_RUNTIME_VERIFIED` へ昇格する |
| local evidence | G0 post-rebase preflight PASS、web typecheck / lint / 445 tests / Next build / OpenNext build PASS、`apps/web/.open-next/worker.js` grep gate 0 hits、DSN leak scan real leak 0 |
| runtime pending | G1 secret put、G2 staging deploy、G3 curl + Sentry server/browser event、G5 parent state promotion は未実行 |
| blocker | 1Password `UBM-Hyogo` vault / `Sentry Web DSN (staging|production)` item 未 provisioning |
| follow-up | `docs/30-workflows/unassigned-task/task-issue-559-sentry-project-1password-dsn-provisioning-001.md` |
| inventory | `references/workflow-issue-559-task-03-followup-001-sentry-staging-runtime-evidence-artifact-inventory.md` |
| 境界 | Cloudflare secret put / deploy / Sentry dashboard observation / commit / push / PR は user approval 後のみ |
### UI prototype alignment task-04 Window guard and logger（2026-05-08）
| ステータス | implemented-local / implementation / NON_VISUAL / IMPLEMENTED_LOCAL_RUNTIME_PENDING / Phase 12 strict outputs present / Phase 13 blocked_pending_user_approval |
| 成果物 | `docs/30-workflows/task-04-w3-window-guard-and-logger/` |
| parent | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/` W3 runtime task |
| 契約 | Browser-only globals are centralized in `apps/web/src/lib/is-browser.ts`; structured observability is centralized in `apps/web/src/lib/logger.ts`; downstream error boundaries call `logger.error({ event, error, digest })` |
| ESLint gate | `apps/web/package.json` `lint` runs `tsc -p tsconfig.json --noEmit && eslint 'src/**/*.{ts,tsx}'`; `apps/web/eslint.config.mjs` rejects runtime `window` / `document` outside `src/lib/is-browser.ts` and `src/instrumentation-client.ts` |
| evidence境界 | Phase 11 local typecheck / lint / tests / build / grep-gate PASS。Sentry dashboard smoke、runtime logger staging evidence は user approval 後 |
| 下流 | task-05 error boundary、task-09..17 browser API migration |
| 検証 | `pnpm --filter @ubm-hyogo/web exec tsc -p tsconfig.json --noEmit` PASS、`pnpm --filter @ubm-hyogo/web lint` PASS、web Vitest 56 files / 441 tests PASS、`pnpm --filter @ubm-hyogo/web build` PASS、grep-gate 0 hits outside allow-list |

### Issue #560 task-03 follow-up 002 Next standalone instrumentation patch（2026-05-08）
| ステータス | implemented-local / implementation / NON_VISUAL / Phase 1-12 completed / Phase 13 blocked_pending_user_approval |
| 成果物 | `docs/30-workflows/issue-560-task-03-followup-002-next-standalone-instrumentation-patch/` |
| source follow-up | `docs/30-workflows/completed-tasks/task-03-followup-002-next-standalone-instrumentation-patch-001.md` |
| current script | `scripts/patch-next-standalone-instrumentation.mjs` |
| current artifact path | `.next/server/instrumentation.js` -> `.next/standalone/apps/web/.next/server/instrumentation.js` |
| 実装 | existing script に `cwd` guard / `--verify-only` / trace copy regression test / trace parse failure handling / structured log を追加し、`.github/workflows/pr-build-test.yml` の `build-test` job で `@ubm-hyogo/web build:cloudflare` 後に verify gate を実行する |
| 境界 | `web-cd.yml` Pages deploy cutover、production deploy、Sentry dashboard runtime evidence は対象外。commit / push / PR は user approval 後 |

### UI prototype alignment task-20 public/member screen blueprints（2026-05-07）
| 成果物 | `docs/30-workflows/completed-tasks/task-20-screen-blueprints-public-and-member/` |
| public blueprint | `docs/00-getting-started-manual/specs/09e-screen-blueprints-public.md`（990 行 / section count 6） |
| member blueprint | `docs/00-getting-started-manual/specs/09f-screen-blueprints-member.md`（917 行 / section count 3） |
| endpoint surface | `SCOPE.md` §2 + 現行 `apps/api/src/routes/` の AND: `GET /public/members/:memberId`, `POST /auth/magic-link`, `GET /auth/gate-state`, `GET /auth/session-resolve`, `GET /me`, `POST /me/visibility-request`, `POST /me/delete-request` |
| login state | `input / sent / unregistered / deleted / rules_declined / error` |
| legacy 撤回 | `/v1/public/*`, `/public/member-profile/:id`, `/auth/schemas`, `/auth/logout`, `/api/me`, `ruleConsent` を 09e/09f から削除 |
| docs-only NON_VISUAL lifecycle | `references/lessons-learned-docs-only-lifecycle.md`（L-DOCS-LIFECYCLE-001..005） |
| changelog | `.claude/skills/aiworkflow-requirements/changelog/20260507-task-20-screen-blueprints-public-member.md` |
| 境界 | apps/packages code change 0。Phase 13 commit / push / PR は user approval 後のみ |
| evidence | `outputs/phase-11/manual-smoke-log.md`, `outputs/phase-11/evidence/{route-coverage,endpoint-surface,state-vocabulary,phase12-strict-outputs,aiworkflow-sync-presence,lint-availability}.log`, `outputs/phase-12/phase12-task-spec-compliance-check.md` |
### Issue #407 Cloudflare API Token 90 日 rotation runbook automation（2026-05-06）

| 項目 | 値 |
| --- | --- |
| ステータス | implemented-local / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING / Phase 13 blocked_until_user_approval |
| 成果物 | `docs/30-workflows/issue-407-cf-token-rotation-90day-runbook-automation/` |
| 実装対象 | `docs/30-workflows/operations/cf-token-rotation-runbook.md`, `docs/30-workflows/operations/cf-token-rotation-log.md`, `.github/workflows/cf-token-rotation-reminder.yml`, `scripts/check-cf-rotation-reminder.sh` |
| variable | GitHub repository variable `CF_TOKEN_ISSUED_AT` |
| 境界 | reminder workflow は Issue 起票のみ。Token 発行 / `gh secret set` / production rotation は runbook の user approval gate 後だけ実行 |
| secret hygiene | Token 値 / Token ID / scope 値は docs / log / evidence / PR body に記録しない |
| Issue 取扱 | #407 CLOSED 維持。PR 文脈では `Refs #407` のみ |
| 下流 | U-FIX-CF-ACCT-01-DERIV-01（OIDC 化）後に runbook 改訂または retire |

### 09c Incident Runbook Slack Delivery（2026-05-06）

| 項目 | 値 |
| --- | --- |
| ステータス | spec_created / implementation-spec / NON_VISUAL / Phase 12 strict outputs present / runtime evidence pending_user_approval |
| 成果物 | `docs/30-workflows/completed-tasks/09c-incident-runbook-slack-delivery/` |
| lessons | `references/lessons-learned-09c-incident-runbook-slack-delivery-2026-05.md`（L-09C-IRSD-001〜005）|
| Issue 取扱 | Issue #349 は CLOSED 維持。PR / commit 文脈では `Refs #349` のみ |
| 目的 | 09b/09c incident response runbook を Slack bot で dry-run / production channel に配信し、`message.permalink` / `ts` / `channel` を Phase 11 evidence に保存する |
| secret境界 | `SLACK_BOT_TOKEN_INCIDENT_RUNBOOK` は 1Password 正本から GitHub Secrets へ派生。channel id は GitHub Variables |
| gate | `workflow_run` は automatic dry-run のみ。production は `workflow_dispatch` + `production-slack-delivery` environment approval |
| 起票元 | `docs/30-workflows/unassigned-task/task-09c-incident-runbook-slack-delivery-001.md` consumed |
| 境界 | real Slack post / GitHub secret mutation / commit / push / PR は user 明示指示後のみ |


### U-FIX-CF-ACCT-01-DERIV-01 GitHub OIDC short-lived credentials（2026-05-06）

| 項目 | 値 |
| --- | --- |
| ステータス | spec_created / implementation-spec / NON_VISUAL / Phase 1-13 outputs present / Phase 12 strict outputs present / runtime evidence pending_user_approval |
| 成果物 | `docs/30-workflows/u-fix-cf-acct-01-deriv-01-github-oidc-short-lived-credentials/` |
| 上流 | U-FIX-CF-ACCT-01 Phase 11 verified / Issue #405 closed |
| 契約 | GitHub Actions deploy auth を長命 `secrets.CLOUDFLARE_API_TOKEN` / `secrets.CLOUDFLARE_API_TOKEN_STAGING` から GitHub OIDC → AWS STS → job-scoped Cloudflare credential retrieval へ移行する target contract |
| canonical workflow inventory | `.github/workflows/web-cd.yml`, `.github/workflows/backend-ci.yml`, `.github/workflows/d1-migration-verify.yml` |
| gates | G1 trust policy / G2 staging cutover / G3 production cutover / G4 long-lived token revoke。commit / push / PR は独立 user approval |
| 境界 | 本 cycle では runtime workflow edit / deploy / token revoke / commit / push / PR は未実行。Phase 11 13 evidence と NON_VISUAL companion outputs は RUNTIME_PENDING |
| 下流 | DERIV-02 scope split, DERIV-03 rotation runbook reframe, DERIV-04 audit monitoring |

### Issue #351 09c Post-release Dashboard Automation（2026-05-05）

| 項目 | 値 |
| --- | --- |
| ステータス | spec_created / implementation / NON_VISUAL / Phase 1-12 outputs present / Phase 13 blocked_pending_user_approval |
| 成果物 | `docs/30-workflows/completed-tasks/issue-351-09c-post-release-dashboard-automation/` |
| 目的 | 09c post-release verification の 24h metrics を GitHub Actions schedule / workflow_dispatch で自動収集し、artifact として保存する |
| 実装対象 | `.github/workflows/post-release-dashboard.yml`, `scripts/post-release-dashboard/`, `scripts/cf.sh api-post`, `.gitignore` |
| secret境界 | analytics 用 read-only secret `CLOUDFLARE_API_TOKEN_ANALYTICS_READONLY` を production deploy 用 `CLOUDFLARE_API_TOKEN` から分離 |
| artifact | `outputs/post-release-dashboard/<UTC-yyyy-mm-dd>/dashboard.{json,md}` と redaction / schema check evidence |
| CI / redaction | `ci.yml` が `pnpm post-release-dashboard:test` を実行。`redaction-check.sh` は artifact directory に `redaction-check.md` を生成 |
| 起票元 | `docs/30-workflows/unassigned-task/task-09c-post-release-dashboard-automation-001.md` は formalized |
| Issue 取扱 | #351 CLOSED 維持。commit / push / PR / real workflow dispatch / schedule evidence collection は user 明示指示後のみ |

### Issue #348 09c GitHub Release Tag Automation（2026-05-06）

| 項目 | 値 |
| --- | --- |
| ステータス | implemented-local / implementation / NON_VISUAL / Phase 12 strict outputs present / release apply user-gated / Phase 13 blocked_pending_user_approval |
| 成果物 | `docs/30-workflows/issue-348-09c-github-release-tag-automation/` |
| 目的 | 09c release tag `vYYYYMMDD-HHMM` から Phase 12 changelog と Phase 11 evidence URL を含む GitHub Release note を生成し、draft Release 作成まで自動化する |
| 実装対象 | `scripts/release/`, `.github/workflows/release-create.yml`, `docs/runbooks/release-create.md` |
| SSOT | `references/release-runbook.md`, `references/workflow-issue-348-09c-github-release-tag-automation-artifact-inventory.md` |
| 境界 | `workflow_dispatch` は dry-run artifact のみ。tag push は draft release 作成。local `--apply` は user 明示承認まで禁止 |
| 起票元 | `docs/30-workflows/unassigned-task/task-09c-github-release-tag-automation-001.md` は consumed / formalized |
| Issue 取扱 | #348 CLOSED 維持。PR 文脈では `Refs #348` のみ |

### Issue #497 Post-release Dashboard 30 Day Feedback（2026-05-06）

| 項目 | 値 |
| --- | --- |
| ステータス | spec_created / docs-only / NON_VISUAL / external-time-dependent / 30day gate pending |
| 成果物 | `docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/` |
| 親 trace | `docs/30-workflows/completed-tasks/issue-351-09c-post-release-dashboard-automation/outputs/phase-12/unassigned-task-detection.md` U-1 formalized |
| 目的 | `post-release-dashboard.yml` の 30 日連続 schedule conclusion を実測集計し、`deployment-gha.md` へ feedback baseline として追記する |
| 実行 gate | `gh run list --workflow=post-release-dashboard.yml --limit=80 --json createdAt` の最古 run が実行日 - 30 日以前 |
| Phase 11 evidence | `outputs/phase-11/post-release-dashboard-30d.json`, conclusion distribution, failure root cause, consecutive failure window, failure rate decision, redaction grep |
| schedule / artifact evidence | `event=="schedule"` の日次 gap 0、artifact downloadability、retention、run duration を確認 |
| next action | failure rate `< 10%` は現状維持。`>= 10%` は retry / alert 追加を別 unassigned task 化し、Issue #497 は CLOSED 維持 |

### Issue #517 Follow-up Auto-summary Foundation（2026-05-07）

| 項目 | 値 |
| --- | --- |
| ステータス | spec_created / implementation / NON_VISUAL / channel-bootstrap-preflight / Phase 12 strict outputs present |
| 成果物 | `docs/30-workflows/issue-517-followup-auto-summary-foundation/` |
| 親 trace | Issue #497 / Issue #351 post-release-dashboard automation |
| 目的 | Issue #497 の 30 日 conclusion 集計を GHA cron + shell script + draft PR + Slack Incoming Webhook で自動化する |
| 実装対象 | `.github/workflows/post-release-30day-auto-summary.yml`, `scripts/post-release-dashboard/30day-summary.sh`, `scripts/post-release-dashboard/lib/aggregate.sh`, `scripts/post-release-dashboard/__tests__/30day-summary.test.sh` |
| Slack bootstrap | channel `w1618436027-ek2505248` / Incoming Webhook manual bind / 1Password 正本 / GitHub Secret `SLACK_WEBHOOK_URL` derived copy |
| 状態語彙 | channel / webhook / secret 未準備時は `CONTRACT_READY_SECRET_PENDING`。scheduled 30 day runtime は `CONTRACT_READY_RUNTIME_PENDING` |
| 境界 | Slack App / Bot OAuth / automatic channel creation / retry / alert 実装は含まない。Issue #517 は CLOSED 維持し PR 文脈は `Refs #517, Refs #497, Refs #351` |
| Issue 取扱 | #517 / #497 / #351 CLOSED 維持。commit / push / PR / Issue comment は user 明示指示後のみ。PR 文面は `Refs #517, Refs #497, Refs #351` |

### Issue #408 / #518 Cloudflare Audit Logs Monitoring HOLD（2026-05-07, superseded by #586 on 2026-05-09）

| 項目 | 値 |
| --- | --- |
| ステータス | historical HOLD state / superseded by Issue #586 hourly restart / Issue #408 and #518 CLOSED |
| 成果物 | `docs/30-workflows/completed-tasks/issue-408-cf-audit-logs-monitoring/` + `docs/30-workflows/issue-518-cf-audit-logs-monitoring-hold/` |
| 目的 | Issue #518 による一時 HOLD の履歴を保持する。現在の hourly restart / 7-day close-out 正本は Issue #586 entry と `docs/30-workflows/issue-586-post-switch-7day-close-out/` |
| secret境界 | `CF_AUDIT_TOKEN_PROD` は `Account > Audit Logs:Read` のみ。D1 書き込みは `CF_AUDIT_D1_TOKEN_PROD`。deploy 用 `CLOUDFLARE_API_TOKEN` は監視 workflow に注入しない |
| runtime境界 | historical: Issue #518 では schedule 削除 + `workflow_dispatch` のみ + `dry_run=true` 既定。current: Issue #586 で hourly schedule / post-step / 7day summary workflow を再開し、D+7 evidence まで `pass_runtime_synced` は未昇格 |
| alert labels | HIGH=`priority:high`、MEDIUM=`priority:medium`、LOW=`priority:low`、共通=`type:security` |
| 起票元 | `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-04-audit-logs-monitoring.md` |
| 正本同期 | `references/deployment-secrets-management.md` / `references/observability-monitoring.md` / `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` |

### Issue #515 Cloudflare Audit Logs ML-ready Classifier（2026-05-07）

| 項目 | 値 |
| --- | --- |
| 状態 | implemented_local_runtime_pending / implementation / NON_VISUAL / production ML switch external-gated |
| 成果物 | `docs/30-workflows/issue-515-cf-audit-logs-ml-anomaly/` |
| 目的 | Issue #408 の threshold 判定を直ちに置換せず、`scripts/cf-audit-log/classifier/**` の interface、redacted feature export、offline replay、D1 classifier metadata、GitHub Actions env を追加して ML-ready 化する |
| runtime境界 | local code / focused tests / SSOT は同期済み。staging D1 apply、90 日 baseline 観測、redacted production export、production `CF_AUDIT_CLASSIFIER=ml` switch は user-gated follow-up。FU-03-C model selection は Issue #548 として仕様化済み |
| 正本同期 | `references/observability-monitoring.md` / `references/deployment-secrets-management.md` / `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` |

### Issue #548 Cloudflare Audit Logs ML Model Selection（2026-05-08）

| 項目 | 値 |
| --- | --- |
| 状態 | implemented_synthetic / implementation / NON_VISUAL / production winner pending FU-03-B/FU-03-D |
| 成果物 | historical root `docs/30-workflows/issue-548-ml-model-selection/`（本ブランチでは workflow root 削除済み。active execution root として扱わず、artifact inventory / lessons の trace のみ保持） |
| 目的 | Issue #515 の classifier abstraction を使い、threshold baseline と Isolation Forest / XGBoost / Workers AI 候補を同一 redacted dataset で比較する contract を固定する |
| runtime境界 | この wave は spec + SSOT sync。Synthetic fixture は harness smoke evidence であり production winner ではない。FU-03-B redacted 90-day dataset replay と FU-03-D production switch は user-gated |
| 正本同期 | `references/observability-monitoring.md` / `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` / `indexes/resource-map.md` / `indexes/quick-reference.md` |

### Issue #547 Cloudflare Audit Logs Redacted Feature Export（2026-05-08）

| 項目 | 値 |
| --- | --- |
| 状態 | implemented_local_runtime_pending / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING / Issue #547 CLOSED |
| 成果物 | `docs/30-workflows/issue-547-cf-audit-logs-redacted-production-feature-export/` |
| 目的 | production D1 `cf_audit_log` から 90 日分の ML feature JSONL を read-only export し、schema validation / manifest / leakage gate で redacted dataset を作る |
| 実装正本 | `scripts/cf-audit-log/feature-export.ts`, `scripts/cf-audit-log/feature-export/schema-validation.ts`, `scripts/cf-audit-log/feature-export/manifest.ts`, `scripts/cf-audit-log/d1-client.ts`, `scripts/cf.sh` |
| evidence | `outputs/phase-11/main.md`, `focused-vitest.log`, `fixture-exported-features.jsonl`, `fixture-export-manifest.json`, `secret-leakage-grep.log`, `schema-validation.log` |
| runtime境界 | production read-only export は `outputs/phase-11/production-pending-user-gate.md` のまま user approval 後のみ実行。local fixture PASS を runtime PASS と扱わない |
| lessons | `references/lessons-learned-issue-547-cf-audit-logs-redacted-production-feature-export-2026-05.md` |
| artifact inventory | `references/workflow-issue-547-cf-audit-logs-redacted-production-feature-export-artifact-inventory.md` |
| 正本同期 | `references/observability-monitoring.md` / `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` / `indexes/quick-reference.md` / `indexes/resource-map.md` / LOGS |

### Issue #546 Cloudflare Audit Logs 90 Day Baseline Observation（2026-05-08）

| 項目 | 値 |
| --- | --- |
| 状態 | observation_continue / docs-only / NON_VISUAL / Gate-A FAIL / Gate-B-C pending / Issue #546 CLOSED |
| 成果物 | `docs/30-workflows/completed-tasks/observability/issue-546-cf-audit-logs-90day-baseline-observation/` |
| 目的 | Issue #408 / #515 系の Cloudflare Audit Logs 監視について、90 日分の runtime evidence を集計し ML 化へ進むか threshold 継続かを判定する |
| 2026-05-08 evidence | monitor run 32 件は 2026-05-06T10:43:50Z〜2026-05-07T21:22:18Z の全 failure、watchdog run 32 件も全 failure、`cf-audit` label issue は 0 件、D1 read-only query は `no such table: cf_audit_log` |
| gate結果 | Gate-A FAIL。Gate-B は D1 readiness 未確認のため PENDING。Gate-C は monthly tuning minutes log 不足のため PENDING |
| 次アクション | `observation_continue`。Issue #546 は CLOSED 維持。ML comparison / production switch には進まない。successful hourly run が 2026-05-08 から始まる場合、最短の90日再判定は 2026-08-05 以後。追跡: `docs/30-workflows/unassigned-task/issue-546-cf-audit-logs-90day-reobservation-reminder-001.md` |
| 正本同期 | `references/observability-monitoring.md` / `references/database-schema-cf-audit-log.md` / `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` |
| artifacts / lessons | `references/workflow-issue-546-cf-audit-logs-90day-baseline-observation-artifact-inventory.md` / `references/lessons-learned-issue-546-cf-audit-logs-90day-baseline-observation-2026-05.md` |

#### Issue #581 re-observation reminder canonical package（2026-05-09）

| 項目 | 値 |
| --- | --- |
| workflow_state | spec_created |
| runtime decision | observation_continue |
| 成果物 | `docs/30-workflows/issue-581-cf-audit-90day-reobservation-reminder/` |
| 目的 | Issue #546 の 90 day re-observation reminder を Phase 1-13 workflow package として formalize。runtime evidence は 2026-08-05 以後、または successful hourly run 開始から90日後以降に取得する |
| 境界 | app code / workflow YAML / D1 schema / Cloudflare Secret は変更しない。Phase 12 strict 7 と aiworkflow-requirements 同期だけを同一 wave で完了 |
| watchdog | Issue #518 HOLD で watchdog workflow は削除済み。Issue #581 は存在しない watchdog workflow API を叩かず lifecycle marker JSON を Phase 11 evidence に保存する |
| pointer | `docs/30-workflows/unassigned-task/issue-546-cf-audit-logs-90day-reobservation-reminder-001.md` は source reminder / pointer として保持 |

### Issue #514 Cloudflare Audit Logs Cold Storage / R2 Export（2026-05-07）

| 項目 | 値 |
| --- | --- |
| ステータス | implemented-local / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING / Issue #514 CLOSED |
| 成果物 | `docs/30-workflows/completed-tasks/issue-514-cf-audit-logs-cold-storage-r2-export/` |
| 目的 | Issue #408 の D1 `cf_audit_log` 30 日 retention を超える redacted audit log を R2 cold storage へ日次 export し、半期監査と restore drill に備える |
| cadence | daily `0 2 * * *`。対象 window は `[now - 29d, now - 26d)`。manifest completed partition は skip |
| manifest | `cf_audit_log_export_manifest`、`(yyyy, mm, dd)` UNIQUE、`pending -> completed/failed` 2-phase |
| gate | G1 R2/bucket/secret/deploy -> G2 D1 migration apply -> G3-prod first daily export + restore drill -> G4 commit/push/PR |
| runtime境界 | 本サイクルでは production R2 / D1 / GitHub Secrets / commit / PR は未実行。Phase 11/12/13 skeleton と SSOT 同期のみ完了 |
| 正本同期 | `references/observability-monitoring.md` / `references/deployment-secrets-management.md` / `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` / `references/lessons-learned-issue-514-cf-audit-logs-cold-storage-r2-export-2026-05.md` |
| 苦戦知見 | `references/lessons-learned-issue-514-cf-audit-logs-cold-storage-r2-export-2026-05.md` (L-ISSUE514-001..007: artifacts mirror parity / Phase 11 10 screenshots, Phase 12 strict 7 outputs / `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` 語彙 / G1-G4 gate sequence / monthly→daily cadence 補正 / source schema 整合 + r2_etag / 6-category redaction guard) |


### parallel-10-auth-session-handling（2026-05-15）

| 項目 | 内容 |
| --- | --- |
| 成果物 | `docs/30-workflows/parallel-10-auth-session-handling/` |
| 状態 | `implemented_local_evidence_captured / implementation / NON_VISUAL / Phase 13 blocked_pending_user_approval` |
| 目的 | Client admin mutation の 401 / 403 handling を統一する。401 は safe `/login?redirect=<current>`、403 は alert toast + error state とする。 |
| 実装 | `apps/web/src/features/admin/hooks/useAdminMutation.ts`, `apps/web/src/components/ui/Toast.tsx`, `apps/web/src/lib/url/safe-redirect.ts` |
| 仕様同期 | `docs/00-getting-started-manual/specs/02-auth.md` に Client 401 / 403 handling を追加。silent refresh は MVP 不採用。 |
| evidence | `outputs/phase-11/evidence/{typecheck,lint,test,build}.txt`, `outputs/phase-11/visual-verification-skip.md`, `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| user gate | commit / push / PR |

### task-05a-form-preview-503-001（2026-05-05）

| 項目 | 値 |
| --- | --- |
| ステータス | implemented-local-runtime-evidence-blocked / implementation / NON_VISUAL / Phase 12 strict 7 files present / Phase 11 runtime evidence blocked / Phase 13 blocked_until_user_approval |
| 成果物 | `docs/30-workflows/task-05a-form-preview-503-001/` |
| Issue 取扱 | GitHub Issue #388 は CLOSED 維持。PR / commit では `Refs #388` のみ採用し、`Closes #388` は使わない |
| 対象 | staging `GET /public/form-preview` の HTTP 503。直接原因は `getLatestVersion()` が `null` を返し、`UBM-5500` が 503 mapping される経路 |
| D1 契約 | `schema_versions(form_id, revision_id, schema_hash, state, synced_at, source_url, field_count, unknown_field_count)`。公開可能な最新行は `state = 'active'` |
| 検証 | NON_VISUAL Phase 11: `outputs/phase-11/main.md` / `manual-smoke-log.md` / `link-checklist.md`。2026-05-05 review curl は staging / production とも 503。focused local regression は code側証跡、runtime 200 は user-approved D1 operation 後に取得 |
| 境界 | `/public/form-preview` response shape、D1 schema、apps/web direct D1 access、production mutation は変更しない。staging D1 write / deploy / PR は user gate 後 |
| inventory / lessons | `references/workflow-task-05a-form-preview-503-001-artifact-inventory.md`, `references/lessons-learned-05a-form-preview-503-2026-05.md` |

### Issue #379 schemaDiffQueue fakeD1 compat verification（2026-05-05）

| 項目 | 値 |
| --- | --- |
| ステータス | verified_current_no_code_change_pending_pr / implementation / NON_VISUAL / Phase 12 strict outputs present / Phase 13 blocked_pending_user_approval |
| 成果物 | `docs/30-workflows/issue-379-schema-diff-queue-faked1-compat/` |
| 元 trace | `docs/30-workflows/unassigned-task/task-schema-diff-queue-faked1-compat-001.md` |
| 判断 | 旧前提の `schemaDiffQueue.test.ts` list 系 2 fail は現 worktree で再現せず、focused Vitest は 7/7 PASS。A+B（fakeD1 parser extension + seed parity）実装案は撤回し、current GREEN verification close-out として閉じる |
| 検証 | `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/api/src/repository/schemaDiffQueue.test.ts` PASS。focused coverage snapshot / Phase 11 after evidence / Phase 12 strict 7 files を保存 |
| 境界 | `apps/api/src/repository/_shared/__fakes__/fakeD1.ts`、`schemaDiffQueue.ts`、`schemaDiffQueue.test.ts` は未変更。Issue #379 は CLOSED 維持、PR 文脈では `Refs #379` のみ |


### Issue #399 Admin Queue Resolve Staging Visual Evidence（2026-05-03）

| 項目 | 値 |
| --- | --- |
| ステータス | implementation-prepared / implementation / VISUAL_ON_EXECUTION / Phase 12 strict outputs present / Phase 11 runtime evidence pending / Phase 13 blocked_until_user_approval |
| 成果物 | `docs/30-workflows/issue-399-admin-queue-resolve-staging-visual-evidence/` |
| 目的 | 04b-followup-004 の `/admin/requests` delegated visual evidence gap を、staging-only reversible seed + 7 screenshot capture runbook + redaction rule + parent evidence link plan で閉じる |
| seed識別 | D1 schema変更なし。既存ID列の `ISSUE399-` synthetic prefix で投入・撤去対象を識別 |
| 検証 | `mise exec -- pnpm exec vitest run apps/api/migrations/seed/__tests__ scripts/staging/__tests__`（focused Vitest）。staging seed / screenshot / redaction の runtime evidence は user 承認付き実行サイクル |
| runtime境界 | staging seed投入 / screenshot取得 / cleanup / 親implementation-guideへの実link適用は Phase 11 runtime evidence 完了後。現時点では PASS 証跡ではない |
| 親 / 下流 | parent: `docs/30-workflows/completed-tasks/04b-followup-004-admin-queue-resolve-workflow/`; blocks: parent visual evidence complete close-out |
| Issue 取扱 | #399 CLOSED 維持。reopen / commit / push / PR / Issue comment は user 明示指示後のみ |

### Issue #400 Admin Request Audit Target Taxonomy（2026-05-06）

| 項目 | 値 |
| --- | --- |
| ステータス | implemented-local / implementation / NON_VISUAL / Phase 1-12 completed / Phase 13 blocked_pending_user_approval |
| 成果物 | `docs/30-workflows/completed-tasks/issue-400-admin-request-audit-target-taxonomy/` |
| 実装 | `apps/api/src/repository/auditLog.ts`, `apps/api/src/routes/admin/requests.ts`, `apps/api/src/routes/admin/audit.ts`, `apps/web/src/components/admin/AuditLogPanel.tsx` |
| 公開契約 | 新規 admin request resolve audit は `targetType='admin_member_note'`, `targetId=<noteId>`, `after.memberId` を保持。既存 `member` 行は migration せず readable |
| 検証 | focused API repository/route tests、web AuditLogPanel test、typecheck |
| Issue 取扱 | #400 CLOSED 維持。PR では `Refs #400` のみ採用し、reopen / close automation は行わない |

### UT-05A Auth UI Logout Button（2026-05-03）

| 項目 | 値 |
| --- | --- |
| ステータス | implemented-local-runtime-evidence-blocked / implementation / VISUAL_ON_EXECUTION / Phase 12 strict outputs present / Phase 13 blocked_until_user_approval |
| 成果物 | `docs/30-workflows/ut-05a-auth-ui-logout-button-001/` |
| 実装 | `apps/web/src/components/auth/SignOutButton.tsx`, `apps/web/src/components/layout/MemberHeader.tsx`, `apps/web/app/profile/page.tsx`, `apps/web/app/(member)/layout.tsx`, `apps/web/src/components/layout/AdminSidebar.tsx` |
| 公開契約 | `/profile` と `/admin` のログイン済 UI に `data-testid="sign-out-button"` を配置し、Auth.js `signOut({ callbackUrl: "/login" })` を単一 component へ集約 |
| 検証 | focused unit test / web typecheck / task-spec validator。OAuth visual smoke、session-after、cookie redaction は runtime evidence blocked |
| 上流 / 下流 | 05a-followup-google-oauth-completion M-08 は本 workflow Phase 11 の実 evidence が揃るまで PASS にしない |
| Issue 取扱 | #386 は CLOSED 維持。commit / push / PR / Issue comment は user 明示指示後のみ |

### UT-07B Schema Alias Hardening（2026-05-01）

| 項目 | 値 |
| --- | --- |
| ステータス | implemented-local / Phase 1-12 完了 / Phase 13 pending_user_approval / NON_VISUAL |
| 成果物 | `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/` |
| 実装 | `apps/api/migrations/0008_schema_alias_hardening.sql` / `apps/api/src/repository/schemaAliases.ts` / `apps/api/src/workflows/schemaAliasAssign.ts` / `apps/api/src/routes/admin/schema.ts` |
| 公開契約 | `POST /admin/schema/aliases` HTTP 202 retryable continuation（`backfill_cpu_budget_exhausted`） |
| 検証 | local typecheck + route/workflow/repository tests 完了。10,000 行 staging D1 / Workers 実測は `staging-deferred` |
| 後続 | queue/cron split は Phase 11 staging evidence で必要性が出た場合のみ formalize |

### UT-07B-FU-01 Schema Alias Back-fill Queue/Cron Split（2026-05-06）

| 項目 | 値 |
| --- | --- |
| workflow_state | spec_created |
| implementation state | implemented-local |
| Phase 10 gate | design-ready only |
| Phase 11 gate | local implementation GO / runtime evidence pending |
| Phase 12 | strict 7 outputs present |
| issue | #361 CLOSED (PR text: `Refs #361` only) |
| artifact inventory | `references/workflow-ut-07b-fu-01-schema-alias-backfill-queue-cron-split-artifact-inventory.md` |
| ステータス | implemented-local / Phase 5-10 + Phase 11 gate=GO（user 明示） / Phase 12 strict outputs present / staging deploy 未実行 |
| 成果物 | `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/` |
| 目的 | staging 10,000+ rows evidence で `backfill_cpu_budget_exhausted` が持続再現する場合だけ、schema alias back-fill を Queue/Cron continuation へ分離する条件付き実装仕様 |
| 実装 | `apps/api/migrations/0014_schema_diff_queue_dedupe_failure.sql` / `apps/api/src/repository/schemaDiffQueue.ts`（dedupe / failed_items / retry / last_error / last_processed_at）/ `apps/api/src/workflows/schemaAliasBackfillBatch.ts`（remaining-scan + idempotent UPDATE + retry counter）/ `apps/api/src/workflows/schemaAliasEnqueue.ts`（dedupe_key 予約 + producer.send）/ `apps/api/src/routes/admin/schema.ts`（v2 contract: confirmed/backfill.status + GET status）/ `apps/api/src/index.ts queue()` consumer / `apps/api/wrangler.toml` SCHEMA_ALIAS_BACKFILL_QUEUE binding |
| 契約 | 公開 API `backfill.status` は `pending / running / exhausted / completed`。internal DB `backfill_status='failed'` は public `exhausted` + `internalStatus:'failed'` metadata として返す。`completed=200` / continuation は `202`。後方互換のため `code: "backfill_cpu_budget_exhausted"` / `retryable: true` を `exhausted` と並存維持 |
| artifacts | root `artifacts.json` と `outputs/artifacts.json` parity、Phase 12 strict 7 files materialized |
| 検証 | local typecheck / lint / vitest（schemaDiffQueue / schemaAliasAssign / schemaAliasBackfillBatch / schemaAliasEnqueue / route schema） 38 tests PASS。staging deploy / Cloudflare Queue binding apply / production apply は user 明示承認まで未実行 |
| 境界 | Phase 11 staging evidence による runtime gate 判定本体は実走しておらず、user 明示で local implementation GO として実装した。staging Queue/DLQ 作成、Cloudflare deploy、production migration apply、commit、push、PR、Issue #361 comment/reopen は未実行。Issue #361 は CLOSED 維持で `Refs #361` のみ |

### Issue #502 / UT-07B-FU-01-FOLLOWUP DLQ Monitoring Dashboard（2026-05-07）

| 項目 | 値 |
| --- | --- |
| workflow_state | spec_created |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| Phase 11 | contract_ready_runtime_pending（local grep / read-only SQL template evidence captured; staging D1 SQL and dash runtime evidence pending_user_approval） |
| Phase 12 | strict 7 outputs present |
| issue | #502 CLOSED (PR text: `Refs #502` only) |
| 成果物 | `docs/30-workflows/completed-tasks/issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard/` |
| runbook | `docs/runbooks/dlq-monitoring/schema-alias-backfill.md` |
| skill reference | `references/dlq-monitoring.md` |
| artifact inventory | `references/workflow-issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard-artifact-inventory.md` |
| lessons | `references/lessons-learned-issue-502-dlq-monitoring-dashboard-2026-05.md`（L-502-001〜005） |
| 目的 | UT-07B-FU-01 の Cloudflare Queue / DLQ binding と D1 `schema_diff_queue` failure 永続化列を、runbook + read-only 集計 SQL で運用者が観測できる状態にする |
| 契約 | Queue/DLQ は `SCHEMA_ALIAS_BACKFILL_QUEUE` binding、prod `schema-alias-backfill` / `schema-alias-backfill-dlq`、staging `schema-alias-backfill-staging` / `schema-alias-backfill-staging-dlq`。D1 集計 SQL は `retry_count` / `failed_items_json` / `last_processed_at` / `backfill_status` のみを使い、`last_error` 原文 SELECT / 転記は禁止 |
| しきい値 | DLQ >= 1 / retry_count >= 3 / exhausted 24h |
| 境界 | Pager / Slack / PagerDuty 連携、Queue / DLQ 構造変更、D1 schema 変更、apps/api 実装変更は本タスク scope 外。しきい値超過時の追加実装は別 unassigned task としてユーザー判断後に起票する |

### UT-07B-FU-02 Admin Schema Alias Retry Label（2026-05-06）

| 項目 | 値 |
| --- | --- |
| workflow_state | implemented-local |
| implementation state | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| Phase 11 | component evidence PASS / runtime screenshot pending |
| Phase 12 | strict 7 outputs present |
| issue | #362 CLOSED (PR text: `Refs #362` only) |
| 成果物 | `docs/30-workflows/ut-07b-fu-02-admin-schema-alias-retry-label/` |
| 目的 | HTTP 202 + `backfill.status='exhausted'` + `retryable=true` + `code='backfill_cpu_budget_exhausted'` を `/admin/schema` UI で通常 success / validation error / conflict error と区別し、続きから再試行できる状態として表示する |
| 実装 | `apps/web/src/lib/admin/api.ts` の predicate `isSchemaAliasRetryableContinuation`（5 点合致: `status=202` ∧ `backfill.status='exhausted'` ∧ `retryable=true` ∧ `code='backfill_cpu_budget_exhausted'` ∧ `mode='apply'`）、`apps/web/src/components/admin/SchemaDiffPanel.tsx` の feedback state、focused `api.spec.ts` / `SchemaDiffPanel.component.spec.tsx` |
| 検証 | focused Vitest 30 tests PASS。JUnit: `docs/30-workflows/ut-07b-fu-02-admin-schema-alias-retry-label/outputs/phase-11/test-junit.xml` |
| 境界 | API contract / D1 schema / queue-cron workflow は変更しない。manual screenshot / commit / push / PR は user-gated。苦戦箇所と適用ルールは `references/lessons-learned-ut07b-fu-02-admin-schema-alias-retry-label-2026-05.md`（L-UT07B-FU02-001 5 点 narrowing / L-002 confirmed と backfill.status の責務分離 / L-003 code 不一致 fallback / L-004 4 状態 manual screenshot deferred） |

### UT-07B Alias Recommendation i18n（2026-05-17）

| 項目 | 値 |
| --- | --- |
| workflow_state | implemented_local_evidence_captured |
| implementation state | implementation |
| visualEvidence | NON_VISUAL |
| issue | #292 CLOSED (`Refs #292` only for PR text) |
| 成果物 | `docs/30-workflows/ut-07b-alias-recommendation-i18n/` |
| 目的 | `GET /admin/schema/diff` の `recommendedStableKeys` label 比較を NFKC + trim + whitespace 圧縮で安定化する |
| 実装 | `apps/api/src/services/aliasRecommendation.ts` の `normalizeLabelForCompare` と `recommendAliases` の normalized Levenshtein 入力 |
| 検証 | `aliasRecommendation.spec.ts` 20 tests PASS。`schema.contract.spec.ts` 16 tests PASS。apps/api suite 48 files / 300 tests PASS |
| 境界 | response shape / DB schema / UI は変更しない。大規模 back-fill / retryable continuation は UT-07B hardening の責務。commit / push / PR は user-gated |

### UT-07B-FU-03 Production Migration Apply Runbook（2026-05-02）

| 項目 | 値 |
| --- | --- |
| ステータス | spec_created / implementation+operations+runbook / implemented-local / NON_VISUAL / Phase 13 blocked_until_user_approval |
| 成果物 | `docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/` |
| 対象 | `apps/api/migrations/0008_schema_alias_hardening.sql` を `ubm-hyogo-db-prod` へ適用するための承認ゲート付き runbook + `scripts/d1/*` 検証スクリプト + CI gate |
| 境界 | production apply は本タスクでは未実行。実 apply は commit / PR / merge 後、ユーザー明示承認を得た別運用タスクで実施 |
| 検証 | workflow-local strict Phase 12 7 files と root/outputs artifacts parity は materialized。`pnpm test:scripts` は fallback 経路で PASS（Node 22 warning あり）。staging DRY_RUN / CI green は Phase 13 PR runtime evidence |
| Issue | #363 CLOSED 維持。PR では `Refs #363` のみ採用し、`Closes #363` は使わない |

### UT-07B-FU-04 Production Migration Already-Applied Verification（2026-05-04）

| 項目 | 値 |
| --- | --- |
| ステータス | spec_created / implementation+operations+verification / NON_VISUAL / completed_boundary_runtime_pending / runtime verification blocked_until_user_approval |
| 成果物 | `docs/30-workflows/ut-07b-fu-04-production-migration-apply-execution/` |
| 対象 | `apps/api/migrations/0008_schema_alias_hardening.sql` の production D1 ledger 既適用 fact を再確認し、duplicate apply を禁止する evidence contract |
| 境界 | `references/database-schema.md` は `0008_schema_alias_hardening.sql` が `2026-05-01 08:21:04 UTC` に production D1 ledger 登録済みと記録しているため、FU-04 は再 apply ではなく already-applied verification と正本同期に再構成する |
| 検証 | Phase 11 placeholder evidence / Phase 12 strict 7 files / root-outputs artifacts parity / FU-04 artifact inventory を materialized。Cloudflare runtime verification は user 明示承認まで未実行。post-check scope は `schema_diff_queue.backfill_cursor` / `backfill_status` のみ。苦戦箇所 / 適用ルールは `references/lessons-learned-ut07b-fu04-production-migration-already-applied-verification-2026-05.md`（L-UT07B-FU04-001〜004） |
| Issue | #424 CLOSED 維持。PR では `Refs #424` のみ採用し、`Closes #424` は使わない |

### UT Coverage 2026-05 Wave（2026-05-01）

| 項目 | 値 |
| --- | --- |
| ステータス | implemented-local / test-fixture + admin component + UT-08A-01 public API test implementation / NON_VISUAL / Phase 1-12 completed / Phase 13 pending_user_approval |
| wave guide | `docs/30-workflows/ut-coverage-2026-05-wave/README.md` |
| ci recovery follow-up | `docs/30-workflows/ci-test-recovery-coverage-80-2026-05-04/README.md`（spec_created / implementation / NON_VISUAL。Task A-E parent-local canonical dirs、Phase 12 strict 7、root-only artifacts parity） |
| wave-1 | `docs/30-workflows/completed-tasks/ut-api-cov-precondition-01-test-failure-recovery/` |
| wave-2 | completed workflow roots under `docs/30-workflows/completed-tasks/` with historical grouping under `docs/30-workflows/ut-coverage-2026-05-wave/wave-2-parallel-coverage/`; UT-08A-01 canonical implementation root: `docs/30-workflows/completed-tasks/ut-08a-01-public-use-case-coverage-hardening/` |
| ut-web-cov-04 current canonical | `docs/30-workflows/completed-tasks/ut-web-cov-04-admin-lib-ui-primitives-coverage/`（implemented-local / NON_VISUAL / Phase 1-12 completed / Phase 13 blocked_pending_user_approval。旧 nested path は historical wave grouping path） |
| task-10 ui primitives current canonical | `docs/30-workflows/completed-tasks/task-10-ui-primitives-spec/`（runtime-evidence-captured / implementation / VISUAL_ON_EXECUTION / existing-ui-integration）。既存 `apps/web/src/components/ui` Wave 0 baseline を削除せず、task-10 の 11 primitive contract を barrel `@/components/ui` へ統合済み。follow-up 001 (`docs/30-workflows/task-10-followup-001-opennext-esbuild-mismatch/`) で `build:cloudflare` は PASS、follow-up 001 inventory は `references/workflow-task-10-followup-001-opennext-esbuild-mismatch-artifact-inventory.md`。follow-up 002 相当の runtime screenshot / axe は `outputs/phase-11/evidence/` に保存済み。`Stat` の `<dt>/<dd>` axe violation は同 cycle で修正済み。 |
| task-11 public top + member list current canonical | `docs/30-workflows/task-11-public-top-and-member-list/`（implemented-local / implementation / VISUAL_ON_EXECUTION / IMPLEMENTED_LOCAL_RUNTIME_PENDING）。公開トップ `/` と `/members` の実装仕様。既存 `/public/stats` / `/public/members` のみ消費し、`apps/api/**` 変更なし。Phase 12 strict 7 と root/output artifacts parity は present。apps/web 実装はローカル反映済み。runtime screenshot / axe / coverage、commit / push / PR は user approval 後。Lessons: `references/lessons-learned-task-11-public-top-and-member-list-2026-05.md`（L-T11-001..006: route colocation 廃止 / 4 section 集約 / API adapter 層 / `force-dynamic` 撤去 / `PENDING_RUNTIME_EVIDENCE` follow-up / playwright project 絞込）。Changelog: `changelog/20260509-task-11-public-top-and-member-list.md`。 |
| task-13 login rebuild current canonical | `docs/30-workflows/task-13-login-rebuild/`（implemented-local / implementation / VISUAL_ON_EXECUTION / IMPLEMENTED_LOCAL_RUNTIME_PENDING）。`/login` を 5 core states (`input / sent / unregistered / deleted / error`) + `rules_declined` derived state + `gate=admin_required` overlay のカード型 UI へ rebuild。Phase 12 strict 7 と root/output artifacts parity は present。`data-testid="login-card"` + `data-state` locator、`rules_declined` alert role、Magic Link failure `state=error` URL transition、Auth.js + Magic Link API route surface 不変、`@ubm-hyogo/web` command contract / `verify-design-tokens` script を正本化。apps/web 実装、focused Vitest、local Playwright screenshot evidence はローカル反映済み。staging smoke / production-equivalent runtime evidence / commit / push / PR は user approval 後。Changelog: `changelog/20260509-task-13-login-rebuild.md`。 |
| wave-3 roadmap | `docs/30-workflows/issue-433-ut-web-cov-05-wave3-roadmap/`（implemented-local / implementation / NON_VISUAL / Issue #433 / Phase 1-12 completed / Phase 13 blocked_pending_user_approval）。Final roadmap path: `docs/30-workflows/ut-coverage-2026-05-wave/wave-3-roadmap.md` |
| inventory | `references/workflow-ut-coverage-2026-05-wave-artifact-inventory.md` |
| lessons | `references/lessons-learned-ut-coverage-2026-05-wave.md`（L-UTCOV-001〜011。009: package filter batch、010: public use-case D1 mock dispatch、011: auth/fetch/session fetch-mock + structural uncovered） |
| 目的 | apps/api の 13 failing tests を先に解消し、Issue #320 coverage hardening が `coverage-summary.json` を取得できる状態に戻す。wave-2 では `ut-web-cov-01` の admin component focused tests と `ut-08a-01` の public use-case / public route focused tests を実装済み |
| AC | precondition gate: apps/api 13 failure green、coverage-summary.json 生成、`bash scripts/coverage-guard.sh --no-run --package apps/api` exit 0、apps/api coverage 80% gate PASS。wave-2 focused gates は `ut-web-cov-01`〜`04` + `ut-08a-01` で実測済み（`ut-web-cov-01` gate: web coverage Vitest 21 files / 196 tests PASS、対象7ファイルすべて Statements/Functions/Lines >=85%・Branches >=80%。`ut-08a-01` gate: public use-case negative matrix、D1 failure、public route cache/auth boundary focused tests を追加。全 apps/api coverage は pre-existing `schemaAliasAssign` timeout risk と分離して扱う）。Issue #433 wave-3 roadmap は package totals / gap mapping / 8 candidate tasks を materialize 済みで、post-push `verify-indexes-up-to-date` green は Phase 13 user 承認後に取得 |
| 境界 | wave-1 は test fixture `apps/api/src/jobs/__fixtures__/d1-fake.ts` のみ実装済み。`ut-web-cov-01` は apps/web test files のみ、`ut-08a-01` は apps/api test files のみ実装済み。runtime production code、packages/*、commit、push、PR は Phase 13 user approval まで実行しない |

#### UT-WEB-COV-03 auth/fetch lib coverage implementation spec（2026-05-03）

| 項目 | 値 |
| --- | --- |
| ステータス | implemented-local / implementation / test_implementation / NON_VISUAL / Phase 1-12 completed / Phase 13 pending_user_approval |
| 成果物 | `docs/30-workflows/ut-web-cov-03-auth-fetch-lib-coverage/` |
| 対象 | apps/web auth/fetch/session lib 7 本（`auth.ts` / `magic-link-client.ts` / `oauth-client.ts` / `session.ts` / `fetch/authed.ts` / `fetch/public.ts` / `api/me-types.ts`） |
| 境界 | 旧 docs-only 指定は CONST_004 により撤回。仕様書 root は wave nested path から top-level workflow root へ移動済み。apps/web test file 実装と coverage 実測は完了。commit・push・PR は Phase 13 user approval まで未実行 |
| 検証 | root/outputs `artifacts.json` parity、Phase 1-13 specs、Phase 11 NON_VISUAL measured evidence、Phase 12 strict 7 files、`pnpm --filter @ubm-hyogo/web test:coverage` PASS（40 files / 359 tests） |

### 03b Response Sync Follow-ups（2026-05-02）

| 項目 | 値 |
| --- | --- |
| ステータス | unimplemented follow-up specs / implementation / VISUAL_ON_EXECUTION |
| 正本 | `docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver-followups/03b-response-sync-followups.md` |
| 対象 | `03b-followup-001-email-conflict-identity-merge.md` ほか 8 follow-up |
| 境界 | 各 follow-up は親 03b Phase 12 由来の単一 md 指示書であり、Phase 1-13 workflow root ではない。着手時に正式 workflow root、`artifacts.json`、Phase 1-13、Phase 12 必須 7 成果物、Phase 13 user approval gate へ昇格する |
| current fact | responseEmail UNIQUE は `member_identities.response_email` が正本。identity merge は `member_identities` / `member_status` / `audit_log` を主語にし、`member_responses.member_id` 付替を前提にしない |

#### Issue #199 03b Follow-up 006 Per-Sync Cap Alert（2026-05-03）

| 項目 | 値 |
| --- | --- |
| ステータス | implemented-local / implementation / NON_VISUAL / Phase 11 local evidence present / Phase 12 strict outputs present / Phase 13 blocked_until_user_instruction |
| 成果物 | `docs/30-workflows/completed-tasks/task-03b-followup-006-per-sync-cap-alert/` |
| 目的 | `sync_jobs.metrics_json.writeCapHit?: boolean` を追加し、直近 3 件の response sync が cap hit へ未達から達成へ遷移した時だけ Analytics Engine dataset `sync_alerts` へ `sync_write_cap_consecutive_hit` を emit する |
| alert 契約 | absent / NULL は false 解釈。event payload は `blobs=["sync_write_cap_consecutive_hit", "response_sync"]`, `doubles=[consecutiveHits, windowSize]`, `indexes=[jobId]`。detector は `ORDER BY started_at DESC, job_id DESC LIMIT 4` で current / previous window を比較し、failed / skipped row を streak reset として扱って重複 emit を抑制 |
| 境界 | cap 値変更、cron 間隔変更、GitHub / Slack / mail 通知チャネル本体構築、Cloudflare deploy、commit / push / PR は user 明示指示まで実行しない。Issue #199 は OPEN 維持し PR / commit は `Refs #199` のみ |


### 04b Follow-up 004 Admin Queue Resolve Workflow（2026-05-01）

| 項目 | 値 |
| --- | --- |
| ステータス | implementation_completed / Phase 1-12 完了 / Phase 13 pending_user_approval / VISUAL deferred-to-staging |
| 成果物 | `docs/30-workflows/04b-followup-004-admin-queue-resolve-workflow/` |
| 実装 | `apps/api/src/routes/admin/requests.ts`, `apps/api/src/repository/adminNotes.ts`, `apps/web/app/(admin)/admin/requests/page.tsx`, `apps/web/src/components/admin/RequestQueuePanel.tsx`, `apps/web/src/lib/admin/api.ts` |
| 公開契約 | `GET /admin/requests`, `POST /admin/requests/:noteId/resolve` |
| 検証 | repository / route / UI component focused Vitest、api/web typecheck。実 screenshot は admin session + D1 fixture staging task へ委譲 |
| 後続 | notification / audit target taxonomy / retention physical deletion / staging visual evidence |

### Issue #401 Admin Request Notification（2026-05-06）

| 項目 | 値 |
| --- | --- |
| ステータス | implemented-local / implementation / NON_VISUAL / Phase 1-12 completed / Phase 11 runtime evidence pending / Phase 13 blocked_until_user_approval |
| 成果物 | `docs/30-workflows/completed-tasks/issue-401-admin-request-notification/` |
| 目的 | `POST /admin/requests/:noteId/resolve` 完了後に、本人へ approve / reject 結果を outbox + dispatch worker で通知する |
| 実装 | `apps/api/migrations/0014_notification_outbox.sql`, `apps/api/src/repository/notificationOutbox.ts`, `apps/api/src/services/notification/*`, `apps/api/src/workflows/notificationDispatchTick.ts`, `apps/api/src/routes/admin/requests.ts`, `apps/api/src/index.ts`, `apps/api/src/notification-mail-config.test.ts`, `apps/api/wrangler.toml` |
| 公開契約 | resolve transaction は rollback せず、notification enqueue は best-effort。recipient は `member_identities.response_email`、mail env は `MAIL_PROVIDER_KEY` / `MAIL_FROM_ADDRESS`。`MAIL_PROVIDER_KEY` missing / `.example` sender は claim 前に dispatch skip |
| retry/DLQ | retryable failure は `pending` に戻す。`failed` は ledger event only。stale `dispatching` は lease timeout 後に再 claim。max retry or non-retryable failure で `dlq` |
| PII/監査 | raw `resolutionNote` は email / `notification_outbox.reason_summary` / `notification_ledger.detail_json` にコピーしない。provider error body は error class に縮約して保存 |
| 境界 | staging D1 apply / Resend send / production migration / commit / push / PR / Issue mutation は user 明示承認まで実行しない。Issue #401 は CLOSED 維持し PR では `Refs #401` |

### Issue #112 API Worker Env 型 SSOT（2026-05-01）

| 項目 | 値 |
| --- | --- |
| ステータス | implemented-local / Phase 1-12 完了 / Phase 13 pending_user_approval / NON_VISUAL |
| 成果物 | `docs/30-workflows/issue-112-02c-followup-api-env-type-helper/` |
| 実装 | `apps/api/src/env.ts` / `apps/api/src/repository/_shared/db.ts` / `scripts/lint-boundaries.mjs` |
| 公開契約 | `Env` interface を API Worker binding 型の SSOT とし、`ctx(env: Pick<Env, "DB">)` で repository context を作る |
| 検証 | typecheck / lint PASS。API full test は pre-existing `schemaDiffQueue.test.ts` 2 件失敗を記録。boundary lint は `../../api/src/env` relative import も遮断 |
| 後続 | KV / R2 / OAuth / Magic Link HMAC key は各後続タスクで `wrangler.toml` と `Env` を同一 wave 同期 |

### Issue #195 03b Follow-up 002 Sync Shared Modules Owner（2026-05-02）

| 項目 | 値 |
| --- | --- |
| ステータス | completed / code / NON_VISUAL / implemented-local / Phase 1-12 completed / Phase 13 pending_user_approval |
| 成果物 | `docs/30-workflows/completed-tasks/issue-195-03b-followup-002-sync-shared-modules-owner/` |
| 目的 | 03a / 03b が共有する `apps/api/src/jobs/_shared/{ledger,sync-error,index}.ts` skeleton を実体化し、owner / co-owner / 変更ルールを `docs/30-workflows/_design/sync-shared-modules-owner.md` に明文化する |
| 境界 | owner 表作成、03a / 03b index 追記、`.github/CODEOWNERS` path 行、`apps/api/src/jobs/_shared/{ledger,sync-error,index}.ts` skeleton と focused tests を同一 wave で実体化済み。既存本体ロジックは `apps/api/src/repository/syncJobs.ts` / `apps/api/src/jobs/sync-forms-responses.ts` に残し、物理移管・置換は未実施 |
| 後続 | `sync_jobs` `job_type` / `metrics_json` schema 集約は `docs/30-workflows/unassigned-task/task-issue195-sync-jobs-contract-schema-consolidation-001.md`。用語統一候補は本サイクル内 grep で current spec drift なしと判定し、`docs/30-workflows/completed-tasks/task-issue195-owner-coowner-terminology-normalization-001.md` は resolved record として残す |


### 目的

ユーザーから与えられた複雑なタスクを分解し、以下を実現する：

- 単一責務の原則に基づいたサブタスク分割
- 各サブタスクに最適なコマンド・エージェント・スキルの選定
- そのまま実行可能な仕様書ドキュメントの生成
- TDDサイクル（Red→Green→Refactor）の組み込み
- 品質ゲートの明確化

### 成果物配置

生成された仕様書は以下のパス形式で配置する。

| 要素       | 説明                               | 例                                                        |
| ---------- | ---------------------------------- | --------------------------------------------------------- |
| ベースパス | `docs/30-workflows/`               | 固定                                                      |
| 機能名     | 実装対象の機能を表すディレクトリ名 | `skill-import-agent/`                                     |
| ファイル名 | `task-step{N}-{機能名}.md` 形式    | `task-step1-init.md`                                      |
| 完全パス例 | 上記を組み合わせた配置先           | `docs/30-workflows/skill-import-agent/task-step1-init.md` |

---

### docs-only direction-reconciliation の stale 撤回境界

docs-only / direction-reconciliation で採用方針 A を維持する場合でも、既存 references、runtime mount、cron、Secret、migration に不採用方針 B の current 風記述・経路が残るなら、Phase 12 Step 2 は「不発火」ではなく **stale 撤回として発火**させる。

- 正本採用更新: 不採用方針を新たに current 登録しない。
- stale 撤回: 残存する不採用方針の current 風記述・runtime 経路を audit し、撤回・停止タスクを起票する。
- 判定表記: 実測 PASS、記述済み、pending_creation、NOT_APPLICABLE を分け、未実行 validator や未起票タスクを PASS としない。

第一適用例: `docs/30-workflows/ut09-direction-reconciliation/`。

---

## ドキュメント構成

| ドキュメント     | ファイル                                             | 説明                                           |
| ---------------- | ---------------------------------------------------- | ---------------------------------------------- |
| フェーズ定義     | [task-workflow-phases.md](./task-workflow-phases.md) | Phase 0〜6の詳細定義とテンプレート             |
| ルール・選定基準 | [task-workflow-rules.md](./task-workflow-rules.md)   | 品質ゲート、コマンド・エージェント・スキル選定 |

---

## フェーズ構造（概要）

すべてのタスクは以下のフェーズ構造に従う。詳細は [task-workflow-phases.md](./task-workflow-phases.md) を参照。

| フェーズ                                  | ID接頭辞 | 目的                                         |
| ----------------------------------------- | -------- | -------------------------------------------- |
| Phase 0: 要件定義                         | `T-00`   | タスクの目的、スコープ、受け入れ基準を明文化 |
| Phase 1: 設計                             | `T-01`   | 要件を実現可能な構造に落とし込む             |
| Phase 2: テスト作成 (TDD: Red)            | `T-02`   | 期待される動作を検証するテストを先行作成     |
| Phase 3: 実装 (TDD: Green)                | `T-03`   | テストを通すための最小限の実装               |
| Phase 4: リファクタリング (TDD: Refactor) | `T-04`   | 動作を変えずにコード品質を改善               |
| Phase 5: 品質保証                         | `T-05`   | 定義された品質基準をすべて満たすことを検証   |
| Phase 6: ドキュメント更新                 | `T-06`   | 実装内容をシステム要件ドキュメントに反映     |

### フェーズ遷移図

以下の表はフェーズ間の遷移関係を示す。通常は上から順に進行し、Phase 5で品質ゲートを通過しない場合はPhase 4に戻る。

| 遷移元                    | 遷移先                    | 条件                 |
| ------------------------- | ------------------------- | -------------------- |
| Phase 0: 要件定義         | Phase 1: 設計             | 要件定義完了         |
| Phase 1: 設計             | Phase 2: テスト作成       | 設計完了             |
| Phase 2: テスト作成       | Phase 3: 実装             | テスト作成完了       |
| Phase 3: 実装             | Phase 4: リファクタリング | 実装完了             |
| Phase 4: リファクタリング | Phase 5: 品質保証         | リファクタリング完了 |
| Phase 5: 品質保証         | Phase 6: ドキュメント更新 | 品質ゲート通過       |
| Phase 5: 品質保証         | Phase 4: リファクタリング | 品質ゲート未通過     |
| Phase 6: ドキュメント更新 | 完了                      | ドキュメント更新完了 |

---

## 品質ゲート（概要）

次フェーズに進む前に満たすべき品質基準。詳細は [task-workflow-rules.md](./task-workflow-rules.md) を参照。

- 機能検証: 全テスト成功（ユニット、統合、E2E）
- コード品質: Lintエラーなし、型エラーなし、フォーマット適用済み
- テスト網羅性: カバレッジ基準達成（60%以上）
- セキュリティ: 脆弱性スキャン完了、重大な脆弱性なし

---

## 出力テンプレート

### ファイル配置

タスク実行仕様書は `docs/30-workflows/{機能名}/task-step{N}-{機能名}.md` の形式で配置する。詳細は「成果物配置」セクションの表を参照。

### テンプレート構造

タスク実行仕様書は以下の構造を持つ：

1. **ユーザーからの元の指示** - 元の指示文をそのまま記載
2. **タスク概要** - 目的、背景、最終ゴール、成果物一覧
3. **参照ファイル** - コマンド・エージェント・スキル選定の参照先
4. **タスク分解サマリー** - 全サブタスクの一覧表
5. **実行フロー図** - Mermaidによるフロー可視化
6. **各フェーズの詳細** - Phase 0〜5の各サブタスク詳細
7. **品質ゲートチェックリスト** - 完了条件のチェック項目
8. **リスクと対策** - リスク分析と対応方針
9. **前提条件** - タスク実行の前提
10. **備考** - 技術的制約、参考資料

---

## 実行時のコマンド・エージェント・スキル

### 本ドキュメント作成に使用するコマンド

| コマンド       | 用途                                                            |
| -------------- | --------------------------------------------------------------- |
| `/sc:workflow` | PRDと機能要件から構造化された実装ワークフローを生成             |
| `/sc:document` | コンポーネント、関数、API、機能の重点的文書生成                 |
| `/sc:design`   | システムアーキテクチャ、API、コンポーネントインターフェース設計 |

### 本ドキュメント作成に使用するエージェント

| エージェント           | 用途                                                   |
| ---------------------- | ------------------------------------------------------ |
| `technical-writer`     | 使いやすさとアクセシビリティに重点を置いた技術文書作成 |
| `requirements-analyst` | 曖昧なプロジェクトアイデアを具体的な仕様に変換         |
| `system-architect`     | スケーラブルシステムアーキテクチャ設計                 |

### 本ドキュメント作成に使用するスキル

タスク実行仕様書の生成には、プロジェクト固有のスキル定義（`.claude/skills/skill_list.md`）を参照する。

---

## 昇格パターン集

## Current Active / Spec Created Tasks

| タスク | 状態 | 仕様書 root | Phase 12 状態 |
| --- | --- | --- | --- |
| issue-554-audit-correlation-branch-protection-required-check | spec_created / implementation / NON_VISUAL / IMPLEMENTED_LOCAL_RUNTIME_PENDING / Phase 13 blocked_until_user_approval | `docs/30-workflows/issue-554-audit-correlation-branch-protection-required-check/` | Issue #516 の `.github/workflows/audit-correlation-verify.yml` `verify` job を branch protection required context `audit-correlation-verify / verify` として `dev` / `main` に登録する user-gated governance workflow。Phase 11 10 screenshots, Phase 12 strict 7 outputs と aiworkflow branch-protection SSOT は同期済み。`gh api -X PUT`、fresh before/after JSON、commit、push、PR は user approval 後のみ。Issue #554 は CLOSED 維持で `Refs #554`。 |
| issue-196-03b-followup-003-response-email-unique-ddl | implemented-local-static-evidence-pass / implementation / NON_VISUAL / Phase 1-12 strict outputs present / Phase 13 blocked_until_user_approval | `docs/30-workflows/issue-196-03b-followup-003-response-email-unique-ddl/` | `response_email` の正本 UNIQUE は `member_identities.response_email`、`member_responses.response_email` は履歴行で UNIQUE 不在。03b 検出表 #4 の誤記は履歴改ざんせず本 workflow Phase 12 で訂正記録。既適用 migration への差分はコメントのみで SQL semantics 0 行差分を確認済み。production D1 migration list は Phase 13 承認時に取得し、取得不可の場合の縮退境界も定義済み。Issue #196 は CLOSED 維持で `Refs #196` のみ。 |
| UT-CICD-DRIFT-IMPL-OBSERVABILITY-MATRIX-SYNC | spec_created / docs-only / NON_VISUAL / Phase 1-12 outputs present / Phase 13 pending_user_approval | `docs/30-workflows/completed-tasks/ut-cicd-drift-impl-observability-matrix-sync/` | 05a `observability-matrix.md` を対象 5 workflow（`ci.yml` / `backend-ci.yml` / `validate-build.yml` / `verify-indexes.yml` / `web-cd.yml`）へ同期。mapping は workflow file / display name / trigger / job id / required status context を分離し、required context は confirmed 値（`ci` / `Validate Build` / `verify-indexes-up-to-date`）を正とする。原典 unassigned は `transferred_to_workflow`。 |
| 03a-stablekey-literal-lint-enforcement | enforced_dry_run / warning mode / NON_VISUAL / Phase 1-12 completed / Phase 13 pending_user_approval | `docs/30-workflows/03a-stablekey-literal-lint-enforcement/` | 03a AC-7 stableKey literal 直書き禁止の静的検査を standalone Node script として実装。warning mode は `pnpm lint` chain に統合済み、strict mode は 147 legacy violations で fail するため fully enforced 未達。元 unassigned `completed-tasks/task-03a-stablekey-literal-lint-001.md` は consumed。follow-up は legacy cleanup と strict CI gate の 2 件。 |
| issue-393-stablekey-literal-legacy-cleanup | strict_ready / implementation / NON_VISUAL / Phase 1-12 completed / Phase 13 pending_user_approval | docs/30-workflows/issue-393-stablekey-literal-legacy-cleanup/ | 親 03a の strict CI gate 昇格 blocker だった legacy stableKey literal 148 件 / 14 ファイル（family A=sync job, B=repository, C=admin route, D=use-case/view-model, E=web profile, F=web public, G=consent util）を `packages/shared/src/zod/field.ts` 新規 `STABLE_KEY` const への named import に置換し、`lint-stablekey-literal.mjs --strict` を 0 violation 化。`STABLE_KEY` は branded type `StableKey` と name collision 回避のため SCREAMING_SNAKE_CASE + `as const satisfies` で型保証。test 側 `scripts/lint-stablekey-literal.test.ts` に issue-393 0-violation 期待値テストを additive。残 follow-up は `task-03a-stablekey-strict-ci-gate-001.md` のみ（legacy cleanup follow-up は consumed）。 |
| issue-191-schema-aliases-ddl-and-07b-alias-resolution-wiring | spec_created / docs-only / NON_VISUAL | `docs/30-workflows/completed-tasks/issue-191-schema-aliases-ddl-and-07b-alias-resolution-wiring/` | CLOSED issue #191 の補完仕様として、`schema_aliases` D1 table、07b `POST /admin/schema/aliases` の write target replacement、03a alias-first lookup + temporary `schema_questions.stable_key` fallback を正本化。実装本体 / fallback retirement / direct update guard は `docs/30-workflows/unassigned-task/task-issue-191-*.md` 3 件へ分離 |
| issue-300-direct-stable-key-update-guard | implemented_local_runtime_pending / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING | `docs/30-workflows/issue-300-direct-stable-key-update-guard/` | Issue #300。direct `schema_questions.stable_key` mutation を `scripts/lint-stable-key-update.mjs`、focused spec 12/12、fixture set、root lint chain、pre-commit、`.github/workflows/verify-stable-key-update.yml` で拒否。`apps/api/src/repository/schemaQuestions.ts` の unused `updateStableKey()` を削除し、`database-implementation-core.md` Schema Alias Resolution Contract に Static guard を同期。GitHub Actions runtime green / commit / push / PR は Phase 13 user-gated。 |
| task-issue-191-production-d1-schema-aliases-apply-001 | completed_via_already_applied_path / implementation / NON_VISUAL / production-operation / Phase 13 runtime evidence captured | `docs/30-workflows/completed-tasks/task-issue-191-production-d1-schema-aliases-apply-001/` | Issue #359 の closed 状態を維持しつつ、production D1 `ubm-hyogo-db-prod` を検証。2026-05-02 の Phase 13 で明示承認後、preflight が `schema_aliases` 既存 + `d1_migrations` 上の `0008_create_schema_aliases.sql` applied (`2026-05-01 10:59:35 UTC`) を確認したため、二重 apply は実行せず shape verification path で完了。PRAGMA evidence と `database-schema.md` production applied marker を同期済み。code deploy / hardening migration / fallback retirement / direct update guard は scope 外。 |
| issue-355-opennext-workers-cd-cutover-task-spec | spec_created / implementation / NON_VISUAL / Phase 1-12 outputs present / Phase 13 blocked_pending_user_approval | `docs/30-workflows/completed-tasks/issue-355-opennext-workers-cd-cutover-task-spec/` | CLOSED Issue #355 の cutover 実装仕様root。repo-side `.github/workflows/web-cd.yml` の Pages deploy 撤去 / Workers deploy 置換は Issue #331 で consumed。残る Cloudflare side cutover、staging smoke、rollback readiness を `docs/30-workflows/unassigned-task/task-impl-opennext-workers-migration-001.md` / Issue #419 user-gated work へ接続する。Phase 11は実測PASSではなく5つのNON_VISUAL evidence contractとして保存し、実 deploy / commit / PR はuser承認まで禁止。 |
| issue-331-cicd-runtime-warning-cleanup | implemented-local / implementation / NON_VISUAL / local-static PASS / runtime evidence pending_user_approval / Phase 13 blocked_until_user_approval | `docs/30-workflows/issue-331-cicd-runtime-warning-cleanup/` | CLOSED Issue #331 の残存 warning cleanup。`apps/api/wrangler.toml` top-level `[vars]` を削除し、`.github/workflows/web-cd.yml` を Pages deploy から OpenNext Workers build + `scripts/cf.sh deploy --config apps/web/wrangler.toml --env <staging\|production>` へ切替。`workflow_dispatch` 追加済み。`task-impl-opennext-workers-migration-001` の web-cd repo cutover 部分と `U-FIX-CF-ACCT-02` を consumed/superseded。AC-2/5/6 の runtime warning-zero / Actions green evidence、Cloudflare Pages retirement、secret mutation、commit/push/PR は user approval 後。PR 文脈は `Refs #331`。 |
| issue-640-oidc-cf-token-cutover | implemented-local-runtime-pending / implementation / NON_VISUAL / local-static PASS / Phase 12 strict outputs present / Phase 13 blocked_pending_user_approval | `docs/30-workflows/issue-640-oidc-cf-token-cutover/` | Issue #640 の OIDC / step-scoped Cloudflare token cutover。`web-cd.yml` の `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` を job-level env から deploy step scope へ降格し、redaction step は Account ID variable のみを受け取る。`post-release-dashboard.yml` の analytics token も verify/collect step scope へ降格。`backend-ci.yml` は wrangler-action `with.apiToken` step scope を維持。`scripts/redaction-check.sh` と shell tests を追加し `pnpm test:workflow-secrets` / `ci.yml` に接続。Source unassigned `issue-331-followup-003-oidc-step-scoped-cf-token-cutover.md` は consumed。Full OIDC migration / legacy token revocation / runtime deploy evidence / commit / push / PR は user-gated follow-up。 |
| issue-718-legacy-cf-token-revocation | implemented-local-runtime-pending / implementation / NON_VISUAL / security-hardening / Phase 12 strict outputs present / Gate C pending_user_approval | `docs/30-workflows/issue-718-legacy-cf-token-revocation/` | Issue #718 の legacy Cloudflare API token revocation workflow。backend-ci は existing canonical `CF_TOKEN_D1_*` / `CF_TOKEN_WORKERS_*` へ切替済みで、`scripts/__tests__/workflow-env-scope.test.sh` が exact `with.apiToken` gate を持つ。web-cd は current runtime 名 `CLOUDFLARE_API_TOKEN` を維持し、legacy value ではないことを operator-only evidence で確認する。`CLOUDFLARE_API_TOKEN_DEPLOY_*` は導入しない。4 scoped secret inventory、Cloudflare revoke、GitHub Secrets mutation、1Password mutation、commit、push、PR は explicit user approval marker 後のみ。 |
| issue-717-oidc-cf-full-migration | verified_current_no_code_change_pending_pr / implementation / NON_VISUAL / conditional / Phase 12 strict outputs present / Phase 13 blocked_pending_user_approval | `docs/30-workflows/issue-717-oidc-cf-full-migration/` | Issue #717 の Cloudflare Workers GitHub Actions OIDC full migration support revalidation。2026-05-16 時点の Cloudflare Workers GitHub Actions docs と `cloudflare/wrangler-action` README は API token authentication (`apiToken: secrets.CLOUDFLARE_API_TOKEN`) を案内しており、supported OIDC deploy exchange path は確認できない。`.github/workflows/web-cd.yml` へ `id-token: write` や仮 exchange step は追加せず、Issue #640 step-scoped `CLOUDFLARE_API_TOKEN` boundary を current contract として維持。Production OIDC cutover / apps-api D1 token cutover / 1Password restructure は `docs/30-workflows/unassigned-task/issue-717-followup-*.md` に formalized。commit / push / PR は user-gated。 |
| issue-355-opennext-workers-cd-cutover-task-spec | spec_created / implementation / NON_VISUAL / Phase 1-12 outputs present / Phase 13 blocked_pending_user_approval | `docs/30-workflows/completed-tasks/issue-355-opennext-workers-cd-cutover-task-spec/` | CLOSED Issue #355 の cutover 実装仕様root。`.github/workflows/web-cd.yml` の旧 Pages deploy 経路と Workers deploy 置換は 2026-05-09 CI recovery wave で local 実装済み。残る Cloudflare side cutover、staging smoke、rollback readiness を `docs/30-workflows/unassigned-task/task-impl-opennext-workers-migration-001.md` の残スコープへ接続する。Phase 11は実測PASSではなく5つのNON_VISUAL evidence contractとして保存し、実 deploy / commit / PR はuser承認まで禁止。 |
| issue-419-pages-project-dormant-delete-after-355 | spec_created / implementation / NON_VISUAL / destructive-operation / Phase 11 runtime evidence pending / Phase 12 strict outputs present / Phase 13 blocked_pending_user_approval | `docs/30-workflows/issue-419-pages-project-dormant-delete-after-355/` | Issue #419 (`Refs #355`) の Pages dormant 物理削除 runtime contract。Workers cutover 完了、Pages custom domain detach、最低 2 週間 dormant 観察、user 明示承認、`bash scripts/cf.sh pages project delete <PROJECT_NAME> --yes`、post-deletion smoke、redaction grep、aiworkflow Pages 言及 cleanup を AC-1〜AC-6 として固定。削除実行・Cloudflare CLI・commit・push・PR は本 spec_created cycle では未実行。起票元 unassigned は `docs/30-workflows/unassigned-task/task-issue-355-pages-project-delete-after-dormant-001.md`。 |
| issue-639-cloudflare-pages-project-physical-deletion | spec_created / implementation / NON_VISUAL / destructive-external-mutation / Phase 12 strict outputs present / Gate C blocked_until_2026-06-08_and_user_approval | `docs/30-workflows/issue-639-cloudflare-pages-project-physical-deletion/` | Current tracking workflow for Cloudflare Pages project physical deletion after Issue #331 Workers cutover and Issue #638 variable deletion. Uses `bash scripts/cf.sh pages project delete <PROJECT_NAME> --yes` as canonical destructive command, records read-only and mutation evidence separately, and keeps Issue #639 PR context as `Refs #639` only. Source `docs/30-workflows/unassigned-task/issue-331-followup-002-cloudflare-pages-project-physical-deletion.md` is consumed. Issue #419 / task-issue-355 are historical predecessors, not current execution roots. |
| issue-402-admin-request-retention-physical-delete | implemented-local / implementation / NON_VISUAL / retention-policy / Phase 12 strict outputs present / Phase 11 runtime evidence pending / Phase 13 blocked_pending_user_approval | `docs/30-workflows/issue-402-admin-request-retention-physical-delete/` | CLOSED Issue #402 の delete request 承認後 retention purge 実装。admin approve 直後は既存どおり `member_status.is_deleted=1` + `deleted_members` tombstone の論理削除に留め、`deleted_members.deleted_at` から 180 日経過後に `member_responses` / `member_identities` / `member_status` と response child rows を purge する。`deleted_members` は audit minimum (`member_id`, `deleted_by`, `deleted_at`, `reason`, `purged_at`, `retention_policy_version`) として残す。cron は既存 daily `0 18 * * *` branch を再利用し本数追加なし。production apply は `RETENTION_PURGE_MODE=apply` の明示 user gate、default は `dry-run`。SSOT: `references/data-retention-policy.md`。runtime evidence / production enable / commit / push / PR は user gate。 |
| issue-385-web-build-global-error-prerender-fix | implemented-local / implementation / NON_VISUAL / Plan A applied / Phase 11 PASS / Phase 13 blocked_pending_user_approval | `docs/30-workflows/completed-tasks/issue-385-web-build-global-error-prerender-fix/` | CLOSED Issue #385 の apps/web build blocker 対応。Next.js 16.2.4 + React 19.2.5 で `/_global-error` / `/_not-found` prerender が `useContext` null で fail する経路を、`next-auth` 静的 import 隔離と `.mise.toml` 由来 `NODE_ENV=development` の build script 上書き不足の複合問題として解消した。`apps/web/src/lib/auth.ts` の `getAuth()` lazy factory、`oauth-client.ts` dynamic import、auth/admin/me route handler と `session.ts` の lazy 取得、`apps/web/package.json` の `NODE_ENV=production` build scripts を同期。`global-error.tsx` RSC 化 / Next patch upgrade / React downgrade / `serverExternalPackages` / pnpm patch は不採用。Phase 11 は typecheck / lint / tests / build / build:cloudflare / worker.js / lazy-import-check PASS。下流 P11-PRD-003 / P11-PRD-004 / wrangler API URL / 09a / 09c は本 build 緑化後に再開。deploy・commit・push・PR・Issue reopen は user approval 後。 |
| ut-cicd-drift-impl-pages-vs-workers-decision | spec_created / docs-only / NON_VISUAL / Phase 13 pending_user_approval | `docs/30-workflows/completed-tasks/ut-cicd-drift-impl-pages-vs-workers-decision/` | ADR-0001 Pages vs Workers deploy target decision を Accepted / Workers cutover として確定。`apps/web/wrangler.toml` は OpenNext Workers 形式。旧 current fact の `.github/workflows/web-cd.yml` Pages deploy 残は Issue #331 で repo-side cutover 済み。 |
| ut-cicd-drift-impl-pages-vs-workers-decision | spec_created / docs-only / NON_VISUAL / Phase 13 pending_user_approval | `docs/30-workflows/completed-tasks/ut-cicd-drift-impl-pages-vs-workers-decision/` | ADR-0001 Pages vs Workers deploy target decision を Accepted / Workers cutover として確定。`apps/web/wrangler.toml` は OpenNext Workers 形式、`.github/workflows/web-cd.yml` の旧 Pages deploy 経路は 2026-05-09 CI recovery wave で local 解消済み。残る Cloudflare side cutover / runtime smoke evidence は `docs/30-workflows/unassigned-task/task-impl-opennext-workers-migration-001.md` の残スコープ。 |
| task-claude-code-permissions-deny-bypass-verification-001 | spec_created / docs-only / NON_VISUAL | `docs/30-workflows/completed-tasks/task-claude-code-permissions-deny-bypass-verification-001/` | Claude Code `permissions.deny` と `--dangerously-skip-permissions` の優先関係を公式 docs 調査 + isolated 実機検証 runbook として仕様化。実検証は `task-claude-code-permissions-deny-bypass-execution-001` へ分離 |
| utgov001-second-stage-reapply | spec_created / implementation / NON_VISUAL / Phase 13 approval gate（三役: user 承認 + 実 PUT 実行 + PR作成承認待ち）/ `user_approval_required=true` | `docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/` | UT-GOV-001 `contexts=[]` fallback を UT-GOV-004 confirmed contexts で後追い再 PUT する仕様。Phase 13 で **自走禁止 3 項目**（(1) `gh api -X PUT .../branches/{dev,main}/protection` 実 PUT / (2) `git commit` + `git push` / (3) `gh pr create`）を user 明示承認後にのみ実行。Issue #202 は **CLOSED のまま** で `Refs #202` のみ採用（`Closes #202` 禁止 / 再オープン禁止）。dev / main 独立 PUT（直列実行）/ rollback payload は UT-GOV-001 のものを再利用・上書き禁止 / admin token は `op://Employee/ubm-hyogo-env/GITHUB_ADMIN_TOKEN` 経由で揮発取得。applied GET evidence 後に `task-utgov001-references-reflect-001` へ引き渡す |
| task-utgov001-references-reflect-001 | docs-only / NON_VISUAL / Phase 1-12 executed / Phase 13 approval gate（commit・push・PR blocked） | `docs/30-workflows/completed-tasks/task-utgov001-references-reflect-001/` | Issue #303 reflect task。fresh GitHub GET evidence を `outputs/phase-13/branch-protection-applied-{dev,main}.json` に保存し、aiworkflow-requirements の branch protection current applied へ同期。current applied contexts は dev/main とも `ci`, `Validate Build`、strict は dev=false / main=true。`verify-indexes-up-to-date` は expected-context drift として扱い、current applied に混入しない。Issue #303 は closed のまま `Refs #303`。 |
| issue-475-branch-protection-coverage-gate | runtime_evidence_captured_gate_b_pending / implementation / NON_VISUAL / settings-only / Gate A consumed / Gate B git publish pending | `docs/30-workflows/issue-475-branch-protection-coverage-gate/` | Issue #475 coverage-gate required context fresh GET evidence。`coverage-gate` は `main` / `dev` の `required_status_checks.contexts` に登録済みで、current applied は `deployment-branch-strategy.md` v1.4.2 に同期済。Issue #475 起因の non-target drift なし（dev `required_pull_request_reviews=null` は out-of-scope / solo policy 方向）。Phase 11 fresh GET / drift / contexts-preserved / SSOT diff evidence 取得済。commit / push / PR と throwaway PR `mergeStateStatus=BLOCKED` 経験的観測は Gate B 後。source unassigned-task は `transferred_to_workflow`。 |
| task-worktree-environment-isolation | spec_created / docs-only / NON_VISUAL | `docs/30-workflows/task-worktree-environment-isolation/` | worktree / tmux / shell state 分離仕様を development-guidelines と lessons-learned に同期済み。コード実装は未タスクへ分離 |
| TASK-SKILL-CODEX-VALIDATION-001 | completed / Phase 1-12 完了 / Phase 13 user_approval_required / NON_VISUAL | `docs/30-workflows/completed-tasks/skill-md-codex-validation-fix/` | Codex SKILL.md frontmatter 検証契約 R-01〜R-07 を validator + 二段ガード + CLI 経路三段目で実装。AC-1〜AC-8 8/8 PASS。current facts: (1) `description ≤1024 字 / string scalar / YAML 構文有効`、(2) 二段ガード（generate / write）+ `quick_validate` 三段目、(3) フィクスチャ 30 件 `*.fixture` 化で skill discovery 圏外化、(4) 退避先 Markdown 統一（`references/{topic}.md`）、(5) Anchors ≤5 / Trigger keywords ≤15 自動退避、(6) `.claude/` ↔ `.agents/` 同 wave sync、(7) codex_validation.test.js 24 ケース GREEN、(8) follow-up 3 件を unassigned-task-detection.md に分離 |
| ut-02a-section-field-canonical-schema-resolution | verified / implementation / NON_VISUAL / Phase 1-12 completed / Phase 13 pending_user_approval | `docs/30-workflows/ut-02a-section-field-canonical-schema-resolution/` | Issue #108。`apps/api/src/repository/_shared/builder.ts` の broad section assignment / stable_key label leakage / heuristic field kind fallback を `MetadataResolver` + generated static manifest baseline へ置換。`FieldKind` に `consent` / `system` を追加し、public / member / admin 3 view は同一 resolver から section/key/kind/label を導出。Phase 11 は builder unit test / drift detection log / three-view parity の NON_VISUAL evidence。Phase 12 は aiworkflow-requirements indexes と legacy mapping を same-wave sync。manifest stale detection、diagnostics hardening、03a adapter contract test、retirement 条件 formalization は `docs/30-workflows/issue-373-ut02a-canonical-metadata-diagnostics-hardening/` に昇格済み。 |
| issue-373-ut02a-canonical-metadata-diagnostics-hardening | implemented-local / implementation / NON_VISUAL / Phase 11 evidence captured / Phase 12 completed / Phase 13 blocked_pending_user_approval | `docs/30-workflows/issue-373-ut02a-canonical-metadata-diagnostics-hardening/` | CLOSED Issue #373 / UT-02A-FU-DIAG-001。UT-02A static manifest baseline の stale detection、決定論的再生成、`UBM-MANIFEST-UNKNOWN-KEY` diagnostics、03a alias queue adapter contract test、static manifest retirement 条件正本反映を実装済みローカル current workflow root。元 `completed-tasks/task-ut02a-canonical-metadata-diagnostics-hardening-001.md` は `formalized_as_issue_373_workflow`。commit / push / PR は user approval 後のみ。Issue は CLOSED のため PR 文脈は `Refs #373` のみ。 |
| task-lefthook-multi-worktree-reinstall-runbook | spec_created / docs-only / runbook-spec / NON_VISUAL | `docs/30-workflows/completed-tasks/task-lefthook-multi-worktree-reinstall-runbook/` | 30+ worktree への lefthook 一括再 install runbook 仕様を確定。`doc/00-getting-started-manual/lefthook-operations.md` への差分追記内容を Step 2-1〜2-4 で specify。固有教訓は `lessons-learned-lefthook-mwr-runbook-2026-04.md`（L-MWR-001〜006）。スクリプト実装（`scripts/reinstall-lefthook-all-worktrees.sh`）は別 Wave に分離 |
| ut-06-followup-A-opennext-workers-migration | implemented / static_verified / NON_VISUAL | `docs/30-workflows/ut-06-followup-A-opennext-workers-migration/` | apps/web `wrangler.toml` を Pages 形式から OpenNext Workers 形式へ移行。AC-1〜AC-7 / AC-13〜AC-16 は静的検証済み。AC-8〜AC-12（build / staging deploy / smoke / bundle size / fallback 実測）はユーザー承認後に Phase 11 へ追記 |
| FIX-CF-ACCT-ID-VARS-001 | implemented / static_verified / NON_VISUAL / Phase 13 user_approval_required | `docs/30-workflows/completed-tasks/fix-cf-account-id-vars-reference/` | `.github/workflows/backend-ci.yml` 4 箇所と `.github/workflows/web-cd.yml` 2 箇所の `CLOUDFLARE_ACCOUNT_ID` 参照を `${{ vars.CLOUDFLARE_ACCOUNT_ID }}` に同期。Repository Variable 登録あり / Secret 不在を `gh api` で確認済み。actionlint / yamllint はローカル未導入のため deferred。関連未タスク `U-FIX-CF-ACCT-01` / `U-FIX-CF-ACCT-02` を formalize。 |
| U-FIX-CF-ACCT-01-DERIV-02 | spec_created / implementation / NON_VISUAL / superseded-by-issue-718-for-backend / runtime token issuance pending user operation | `docs/30-workflows/u-fix-cf-acct-01-deriv-02-scope-split-tokens/` | Issue #406 CLOSED. Historical split contract proposed D1 / Workers / Pages x staging / production. Current backend-ci state is owned by Issue #718 and uses 4 scoped `CF_TOKEN_D1_*` / `CF_TOKEN_WORKERS_*`; current web-cd keeps environment-scoped `CLOUDFLARE_API_TOKEN` and does not use Pages tokens. `scripts/cf.sh` pre-injected token path remains relevant. Cloudflare dashboard token issuance / GitHub Secrets mutation / 7 day staging green / 24h old-token retirement remain user operation pending. PR 文面は `Refs #406` のみ。 |
| UT-06-FU-A-PROD-ROUTE-SECRET-001 | completed / Phase 1-12 完了 / Phase 13 pending_user_approval / docs-only / NON_VISUAL | `docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/` | UT-06-FU-A OpenNext Workers production cutover 前の route / custom domain / secret key / observability target split-brain 防止 runbook。`outputs/phase-05/runbook.md` を workflow-local 正本とし、secret 値は記録せず key 名のみ、Cloudflare 操作は `bash scripts/cf.sh` 経由、production deploy / DNS 切替 / Worker 削除は別承認に分離。原典 unassigned は `docs/30-workflows/completed-tasks/UT-06-FU-A-production-route-secret-observability.md` に移動済み。route inventory は design workflow `docs/30-workflows/ut-06-fu-a-route-inventory-script-001-cloudflare-route-inventory/` と実装 follow-up `docs/30-workflows/unassigned-task/UT-06-FU-A-route-inventory-script-impl-001.md` に分離済み。Logpush target diff automation は `docs/30-workflows/ut-06-fu-a-logpush-target-diff-script-001/` で implementation_complete。Phase 11 evidence は NON_VISUAL infrastructure verification の format check 完了であり、production 実測 PASS は別承認 operation に分離。固有教訓 `references/lessons-learned-ut06-fu-a-prod-route-secret-2026-04.md`（L-UT06FUA-001〜007）、artifact inventory `references/workflow-ut-06-fu-a-prod-route-secret-001-artifact-inventory.md`。 |
| UT-06-FU-A-ROUTE-INVENTORY-SCRIPT-001 | spec_created / docs-only / NON_VISUAL / Phase 12 completed / Phase 13 blocked_pending_user_approval | `docs/30-workflows/ut-06-fu-a-route-inventory-script-001-cloudflare-route-inventory/` | production Worker route inventory script の設計 close-out。`InventoryReport` SSOT、GET allowlist（workers scripts / zone workers routes / workers domains）、secret leak guard、mutation grep、NON_VISUAL evidence を固定。元 unassigned `docs/30-workflows/unassigned-task/UT-06-FU-A-route-inventory-script-001.md` は consumed pointer。実装・実 command・親 runbook 追記・実測 evidence は `docs/30-workflows/unassigned-task/UT-06-FU-A-route-inventory-script-impl-001.md` に委譲。 |
| UT-06-FU-A-LOGPUSH-TARGET-DIFF-SCRIPT-001 | implementation_complete / Phase 1-12 completed / Phase 13 pending_user_approval / NON_VISUAL | `docs/30-workflows/ut-06-fu-a-logpush-target-diff-script-001/` | production observability target diff script。公開入口は `bash scripts/cf.sh observability-diff --current-worker ubm-hyogo-web-production --legacy-worker ubm-hyogo-web --config apps/web/wrangler.toml`、内部実装は `scripts/observability-target-diff.sh` / `scripts/lib/redaction.sh`。Workers Logs / Tail / Logpush / Analytics Engine の 4 軸を新旧 Worker で比較し、token / credential / sink URL query は redaction 済みで出力する。検証は `bash tests/unit/redaction.test.sh` 11 PASS、`bash tests/integration/observability-target-diff.test.sh` 18 PASS。起源 unassigned `docs/30-workflows/unassigned-task/UT-06-FU-A-logpush-target-diff-script-001.md` は transferred_to_workflow。 |
| 04c-parallel-admin-backoffice-api-endpoints | completed / Phase 1-12 完了 / Phase 13 pending / NON_VISUAL | `docs/30-workflows/04c-parallel-admin-backoffice-api-endpoints/` | UBM-Hyogo 管理者バックオフィス API（9 router / 16 endpoint）を `apps/api` に実装。dashboard / members（list/detail/status/notes/delete/restore）/ tags-queue（resolve）/ schema（diff/aliases）/ meetings（list/create/attendance）。05a close-out で人間向け `/admin/*` は Auth.js JWT + `admin_users.active` 判定の `requireAdmin` へ差し替え済み。同期系 `/admin/sync*` のみ `SYNC_ADMIN_TOKEN` Bearer を維持。不在 endpoint（`PATCH /admin/members/:memberId/profile` / `PATCH /admin/members/:memberId/tags`）は構造で保証。新規 repository: `apps/api/src/repository/dashboard.ts` / `apps/api/src/repository/memberTags.ts`（`assignTagsToMember`）。検証: typecheck エラー 0 / vitest 251 PASS。固有教訓 `lessons-learned-04c-admin-backoffice-2026-04.md`（L-04C-001〜005） |
| 04b-followup-001-admin-queue-request-status-metadata | completed / Phase 1-12 完了 / Phase 13 pending_user_approval / NON_VISUAL | `docs/30-workflows/04b-followup-001-admin-queue-request-status-metadata/` | `admin_member_notes` に `request_status` / `resolved_at` / `resolved_by_admin_id` と member_only index `idx_admin_notes_pending_requests` を追加。`adminNotes.hasPendingRequest` は `request_status='pending'` 限定、`markResolved` / `markRejected` は pending 条件付き UPDATE。`docs/00-getting-started-manual/specs/07-edit-delete.md` / `08-free-database.md` / `references/database-admin-repository-boundary.md` と同期済み。 |
| issue-106-admin-member-notes-repository-task-spec | implementation / NON_VISUAL / implemented_pending_user_approval / Phase 1-12 完了 / Phase 13 blocked_pending_user_approval | `docs/30-workflows/completed-tasks/issue-106-admin-member-notes-repository-task-spec/` | Closed issue #106 の再検証 workflow。現行正本は `apps/api/src/repository/adminNotes.ts` / `listByMemberId` で、`adminMemberNotes.ts` は重複新設しない。member_id filter、空配列、`created_at DESC`、admin note mutation の `audit_log` append、admin detail audit と `admin_member_notes` の非混同を regression tests で固定。 |
| 07b-parallel-schema-diff-alias-assignment-workflow | completed_without_pr / Phase 1-12 完了 / Phase 13 pending_user_approval / NON_VISUAL / superseded-by UT-07B hardening | `docs/30-workflows/completed-tasks/07b-parallel-schema-diff-alias-assignment-workflow/` | 初期 07b では `schema_diff_queue` の alias 候補提示・dryRun・apply workflow を `apps/api` に実装。UT-07B hardening 以降の current contract は `schema_aliases` INSERT、collision `409 stable_key_collision`、HTTP 202 retryable continuation。旧 `schema_questions.stable_key` direct update / collision 422 記述は historical baseline としてのみ扱う。 |
| UT-07B-schema-alias-hardening-001 | implemented-local / implementation / NON_VISUAL / Phase 1-12 completed / Phase 13 pending_user_approval | `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/` | issue-191 の `schema_aliases` write target replacement を上位前提に、07b alias apply を DB constraint / resumable back-fill / HTTP 202 retryable continuation で harden した追加実装タスク。10,000 行 staging evidence は Cloudflare staging credentials 前提のため Phase 11 deferred。Issue #293 は CLOSED 維持、PR では `Refs #293` のみ採用。 |
| 05b-parallel-magic-link-provider-and-auth-gate-state | completed_without_pr / Phase 1-12 完了 / Phase 13 pending / NON_VISUAL | `docs/30-workflows/05b-parallel-magic-link-provider-and-auth-gate-state/` | Magic Link 発行・検証と AuthGateState 判定 API を `apps/api` に実装。`GET /auth/gate-state`、`POST /auth/magic-link`、`POST /auth/magic-link/verify`、`POST /auth/resolve-session`、Resend mailer、email/IP rate limit、`magic_tokens.deleteByToken` rollback、apps/web 同 origin proxy 3 本、shared auth 補助 alias export（`SessionUserAuthGateState`）を追加。`/no-access` route 不在と apps/web D1 直参照不在は fs-check で保証。Phase 11 は `ui_routes: []` のため screenshot ではなく Hono direct fetch + Vitest + fs-check evidence。Auth.js Credentials Provider 本体と `/api/auth/callback/email` route は 05b-B で implemented-local 済み。正本仕様は `api-endpoints.md` / `environment-variables.md` / `lessons-learned-05b-magic-link-auth-gate-2026-04.md` に同期済み。 |
| 05b-B-magic-link-callback-credentials-provider | implemented-local / implementation / NON_VISUAL / Phase 1-12 completed / Phase 13 blocked_pending_user_approval | `docs/30-workflows/05b-B-magic-link-callback-credentials-provider/` | 05b 起票元 `task-05b-authjs-callback-route-credentials-provider-001.md` を Phase 1-13 workflow へ昇格し、Auth.js Credentials Provider `id="magic-link"`、`/api/auth/callback/email` GET route、`verify-magic-link.ts` helper、failure redirect mapping、focused tests を実装。apps/web D1 direct access 禁止は boundary check PASS。dev-server curl / Auth.js real Set-Cookie / staging smoke は 09a 系 runtime evidence に委譲。旧 `02-application-implementation/05b-B...` path は legacy register に記録。 |
| 02c-followup-002-fixtures-prod-build-exclusion | spec_created / implementation-spec / docs-only / NON_VISUAL / Phase 1-12 spec complete / Phase 13 blocked_pending_user_approval | `docs/30-workflows/02c-followup-002-fixtures-prod-build-exclusion/` | 02c Phase 12 unassigned-task #6 を Phase 1-13 workflow へ昇格。対象は `apps/api` の `__fixtures__` / `__tests__` を production build artifact から除外する build/test boundary、Vitest fixture compatibility、dependency-cruiser import guard。runtime implementation / tests / artifact grep は未実行で、Phase 11 reserved evidence path に分離。元 unassigned task path は legacy stub として canonical root へ誘導。 |
| 05a-parallel-authjs-google-oauth-provider-and-admin-gate | completed / Phase 1-12 完了 / Phase 13 pending（user approval 待ち） / VISUAL smoke deferred to 09a | `docs/30-workflows/completed-tasks/05a-parallel-authjs-google-oauth-provider-and-admin-gate/` | Auth.js v5 Google OAuth provider、`GET /auth/session-resolve`（`X-Internal-Auth` 必須 / D1 直接アクセス禁止の唯一経路）、共有 HS256 JWT session（`memberId` / `isAdmin` のみ最小化）、apps/web `/admin/*` middleware（UI gate）、apps/api `requireAdmin`（API gate）を実装。`packages/shared/src/auth.ts` に `AuthSessionUser` / `SessionJwtClaims` / `GateReason`（`unregistered` / `deleted` / `rules_declined` 05b と共有命名）/ JWT sign/verify / Auth.js encode/decode adapter を追加。人間向け admin API 9 router は `requireAdmin` に差し替え、sync 系は `requireSyncAdmin`（`SYNC_ADMIN_TOKEN` Bearer）を維持。D1 `sessions` テーブル不採用で無料枠 reads/day を温存。Phase 11 は OAuth credentials / staging 未接続のため screenshot smoke を 09a に委譲し、代替として JWT互換・session-resolve・admin route gate tests を PASS。固有教訓 `references/lessons-learned-05a-authjs-admin-gate-2026-04.md`（L-05A-001〜006）。Follow-up: unassigned-task-001（Phase 11 staging 実 OAuth screenshot）/ unassigned-task-002（Google OAuth verification 本番申請、MVP 卒業時）/ unassigned-task-003（admin 剥奪即時反映 B-01 用 KV revocation list 設計検討、D1 sessions 復活禁止） |
| 05b-A-auth-mail-env-contract-alignment | spec_created / docs-only / remaining-only / NON_VISUAL / Phase 13 pending_user_approval | `docs/30-workflows/05b-A-auth-mail-env-contract-alignment/` | Magic Link メール送信の env 名 drift を解消する仕様整流タスク。正本 env 名は `MAIL_PROVIDER_KEY`（Secret）/ `MAIL_FROM_ADDRESS`（Variable）/ `AUTH_URL`（Variable）。旧 `RESEND_API_KEY` / `RESEND_FROM_EMAIL` / `SITE_URL` は新規 provisioning しない stale manual-spec 名として撤回。Phase 11 は NON_VISUAL readiness templates のみ、実 staging smoke は 09a、production readiness は 09c、callback/provider 統合は 05b-B に委譲。 |
| ut-05a-followup-google-oauth-completion | implemented_local_runtime_pending / implementation / VISUAL | `docs/30-workflows/ut-05a-followup-google-oauth-completion/` | 05a follow-up 001（staging OAuth smoke evidence）と 002（Google OAuth verification）を統合。単一 OAuth client / redirect URI matrix / Cloudflare Secrets placement / consent screen / Stage A-B-C manual smoke を仕様化し、B-03 解除条件 a/b/c を `13-mvp-auth.md` と同期する。現時点は repo 外の Google Cloud Console / Cloudflare Secrets 操作未実行のため workflow root は `spec_created` を維持し、Phase 11 screenshots は placeholder のみ。実 evidence 取得後に Phase 12 system spec update を再適用する。 |
| u-04-serial-sheets-to-d1-sync-implementation | completed / Phase 1-12 完了 / Phase 13 pending（user approval 待ち） / NON_VISUAL | `docs/30-workflows/completed-tasks/u-04-serial-sheets-to-d1-sync-implementation/` | UT-01 の Sheets→D1 同期方式を `apps/api/src/sync/` に実装。`POST /admin/sync/run`、`POST /admin/sync/backfill`、`GET /admin/sync/audit`、Cloudflare Cron `0 * * * *` の `runScheduledSync(env)` を追加。`requireSyncAdmin` / `SYNC_ADMIN_TOKEN` Bearer、`withSyncMutex`、`sync_job_logs` audit ledger、`sync_locks` mutex、Workers 互換 fetch + `crypto.subtle` Sheets client を採用。Phase 11 は UI 変更なしのため NON_VISUAL、代替 evidence を `outputs/phase-11/evidence/non-visual-evidence.md` に配置。staging smoke は 05b、cron monitoring / 30 分超 running alert は 09b へ relay。 |
| U-UT01-08 sync enum canonicalization | spec_created / docs-only / NON_VISUAL / Phase 13 pending_user_approval | `docs/30-workflows/u-ut01-08-sync-enum-canonicalization/` | UT-01 論理設計と既存 `sync_job_logs` / `sync_locks` 実装の enum drift を契約化。canonical `status` は `pending` / `in_progress` / `completed` / `failed` / `skipped`、canonical `trigger_type` は `manual` / `cron` / `backfill`。既存 `running -> in_progress`、`success -> completed`、`admin -> manual + triggered_by='admin'` を migration 変換案として固定。コード変更なし。実 migration / sync literal rewrite / shared type+Zod は UT-04 / UT-09 / U-UT01-10 に委譲。 |
| U-UT01-07-FU01 UT-09 canonical sync job receiver | completed / docs-only / NON_VISUAL / Phase 1-12 完了 / Phase 13 pending_user_approval | `docs/30-workflows/completed-tasks/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/` | 親 U-UT01-07 Phase 2 の canonical 名 `sync_job_logs` / `sync_locks` と `sync_log` 物理化禁止を UT-09 実装受け皿へ引き渡す receiver 仕様。受け皿 path は既存 `docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md`。本タスクはコード・migration・script・hook・CI gate を作らず、UT-09 / governance guard へ委譲する。 |
| UT-04 D1 データスキーマ設計 | spec_created / docsOnly=true / NON_VISUAL / Phase 13 blocked | `docs/30-workflows/ut-04-d1-schema-design/` | Cloudflare D1 初期 schema の current canonical set を `member_responses` / `member_identities` / `member_status` / `response_fields` / `schema_diff_queue` / `sync_jobs` に確定。旧 `members` は legacy、既存 `sync_job_logs` / `sync_locks` は UT-09 owned transition tables として扱う。`references/database-schema.md` / `references/database-schema-ddl-template.md` / `references/database-indexes.md` に DDL 反映テンプレとインデックス責務分離を同期済み。実 migration 投入、seed data、shared Zod codegen、sync ledger transition は未タスクとして分離。workflow root は `spec_created` を維持し、実 DDL merge まで `implemented` に昇格しない。 |
| UT-01 Sheets→D1 同期方式定義 | spec_created / docs-only / NON_VISUAL / design_specification | `docs/30-workflows/completed-tasks/ut-01-sheets-d1-sync-design/` | Cron pull 採択、手動 / 定期 / バックフィル 3 フロー、`sync_log` 論理設計、Sheets 優先 SoT を確定。既存 `apps/api` 実装との差分（`sync_job_logs` / `sync_locks`、enum、retry、offset、shared 契約）は U-7〜U-10 として未タスク化。Phase 13 はユーザー承認待ち |
| U-UT01-09 retry 回数と offset resume 方針の統一 | spec_created / docs-only / NON_VISUAL / Phase 1-12 completed / Phase 13 pending_user_approval | `docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/` | UT-01 U-9 の canonical 設計判断記録。legacy Sheets→D1 sync の retry max=3、backoff base 1s / factor 2 / cap 32s / jitter ±20%、`processed_offset` = chunk index（chunk 100）を採択。実コード反映（`DEFAULT_MAX_RETRIES=3`、withRetry cap/jitter、migration、resume）は UT-09、物理 ledger mapping は U-UT01-07 へ委譲。現行 Forms sync / `sync_jobs.metrics_json.cursor` 契約は上書きしない。 |
| 03b-followup-005-sync-jobs-design-spec | verified / implementation / NON_VISUAL / implementation_complete_pending_pr / Phase 13 pending_user_approval | `docs/30-workflows/03b-followup-005-sync-jobs-design-spec/` | 03b follow-up #5 を full workflow 化。`sync_jobs` の `job_type` enum、`metrics_json` schema、lock TTL 10分を `docs/30-workflows/_design/sync-jobs-spec.md` と `apps/api/src/jobs/_shared/sync-jobs-schema.ts` へ集約し、`sync-forms-responses.ts` / `cursor-store.ts` / `repository/syncJobs.ts` は TS ランタイム正本参照へ差し替えた。D1 DDL・migration 変更は含めない。NON_VISUAL evidence は targeted Vitest 23 tests / cross-reference / job_type coverage / indexes drift。 |
| 06b-parallel-member-login-and-profile-pages | completed / Phase 1-12 完了 / Phase 13 pending（user approval 待ち） / VISUAL member_only captured | `docs/30-workflows/completed-tasks/06b-parallel-member-login-and-profile-pages/` | apps/web 会員向け `/login` と `/profile` を実装。`/login` は AuthGateState 5 状態（input / sent / unregistered / rules_declined / deleted）、Magic Link form、Google OAuth button、`/no-access` 不採用、sent email 非表示、`normalizeRedirectPath` による safe redirect を提供。`/profile` は 04b `/me` `/me/profile` を `fetchAuthed` で取得し、read-only `StatusSummary` / `ProfileFields` / 外部 Google Form `EditCta` / `AttendanceList` を表示。`apps/web/middleware.ts` は `/profile/:path*` 未ログインを `/login?redirect=...` へ誘導。検証: `@ubm-hyogo/web typecheck` PASS、06b focused Vitest 23 PASS、Phase 11 local `/login` screenshot M-01〜M-05 + `/profile` redirect curl captured。Follow-up: `UT-06B-PROFILE-VISUAL-EVIDENCE`（logged-in profile / staging screenshot）, `UT-06B-MAGIC-LINK-RETRY-AFTER`（429 Retry-After UI 復元） |
| 06b-B-profile-self-service-request-ui | implemented-local / implementation / runtime-evidence-blocked / VISUAL_ON_EXECUTION / Phase 1-10・12 completed / Phase 11 blocked_runtime_evidence / Phase 13 pending_user_approval | `docs/30-workflows/completed-tasks/06b-B-profile-self-service-request-ui/` | `/profile` に本人の公開停止/再公開申請 UI と退会申請 UIを追加済み。04b `/me/visibility-request` / `/me/delete-request` と 06b profile page を上流にし、client は同一 origin `/api/me/visibility-request` / `/api/me/delete-request` proxy 経由で API Worker を叩く。実装 component は `RequestActionPanel`、`VisibilityRequestDialog`、`DeleteRequestDialog`、`RequestPendingBanner`、`RequestErrorMessage`、client helper は `apps/web/src/lib/api/me-requests.ts`。本文編集 UI は追加せず、409 duplicate pending request、success/error/pending statesを固定。Phase 11 logged-in screenshot / unskipped E2E は runtime capture pending で、06b-C / 08b / 09a が visual evidence として消費する。pending banner sticky 化は `docs/30-workflows/unassigned-task/task-06b-b-profile-request-pending-banner-sticky-001.md` に分離。 |
| 06b-b-profile-request-pending-banner-sticky | implemented-local / implementation / VISUAL_ON_EXECUTION / Phase 1-10・12 completed / Phase 11 blocked_runtime_evidence / Phase 13 pending_user_approval | `docs/30-workflows/06b-b-profile-request-pending-banner-sticky/` | 06b-B から分離された pending banner sticky 化 follow-up を local 実装済み。`/profile` reload 後も server-side pending state から `RequestPendingBanner` を表示し、重複申請ボタンを disabled にする。`GET /me/profile.pendingRequests`、`admin_member_notes.request_status='pending'` + `note_type IN ('visibility_request','delete_request')` 読み取り、`apps/web/src/lib/api/me-types.ts` mirror、`RequestActionPanel` props 追加を実装済み。409 は既存 `DUPLICATE_PENDING_REQUEST` を再利用し、新 endpoint / memberId path / apps/web D1 direct access は追加しない。authenticated runtime screenshot / trace は未取得で 06b-C / 08b / 09a capture gate に接続。旧 unassigned task は formalized source として保持。 |
| 06b-A-me-api-authjs-session-resolver | implemented-local / implementation / NON_VISUAL / Phase 1-12 completed / Phase 13 pending_user_approval | `docs/30-workflows/06b-A-me-api-authjs-session-resolver/` | `/profile` SSR が cookie forwarding で呼ぶ `/me` / `/me/profile` を、apps/api 側で Auth.js session cookie/JWT から解決する follow-up 実装。`apps/api/src/middleware/me-session-resolver.ts` が `authjs.session-token` / `__Secure-authjs.session-token` / next-auth v4 migration cookie / Authorization Bearer JWT を `AUTH_SECRET` で検証し、dev-only `x-ubm-dev-session` は `ENVIRONMENT === "development"` 限定で fail-closed。`apps/api/src/index.ts` の `/me` mount を inline dev-only resolver から `createMeSessionResolver()` に差し替え。Focused tests: `apps/api/src/middleware/me-session-resolver.test.ts` 12 cases（dev path / production rejection / env missing rejection / cookie names / wrong secret / expired / missing / malformed）。staging / production live smoke と deploy は 09a / 09c gate。旧 root `docs/30-workflows/02-application-implementation/06b-A-me-api-authjs-session-resolver/` は legacy mapping に登録。 |
| UT-05A fetchPublic service-binding | implemented-local / implementation / VISUAL_ON_EXECUTION / runtime evidence pending_user_approval / Phase 13 pending_user_approval | `docs/30-workflows/ut-05a-fetchpublic-service-binding-001/` | Issue #387 CLOSED 維持のまま formalize。`apps/web/src/lib/fetch/public.ts` は `env.API_SERVICE.fetch(...)` 優先 + `PUBLIC_API_BASE_URL` local fallback、`apps/web/wrangler.toml` は staging `ubm-hyogo-api-staging` / production `ubm-hyogo-api` の `API_SERVICE` binding を正本とする。Phase 11 は deploy / curl / tail / local fallback の runtime evidence contract で、実 staging / production deploy・commit・push・PR は user 明示指示後のみ。root / outputs `artifacts.json` parity と Phase 12 strict 7 files を配置済み。 |
| 08b-parallel-playwright-e2e-and-ui-acceptance-smoke | spec_created / scaffolding-only / VISUAL_DEFERRED / Phase 1-12 completed / Phase 13 pending_user_approval | `docs/30-workflows/08b-parallel-playwright-e2e-and-ui-acceptance-smoke/` | apps/web Playwright scaffold を追加。`apps/web/playwright.config.ts`、page objects、7 skipped spec、auth/D1 fixture placeholder、manual-only `.github/workflows/e2e-tests.yml`、Phase 11 evidence inventory を作成。実 screenshot / real axe / real Playwright report は未取得で、CI gate 化も未実施。full execution は `docs/30-workflows/unassigned-task/task-08b-playwright-e2e-full-execution-001.md` または 09a staging smoke へ委譲。 |
| 08b-A-playwright-e2e-full-execution | spec_created / implementation-spec / VISUAL_ON_EXECUTION / Phase 1-10 and 12 completed / Phase 11 contract_ready_runtime_pending / Phase 13 pending_user_approval / runtime evidence pending | `docs/30-workflows/completed-tasks/08b-A-playwright-e2e-full-execution/` | 08b scaffold の full-execution 契約。Phase 11 evidence manifest に Playwright HTML/JSON report、real axe report、30+ desktop/mobile screenshot、admin UI gate、direct `/api/admin/*` 403、foreign content edit 403、secret hygiene、skip inventory の保存先を固定。Phase 12 strict 7 files と root/outputs artifacts parity は配置済み。実 Playwright 実行、CI gate promotion、commit / push / PR は user approval 後のみ。 |
| 08a-B-public-search-filter-coverage | implemented-local / implementation-spec / VISUAL_ON_EXECUTION / Phase 12 strict 7 files present / Phase 11 runtime evidence pending / Phase 13 pending_user_approval | `docs/30-workflows/completed-tasks/08a-B-public-search-filter-coverage/` | `/members` public search/filter 6 query parameter（`q / zone / status / tag / sort / density` + `page/limit`）を正本 specs と実コードへ同期。`status` は参加ステータスであり公開状態ではない。公開境界は `public_consent='consented'` / `publish_state='public'` / `is_deleted=0` / canonical alias source 除外で固定。`apps/api/src/_shared/search-query-parser.ts` は q trim + whitespace normalize + 200 truncate、tag dedup + empty drop + 5 limit。`apps/api/src/repository/publicMembers.ts` は LIKE wildcard literal escape、tag AND bind offset、`sort=name` fullName ASC + member_id ASC、`sort=recent` lastSubmittedAt DESC + fullName ASC + member_id ASC。正本 specs `12-search-tags.md` / `05-pages.md` / `01-api-schema.md` / `09-ui-ux.md` に同一 wave 同期済み。runtime screenshot / curl / axe evidence は 08b / 09a 実行時に取得する。 |
| 06b-C-profile-logged-in-visual-evidence | implementation-prepared / implementation-spec / VISUAL_ON_EXECUTION / Phase 12 strict 7 files present / Phase 11 runtime evidence pending / Phase 13 pending_user_approval | `docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/` | 親 06b / 06b-B で未取得だった `/profile` logged-in 画面 visual evidence を補完する canonical workflow。既存 Playwright layout に `apps/web/playwright/tests/profile-readonly.spec.ts` を追加し、M-08 logged-in screenshot、M-09 no profile edit form、M-10 `?edit=true` ignored、M-16 logout redirect を実測できる。`scripts/capture-profile-evidence.sh` は production URL を拒否し、logged-in `storageState` 不在を exit 4 で止め、default out-dir も completed-tasks evidence root に同期済み。Phase 11 screenshots / DOM dumps / M-14 Magic Link / M-15 Google OAuth は user-approved runtime execution まで pending。legacy UT-06B path は本 06b-C root に集約。 |
| 06b-c-runtime-evidence-execution | implemented-local / implementation / VISUAL_ON_EXECUTION / Phase 1-13 specification + placeholder outputs materialized / Phase 11 runtime evidence pending_user_approval / Phase 13 pending_user_approval | `docs/30-workflows/completed-tasks/06b-c-runtime-evidence-execution/` | `task-06b-c-profile-logged-in-runtime-evidence-execution-001.md` を workflow root に昇格した execution-only follow-up。ユーザー承認済み local/staging target と logged-in `storageState` を使い、`scripts/capture-profile-evidence.sh` で先行 06b-C canonical evidence root（`completed-tasks/06b-C-profile-logged-in-visual-evidence/outputs/phase-11/`）へ screenshots / DOM dumps を保存する。未タスク側は `promoted_to_workflow` として二重実行禁止。実 screenshot / DOM capture は user approval gate まで未実行で PASS 扱いしない。 |
| 09a-parallel-staging-deploy-smoke-and-forms-sync-validation | spec_created / implementation spec / docsOnly=true / NON_VISUAL close-out / VISUAL_ON_EXECUTION / Phase 13 blocked_until_user_approval | `docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/` | staging deploy smoke と Forms sync validation の実行仕様。05a/06a/06b/06c/08b から委譲された staging visual smoke、03a/03b/U-04 の schema/response sync evidence、Cloudflare free-tier / authz / web-D1 boundary を Phase 11 実行時に取得する。今回 close-out では placeholder を PASS と扱わず、`outputs/phase-11/*` は `NOT_EXECUTED` 境界を明記。root / outputs `artifacts.json` parity と Phase 12 7成果物を配置済み。実 staging 実行は `docs/30-workflows/unassigned-task/task-09a-exec-staging-smoke-001.md` に formalize 済みで、09c はその実測 evidence まで blocked。 |
| issue-494-09a-A-exec-staging-smoke-runtime | spec_created / implementation-spec / runtime-contract-formalization / VISUAL_ON_EXECUTION / Phase 1-10 and 12 spec contract completed / Phase 11 runtime evidence pending_user_approval / Phase 12 runtime update pending_after_phase_11 / Phase 13 pending_user_approval | `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/` | 09a の実行 successor。`NOT_EXECUTED` placeholder を Phase 11 actual evidence に置換するため、staging API/Web deploy、public/auth/profile/admin visual smoke、Forms sync、D1 migration/schema parity、wrangler tail、09c blocker update の evidence path と G1-G4 approval gate を固定。Cloudflare auth blocker は recovery workflow により unblock-ready だが、本 runtime execution / commit / push / PR は未実行。Phase 12 strict 7 files と root/outputs artifacts parity は配置済みで、runtime PASS ではなく `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`。親 `09a-parallel...` directory 不在は parent mirror restoration follow-up であり、issue-494 self-contained execution path の blocker ではない。Phase 11 runtime execution は `docs/30-workflows/unassigned-task/task-09a-A-exec-staging-smoke-001.md` (`UT-09A-A-EXEC-STAGING-SMOKE-001`, HIGH, G1-G4 multi-stage approval gate) で実行する。inventory: `references/workflow-task-issue-494-09a-A-exec-staging-smoke-runtime-artifact-inventory.md`。 |
| UT-09A-A-EXEC-STAGING-SMOKE-001 | open / pending_user_approval / runtime-evidence-acquisition / VISUAL_ON_EXECUTION / G1-G4 multi-stage approval gate | `docs/30-workflows/unassigned-task/task-09a-A-exec-staging-smoke-001.md` | 09a-A spec の Phase 11 runtime evidence 取得を独立タスクとして分離（2026-05-06 wave で 0→1 件 formalize）。G1 staging API/Web deploy、G2 D1 migration apply、G3 Forms schema/responses sync、G4 evidence commit-push-PR-blocker-update を**独立**承認下で逐次実行する（合算承認禁止 / 逆順実行禁止）。Cloudflare auth blocker は `bash scripts/cf.sh whoami` PASS により 2026-05-06 時点で解消、残るは G1-G4 user 承認のみ。`task-09a-canonical-directory-restoration-001` は親 mirror update のみの blocker で 09a-A 単独完結経路は restoration 未完でも可。`09c-production-deploy-execution-001` は本 task の runtime evidence 完了まで blocked。検出元: `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/outputs/phase-12/unassigned-task-detection.md`。 |
| ut-09a-exec-staging-smoke-001 | implemented-local / implementation / VISUAL_ON_EXECUTION / Phase 11 executed_BLOCKED / Phase 13 blocked_until_user_approval | `docs/30-workflows/ut-09a-exec-staging-smoke-001/` | 09a staging smoke 実行 follow-up。2026-05-02 に user 明示指示後 Phase 11 を試行したが、`bash scripts/cf.sh whoami` が unauthenticated となり staging deploy / Playwright screenshot / Forms sync / wrangler tail は BLOCKED。さらに親 09a canonical directory が現 worktree に不在のため AC-1 placeholder 置換も不可。09c blocker decision: `blocked`, reason=`cloudflare_unauthenticated + 09a_directory_missing`, evidence=`docs/30-workflows/ut-09a-exec-staging-smoke-001/outputs/phase-11/main.md`, checked_at=`2026-05-02`。Follow-up: `docs/30-workflows/unassigned-task/task-09a-cloudflare-auth-token-injection-recovery-001.md`, `docs/30-workflows/unassigned-task/task-09a-canonical-directory-restoration-001.md`。 |
| 09b-parallel-cron-triggers-monitoring-and-release-runbook | spec_created / docs-only / NON_VISUAL / Phase 1-12 completed / Phase 13 pending_user_approval | `docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/` | Cron triggers monitoring + release runbook 仕様。`apps/api/wrangler.toml` current facts は `0 18 * * *` / `*/15 * * * *` / `*/5 * * * *` の3本。legacy Sheets hourly cron `0 * * * *` は current runtime cron ではなく手動互換経路に限定。Phase 11 は screenshot 不要で `main.md` + `manual-smoke-log.md` + `link-checklist.md`、Phase 12 は skill 必須 7 成果物 + release / incident / diff plan、Phase 13 は user 明示承認まで PR作成承認待ち禁止。09a staging smoke と 09c production deploy へ runbook を引き渡す。artifact inventory: `references/workflow-task-09b-parallel-cron-triggers-monitoring-and-release-runbook-artifact-inventory.md`。lessons: `references/lessons-learned-09b-cron-monitoring-release-runbook-2026-05.md`。 |
| 09b-A-observability-sentry-slack-runtime-smoke | implemented-local / implementation / NON_VISUAL / Phase 12 strict 7 files present / Phase 11 provider_smoke_pending_user_approval / Phase 13 pending_user_approval | `docs/30-workflows/completed-tasks/09b-A-observability-sentry-slack-runtime-smoke/` | 09b の残 runtime gate である Sentry DSN 登録 smoke と Slack incident webhook smoke を formalize し、API smoke route を `apps/api/src/routes/admin/smoke-observability.ts` / `POST /admin/smoke/observability` に実装済み。Issue #495 production extension により production は Bearer token + `x-smoke-production-confirm: YES` 必須、dev/staging は `SMOKE_ADMIN_TOKEN` 必須の既存挙動を維持する。`SENTRY_DSN_API` / `SENTRY_DSN_WEB` / `SLACK_WEBHOOK_INCIDENT` / optional `SLACK_WORKFLOW_URL` を正本 secret 名とし、実値・hash・DSN URL・webhook URL は evidence に残さない。Canonical 09b release / incident runbook root は `docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/` に restored。Phase 11 の実Provider evidence は後続 user-approved execution wave。09c production readiness の observability blocker を引き継ぐ。旧 nested root `docs/30-workflows/02-application-implementation/09b-A-observability-sentry-slack-runtime-smoke/` は legacy pointer。 |
| issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension | implemented-local / implementation / NON_VISUAL / production-extension / runtime_pending_user_approval | `docs/30-workflows/issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension/` | Issue #495 の staging runtime smoke route を production に拡張。`POST /admin/smoke/observability` は production で Bearer token + `x-smoke-production-confirm: YES` を必須化し、Slack `[PRODUCTION SMOKE]` prefix、Sentry `environment=production`、staging / production evidence file 分離、G1 secret placement / G2 staging PASS / G3 production smoke / G4 redaction evidence gate を固定。実 secret 投入・runtime smoke・commit・push・PR は user approval まで未実行。 |
| issue-520-slack-incidents-channel-webhook-provisioning | implemented-local / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING / runtime user-gated | `docs/30-workflows/issue-520-slack-incidents-channel-webhook-provisioning/` | Issue #520。Issue #495 Phase 11 runtime smoke の外部 SaaS 前提として、Slack incident channel `#ubm-hyogo-incidents` と incoming webhook provisioning、`SLACK_WEBHOOK_INCIDENT` の 1Password 正本 `op://Employee/ubm-hyogo-env/SLACK_WEBHOOK_INCIDENT_<ENV>`、Cloudflare staging / production secret placement、GitHub Actions secret placement、redaction grep gate `scripts/redaction-grep.sh`、runbook `docs/30-workflows/runbooks/slack-incidents-channel-provisioning.md` を正本化。ローカル redaction script / `.env.example` / smoke redaction test hardening は反映済み。実 Slack / 1Password / Cloudflare / GitHub / smoke / commit / push / PR は G1〜G4 + Phase 13 user approval 後のみ。 |
| ut-02a-attendance-profile-integration | implemented / Phase 1-12 completed / NON_VISUAL / Phase 13 pending_user_approval | `docs/30-workflows/ut-02a-attendance-profile-integration/` | 02a Phase 12 由来の `MemberProfile.attendance` 実データ統合 follow-up。`createAttendanceProvider().findByMemberIds()`、D1 80-id chunked read、builder optional `attendanceProvider` injection、meeting/attendance branded type module を実装済み。`member_attendance` + `meeting_sessions` は `session_id` で INNER JOIN し、`held_on DESC` + `session_id ASC` で安定化する。旧単票は `docs/30-workflows/completed-tasks/UT-02A-ATTENDANCE-PROFILE-INTEGRATION.md` の Canonical Status で本 root へ誘導。09a/09b/09c、06b visual、U-UT01-08 enum canonicalization は削除・代替しない。artifact inventory: `references/workflow-ut-02a-attendance-profile-integration-artifact-inventory.md` / 固有教訓: `references/lessons-learned-ut-02a-attendance-profile-integration-2026-05.md` / closeout: `changelog/20260501-ut-02a-attendance-profile-integration-closeout.md`。 |
| issue-371-ut-02a-followup-003-hono-ctx-di-migration | implemented-local / implementation / NON_VISUAL / code evidence captured / runtime smoke pending / Issue #371 CLOSED | `docs/30-workflows/issue-371-ut-02a-followup-003-hono-ctx-di-migration/` | UT-02A follow-up 003 を実装完了。`buildMemberProfile` / `buildAdminMemberDetailView` の optional `deps?` provider 注入を撤去し、`attendanceProviderMiddleware` + Hono `c.var.attendanceProvider` 経由へ移行。現行 `DbCtx` (`readonly db`) は変更せず、repository-owned `RepositoryProviderCtx = DbCtx & { var: RepositoryProviderVariables }` を `apps/api/src/repository/_shared/provider-context.ts` に配置して middleware 依存逆転を回避。Phase 11 は typecheck / lint / test / build / grep gate logs captured、runtime smoke は下流 09a / 09b gate。source stub `completed-tasks/ut-02a-attendance-profile-integration/ut-02a-followup-003-hono-ctx-or-di-container-migration.md` は transferred trace。 |
| issue-372-attendance-pagination | implemented-local / implementation / VISUAL / Phase 11 visual evidence pending / Phase 13 pending_user_approval | `docs/30-workflows/issue-372-attendance-pagination/` | Issue #372。`MemberProfile.attendance` の大量履歴を個人特化 cursor pagination に切り出す local 実装。実装済み: `createAttendanceProvider().findByMemberId(id, { limit, cursor })`、`/me/attendance`、`/admin/members/:memberId/attendance`、optional `attendanceMeta`、`/profile` / admin detail load-more UI。既存 `findByMemberIds(ids)` bulk read は変更せず、bulk pagination は明示スコープ外で未タスク化しない。`docs/00-getting-started-manual/specs/01-api-schema.md` / `references/api-endpoints.md` / Phase 12 strict 7 files + cursor runbook は同期済み。staging visual evidence、commit / push / PR は user approval gate 後。artifact inventory: `references/workflow-issue-372-attendance-pagination-artifact-inventory.md`。 |
| issue-533-public-profile-builder-attendance-injection | verified / implementation / NON_VISUAL / implementation_complete_pending_pr / Phase 13 pending_user_approval | `docs/30-workflows/completed-tasks/issue-533-public-profile-builder-attendance-injection/` | Issue #533。`PublicMemberProfile` と `GET /public/members/:memberId` に `attendance: AttendanceRecord[]` と optional `attendanceMeta` を追加し、`attendanceProviderMiddleware` / `RepositoryProviderVariables` 経由で provider を bind する。公開適格判定後に attendance を読み、非公開 member の attendance 有無は 404 経路で漏らさない。public route は session/admin guard を追加しない。artifact inventory: `references/workflow-issue-533-public-profile-builder-attendance-injection-artifact-inventory.md`。Issue #533 は CLOSED 維持、PR 文脈は `Refs #533` のみ。 |
| ut-02a-followup-001-attendance-write-operations | implemented-local / resolved-by-existing-06cE-07c / implementation / NON_VISUAL / Phase 12 strict 7 files present / Phase 13 pending_user_approval | `docs/30-workflows/completed-tasks/ut-02a-followup-001-attendance-write-operations/` | UT-02A Phase 12 起票元 `task-ut-02a-attendance-write-operations-001.md` を、既存 06c-E / 07c 実装へ吸収して close-out。write 正本は `apps/api/src/repository/attendance.ts` の `addAttendance` / `removeAttendance`、canonical route は `POST /admin/meetings/:sessionId/attendances`、legacy route は `POST /admin/meetings/:sessionId/attendance` + `DELETE /admin/meetings/:sessionId/attendance/:memberId`。duplicate は repository reason + HTTP 409、deleted member は 422、session/member not found は 404。新規 `AttendanceWriter` / `AttendanceRecordId` は過剰抽象として導入しない。 |
| ut-02a-followup-002-attendance-dashboard-analytics | implemented-local / implementation / VISUAL_ON_EXECUTION / local tests passed / runtime curl and UI screenshot pending | `docs/30-workflows/ut-02a-followup-002-attendance-dashboard-analytics/` | Issue #370。admin attendance analytics dashboard の実装。aggregate API 3 本は `/admin/dashboard/attendance/{overview,by-session,ranking}`、repository は `apps/api/src/repository/attendance.ts` 末尾追記、route は既存 `apps/api/src/routes/admin/dashboard.ts` 拡張、UI は `apps/web/app/(admin)/admin/dashboard/attendance/page.tsx`。schema 正本は `meeting_sessions.session_id`、new index は `idx_member_attendance_member` のみで既存 `idx_member_attendance_session` / `idx_meeting_sessions_active_held_on` を流用。削除済み member/session は count/rate から除外。Phase 11 は repository / route / EXPLAIN Vitest PASS、runtime curl / browser screenshot は user-approved capture cycle まで pending。 |
| 09c-serial-production-deploy-and-post-release-verification | docs-only / spec_created / VISUAL / runtime evidence pending_user_approval | `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/` | Wave 9 terminal production release runbook specification。09a staging green と 09b release / incident runbook の引き渡しを受け、production D1 migration / deploy / release tag / smoke / 24h verification の runbook と evidence template を固定。実 production deploy は `task-09c-production-deploy-execution-001` に分離し、`bash scripts/cf.sh` wrapper、solo CI gate branch strategy、Phase 11 runtime evidence pending 境界を正本化。artifact inventory は `references/workflow-task-09c-serial-production-deploy-and-post-release-verification-artifact-inventory.md`、旧 root alias は `references/legacy-ordinal-family-register.md` に登録。 |
| 09c-production-deploy-execution-001 | implemented-local / implementation / VISUAL_ON_EXECUTION / Phase 12 strict outputs present / production runtime evidence pending_user_approval | `docs/30-workflows/completed-tasks/09c-A-production-deploy-execution/`（issue mirror: `docs/30-workflows/issue-353-09c-production-deploy-execution/`） | 親 09c docs-only runbook から分離した production execution workflow。Phase 1/5/10 の production approval G1-G3、Phase 6 D1 backup + migration apply、API/Web deploy、release tag、production smoke、24h post-release verification、Phase 12 strict 7 files を固定。Phase 13 は PR 作成承認であり production approval には数えない。実 Cloudflare mutation / tag push / PR 作成は未実行。artifact inventory: `references/workflow-task-09c-production-deploy-execution-001-artifact-inventory.md` / 固有教訓: `references/lessons-learned-09c-production-deploy-execution-001-2026-05.md`（L-09C-EXEC-001〜006）。Issue #353 は CLOSED のまま `Refs #353` で追跡し、production execution 未完了状態は workflow runtime evidence pending として管理する。 |
| issue-348-09c-github-release-tag-automation | implemented-local / implementation / NON_VISUAL / Phase 12 strict outputs present / release apply user-gated / Phase 13 blocked_pending_user_approval | `docs/30-workflows/issue-348-09c-github-release-tag-automation/` | Issue #348。`scripts/release/generate-release-notes.sh` は Phase 12 changelog + Phase 11 evidence URL + template から release note を stdout 生成し、`scripts/release/create-github-release.sh` は `--dry-run` と `--apply --draft` の境界を担う。`.github/workflows/release-create.yml` は `workflow_dispatch` dry-run / tag push draft release 作成。artifact inventory: `references/workflow-issue-348-09c-github-release-tag-automation-artifact-inventory.md`。SSOT: `references/release-runbook.md`。元 unassigned task は consumed。 |
| issue-352-postmortem-template-automation | implemented-local / implementation / NON_VISUAL / Phase 1-12 completed / Phase 13 blocked_pending_user_approval | `docs/30-workflows/completed-tasks/issue-352-postmortem-template-automation/` | Issue #352。09c Phase 11 evidence と release metadata から postmortem markdown を生成する CLI / template / runbook を追加。`generatePostmortem(input, template)` は pure、CLI が template read / evidence directory `main.md` check / rollback evidence file check（0 byte warning）/ stdout or `--out` write を担当。`docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` に rollback 後 24h postmortem 生成運用を追記。artifact inventory: `references/workflow-issue-352-postmortem-template-automation-artifact-inventory.md`。固有教訓: `lessons-learned/lessons-learned-issue-352-postmortem-template-automation-2026-05.md`（L-352-001 同一 wave 5 点同期 / L-352-002 NON_VISUAL でも宣言済 evidence 必須 / L-352-003 TS CLI は `node --experimental-strip-types`）。元 unassigned stub は `docs/30-workflows/completed-tasks/task-09c-postmortem-template-automation-001.md` に close-out 移動済み。commit / push / PR は user approval 待ち。 |
| 06c-parallel-admin-dashboard-members-tags-schema-meetings-pages | completed / Phase 1-12 完了 / Phase 13 pending_user_approval / VISUAL screenshot deferred to 08b/09a | `docs/30-workflows/02-application-implementation/06c-parallel-admin-dashboard-members-tags-schema-meetings-pages/` | apps/web `/admin` 5画面（dashboard / members / tags / schema / meetings）を App Router `(admin)` 配下に実装。04c admin API と 05a admin gate を接続し、`AdminSidebar`、`MemberDrawer`、`TagQueuePanel`、`SchemaDiffPanel`、`MeetingPanel`、`/api/admin/[...path]` proxy、Server Component `fetchAdmin` を追加。profile本文直接編集なし、tag直接編集なし、schema解消は`/admin/schema`のみ、deleted attendance除外、duplicate attendance disabled + 409/422 toast。検証: web typecheck PASS / Vitest 7 files 36 tests PASS。Phase 11 screenshot は D1 fixture・staging admin 前提のため 08b Playwright / 09a staging smoke に委譲。固有教訓 `references/lessons-learned-06c-admin-ui-2026-04.md`（L-06C-001〜005） |
| 06c-A-admin-dashboard | spec_created / docs-only / remaining-only / VISUAL_ON_EXECUTION / Phase 12 strict 7 files present / Phase 13 pending_user_approval | `docs/30-workflows/06c-A-admin-dashboard/` | 06c 親タスクを復活させず、admin dashboard の既存 04c/06c contract 差分だけを formalize。正本 KPI は `総会員数 / 公開中人数 / 未タグ人数 / スキーマ未解決件数`、endpoint は apps/api `GET /admin/dashboard` + apps/web proxy `GET /api/admin/dashboard` の単一 dashboard contract。recent actions は `audit_log` 直近7日 max20 で `dashboard.view` を除外し、dashboard read は audit に `dashboard.view` として記録する。Phase 12 evidence: `outputs/phase-12/phase12-task-spec-compliance-check.md`。runtime visual evidence は implementation execution / 08b / 09a へ委譲。 |
| 06c-B-admin-members | implemented-local / implementation / VISUAL_ON_EXECUTION / Phase 12 strict 7 files present / Phase 13 pending_user_approval | `docs/30-workflows/completed-tasks/06c-B-admin-members/` | 06c 親タスクを復活させず、admin members の残差を実装完了。既存 API baseline は `GET /admin/members?filter=published|hidden|deleted`, detail, delete, restore。検索追補は `q` max 200 / repeated `tag` code AND / `zone` / `sort=recent|name` / `density=comfy|dense|list` / `page`。実装正本は `apps/api/src/routes/admin/members.ts`、`apps/web/app/(admin)/admin/members/page.tsx`、`apps/web/src/components/admin/MembersClient.tsx`、`packages/shared/src/admin/search.ts`。UI は `/admin/members` 一覧 + 右ドロワー詳細、apps/web middleware + apps/api `requireAdmin` の二段防御、`audit_log` canonical spelling、role mutation UI/API scope out を固定。runtime visual evidence は 08b / 09a へ委譲。 |
| 06c-B-admin-members-implementation-execution | execution-supplement / implementation patch / VISUAL_ON_EXECUTION / Phase 12 strict 7 files present / runtime evidence pending_user_approval / Phase 13 pending_user_approval | `docs/30-workflows/completed-tasks/06c-B-admin-members-implementation-execution/` | 06c-B completed canonical root を置換せず、Issue #430 実装実行契約の supplement として登録。今回 review cycle で `apps/api/src/routes/admin/member-delete.ts` を契約へ再整合し、delete reason 422、delete response `{ id, isDeleted, deletedAt }`、restore response `{ id, restoredAt }`、status / deleted_members / audit_log の `DB.batch()` 接続を実コード + focused tests に反映。Focused evidence: admin members/delete/web drawer/shared viewmodel 5 files / 51 tests PASS、typecheck PASS、lint PASS。runtime screenshots / staging curl / D1 / tail は 08b / 09a へ委譲。 |
| 06c-C-admin-tags | spec_created / implementation-spec / docs-only / remaining-only / VISUAL_ON_EXECUTION / Phase 12 strict 7 files present / Phase 13 pending_user_approval | `docs/30-workflows/06c-C-admin-tags/` | 06c 親タスクを復活させず、admin tags の残差を正本仕様に合わせて formalize。`/admin/tags` は未タグ会員キューであり、API は `GET /admin/tags/queue` と `POST /admin/tags/queue/:queueId/resolve` のみ。旧案のタグ辞書 CRUD / alias editor / `member_tags` 直接編集 UI/API / 新規 migration は正本違反として撤回。schema 正本は `packages/shared/src/schemas/admin/tag-queue-resolve.ts`、audit は `admin.tag.queue_resolved` / `admin.tag.queue_rejected`。runtime visual evidence は 08b / 09a へ委譲。 |
| 06c-E-admin-meetings | implemented-local / implementation / remaining-only / VISUAL_ON_EXECUTION / Phase 12 strict 7 files present / Phase 13 pending_user_approval | `docs/30-workflows/06c-E-admin-meetings/` | 06c 親タスクを復活させず、admin meetings の残差を実装完了。`meeting_sessions.deleted_at` を migration `0013_meeting_sessions_soft_delete.sql` で追加し、API は `PATCH /admin/meetings/:id`、`POST /admin/meetings/:id/attendances`、`GET /admin/meetings/:id/export.csv` を提供。attendance mutation は unknown member / soft-deleted meeting を 404、deleted member を 422、duplicate を 409 に固定。Web `MeetingPanel` は編集 details / soft delete / CSV link を追加。Focused tests: API meetings / attendance / MeetingPanel PASS。runtime visual evidence は 08b / 09a へ委譲。 |
| UT-07A-02 search-tags resolve contract follow-up | completed / Phase 1-12 完了 / Phase 13 pending_user_approval / NON_VISUAL | `docs/30-workflows/completed-tasks/ut-07a-02-search-tags-resolve-contract-followup/` | 07a resolve body contract を shared schema SSOT に昇格。`packages/shared/src/schemas/admin/tag-queue-resolve.ts` の strict discriminated union を API route と apps/web admin client が参照し、`confirmed + tagCodes` / `rejected + reason` / mixed body 400 / idempotent / 409 / 422 を focused Vitest 31 tests と typecheck で検証。`docs/30-workflows/completed-tasks/UT-07A-02-search-tags-resolve-contract-followup.md` は consumed。UT-07A-03 staging smoke の前提を満たす。 |
| 07a-parallel-tag-assignment-queue-resolve-workflow | completed / Phase 1-12 完了 / Phase 13 pending_user_approval / NON_VISUAL | `docs/30-workflows/completed-tasks/07a-parallel-tag-assignment-queue-resolve-workflow/` | tag assignment queue resolve workflow を `apps/api` に実装。`POST /admin/tags/queue/:queueId/resolve` は `{ action: "confirmed", tagCodes }` / `{ action: "rejected", reason }` を受け、guarded update 成功後だけ `member_tags` / `audit_log` を更新する。`queued/reviewing -> resolved/rejected`、同一 payload idempotent、409 race/state conflict、422 unknown tag/deleted member。03b response sync hook から未タグ member の candidate queue を自動投入。apps/web admin client と `TagQueuePanel`、packages/shared zod/type も `rejected` と resolve body に追従。検証: api typecheck PASS / web typecheck PASS / shared typecheck PASS / api Vitest 69 files 406 tests PASS / web Vitest 13 files 72 tests PASS。固有教訓 `references/lessons-learned-07a-tag-queue-resolve-2026-04.md`（L-07A-001〜007）。Follow-up: UT-07A-01 / UT-07A-03 / UT-07A-04（UT-07A-02 は consumed） |
| 07a-parallel-tag-assignment-queue-resolve-workflow | completed / Phase 1-12 完了 / Phase 13 pending_user_approval / NON_VISUAL | `docs/30-workflows/completed-tasks/07a-parallel-tag-assignment-queue-resolve-workflow/` | tag assignment queue resolve workflow を `apps/api` に実装。`POST /admin/tags/queue/:queueId/resolve` は `{ action: "confirmed", tagCodes }` / `{ action: "rejected", reason }` を受け、guarded update 成功後だけ `member_tags` / `audit_log` を更新する。`queued/reviewing -> resolved/rejected`、同一 payload idempotent、409 race/state conflict、422 unknown tag/deleted member。03b response sync hook から未タグ member の candidate queue を自動投入。apps/web admin client と `TagQueuePanel`、packages/shared zod/type も `rejected` と resolve body に追従。検証: api typecheck PASS / web typecheck PASS / shared typecheck PASS / api Vitest 69 files 406 tests PASS / web Vitest 13 files 72 tests PASS。固有教訓 `references/lessons-learned-07a-tag-queue-resolve-2026-04.md`（L-07A-001〜007）。Follow-up: UT-07A-01 / UT-07A-03（UT-07A-02 と UT-07A-04 は consumed） |
| issue-109-ut-02a-tag-assignment-queue-management | implemented-local / implementation / NON_VISUAL / Phase 1-12 completed / Phase 13 pending_user_approval / Issue #109 CLOSED | `docs/30-workflows/completed-tasks/issue-109-ut-02a-tag-assignment-queue-management/` | 02a `memberTags.ts` read-only 境界を維持したまま、Forms sync から `tag_assignment_queue` へ candidate を投入する write-side repository / workflow を実装。`enqueueTagCandidate(env, payload)` は `createIdempotent` 経由で `<memberId>:<responseId>` key を使い、migration `0009_tag_queue_idempotency_retry.sql` で idempotency / retry / DLQ 列を追加。admin queue は `status=dlq` filter を許可。manual specs 08/11/12 と Phase 12 7 outputs は同一 wave 同期済み。open follow-up: `task-issue-109-dlq-requeue-api-001.md`, `task-issue-109-tag-queue-pause-flag-001.md`。consumed: `task-issue-109-retry-tick-and-dlq-audit-001.md`（issue-377へ昇格済み）、`task-schema-diff-queue-faked1-compat-001.md`（Issue #379 current GREEN verification で consumed trace 化済み）。 |
| issue-377-retry-tick-and-dlq-audit | implemented-local / implementation / NON_VISUAL / Phase 1-12 completed / Phase 13 pending_user_approval / Issue #377 CLOSED | `docs/30-workflows/issue-377-retry-tick-and-dlq-audit/` | UT-02A retry/DLQ primitives を scheduled cron で駆動。`apps/api/src/workflows/tagQueueRetryTick.ts` は retry tick 対象条件（`reason='retry_tick'` / `attempt_count > 0` / `last_error IS NOT NULL` / `next_visible_at IS NOT NULL`）を満たす queued row のみ処理し、plain human-review queued row は skip。default scheduled path でも `incrementRetryWithDlqAudit` を呼び、max retry 超過 / non-retryable error では `status='dlq'` と `admin.tag.queue_dlq_moved` audit (`target_type='tag_queue'`) を D1 batch で同時記録する。`apps/api/wrangler.toml` は top-level / staging / production を3 cron以内に維持し、legacy Sheets hourly は手動限定。Focused evidence: `tagQueueRetryTick.test.ts` 7 tests PASS + api typecheck PASS。Phase 13 は `Refs #377` のみ、commit / push / PR / deploy は user-gated。 |
| 07c-parallel-meeting-attendance-and-admin-audit-log-workflow | completed / Phase 1-12 完了 / Phase 13 pending_user_approval / NON_VISUAL | `docs/30-workflows/completed-tasks/07c-parallel-meeting-attendance-and-admin-audit-log-workflow/` | apps/api attendance 3 endpoint を 05a `requireAdmin` 配下で実装。`GET /admin/meetings/:sessionId/attendance/candidates` は session 不在 `404 session_not_found`、削除済み・登録済み member 除外。`POST /admin/meetings/:sessionId/attendance` は duplicate `409 attendance_already_recorded` / deleted `422 member_is_deleted` / session 不在 `404 session_not_found`。`DELETE /admin/meetings/:sessionId/attendance/:memberId` は row 不在を `404 attendance_not_found` に集約。add/remove 成功時のみ `audit_log` に `attendance.add` / `attendance.remove` を append（target_type=`meeting`, target_id=sessionId）。Phase 11 は API-only のため Vitest smoke evidence、visual は 08b/09a に委譲。固有教訓 `references/lessons-learned-07c-attendance-audit-2026-04.md`（L-07C-001〜005）。 |
| 07c-followup-003-audit-log-browsing-ui | completed / Phase 1-12 完了 / Phase 13 blocked_user_approval / VISUAL | `docs/30-workflows/completed-tasks/07c-followup-003-audit-log-browsing-ui/` | `/admin/audit` 監査ログ閲覧 UI と `GET /admin/audit` を実装。API は `requireAdmin`、複合 filter、UTC range、cursor pagination、limit 1-100、maskedBefore/maskedAfter projection、broken JSON parseError を提供し raw `before_json` / `after_json` を返さない。Web は admin proxy 経由の read-only table/filter/disclosure UI、JST 入力・表示、UI 側 PII 再 mask、AdminSidebar 導線を追加。検証: api typecheck PASS / web typecheck PASS / api Vitest 82 files 493 tests PASS / focused web Vitest 2 files 7 tests PASS。web 全体 test は既存 `/no-access` invariant で FAIL（本差分外）。Phase 11 screenshot 7 件を保存。 |
| 08a-parallel-api-contract-repository-and-authorization-tests | member_only / Phase 1-10 completed / Phase 11-12 member_only / Phase 13 pending_user_approval / NON_VISUAL | `docs/30-workflows/08a-parallel-api-contract-repository-and-authorization-tests/` | apps/api の API contract / repository / authz / brand type / invariant tests を整備。Phase 11 実測は 74 files / 442 tests PASS、coverage は Statements 84.18% / Branches 84.13% / Functions 83.37% / Lines 84.18% で AC-6 PARTIAL。代表 authz matrix + route tests で現状を観測し、全 endpoint generated matrix と public use-case coverage 補強は `docs/30-workflows/unassigned-task/UT-08A-01-public-use-case-coverage-hardening.md` に formalize。UI route なしのため screenshot 不要、Phase 11 evidence は `outputs/phase-11/evidence/{test-run.log,coverage-report.txt,ci-workflow.yml}`。Phase 12 close-out: `outputs/phase-12/{main,implementation-guide,documentation-changelog,system-spec-update-summary,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md`（全 6 + 1 揃い）。Follow-up は UT-08A-01〜06 の計 6 本を `unassigned-task/` に formalize（02 visual regression / 03 production load test / 04 D1 migration test guideline / 05 shared package type test / 06 test suffix rename）。task root path drift（`02-application-implementation/` → `30-workflows/` 直下）を `legacy-ordinal-family-register.md` の Task Root Path Drift Register に記録。 |
| issue-346-08a-canonical-workflow-tree-restore | spec_created / docs-only / NON_VISUAL / Phase 1-12 completed / Phase 13 pending_user_approval | `docs/30-workflows/issue-346-08a-canonical-workflow-tree-restore/` | 09c production release runbook が参照する 08a upstream contract gate の trace 回復タスク。A restore を採用し、`docs/30-workflows/08a-parallel-api-contract-repository-and-authorization-tests/` を current/member_only canonical root として維持する。08a-A は follow-up であり canonical root の代替ではない。Phase 11 evidence は file existence / aiworkflow state diff / 09c targeted link check / unassigned grep / `pnpm indexes:rebuild` drift 0 / secret hygiene を NON_VISUAL として保存。アプリコード変更なし、screenshot 不要。Issue #346 は仕様作成時点で closed のため Phase 13 は `Refs #346` のみ。artifact inventory: `references/workflow-task-issue-346-08a-canonical-workflow-tree-restore-artifact-inventory.md`。lessons: `references/lessons-learned-issue-346-08a-canonical-workflow-tree-restore-2026-05.md`（L-I346-001〜006）。 |
| 08a-parallel-api-contract-repository-and-authorization-tests | partial / Phase 1-10 completed / Phase 11-12 partial / Phase 13 pending_user_approval / NON_VISUAL | `docs/30-workflows/08a-parallel-api-contract-repository-and-authorization-tests/` | apps/api の API contract / repository / authz / brand type / invariant tests を整備。Phase 11 実測は 74 files / 442 tests PASS、coverage は Statements 84.18% / Branches 84.13% / Functions 83.37% / Lines 84.18% で AC-6 PARTIAL。代表 authz matrix + route tests で現状を観測し、全 endpoint generated matrix と public use-case coverage 補強は `docs/30-workflows/unassigned-task/UT-08A-01-public-use-case-coverage-hardening.md` に formalize。UI route なしのため screenshot 不要、Phase 11 evidence は `outputs/phase-11/evidence/{test-run.log,coverage-report.txt,ci-workflow.yml}`。Phase 12 close-out: `outputs/phase-12/{main,implementation-guide,documentation-changelog,system-spec-update-summary,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md`（全 6 + 1 揃い）。Follow-up は UT-08A-01〜06 の計 6 本を `unassigned-task/` に formalize（02 visual regression / 03 production load test / 04 D1 migration test guideline / 05 shared package type test / 06 test suffix rename）。task root path drift（`02-application-implementation/` → `30-workflows/` 直下）を `legacy-ordinal-family-register.md` の Task Root Path Drift Register に記録。 |
| issue-325-test-suffix-rename-migration | implementation_completed / implementation / NON_VISUAL / Phase 11 evidence captured / Phase 12 strict 7 files present / Phase 13 pending_user_approval | `docs/30-workflows/issue-325-test-suffix-rename-migration/` | Issue #325 / UT-08A-06 successor。`apps/api/src/**/*.test.ts` 132 files を contract=41 / authz=4 / repository=38 / unit=49 に suffix-classified `*.spec.ts` へ R100 rename 済み。現行 tree は `apps/api/src/**/*.test.ts` 0 / `apps/api/src/**/*.spec.ts` 132。`vitest.config.ts` は `*.{test,spec}` include に同期済み。Phase 11 evidence は `outputs/phase-11/main.md` / `rename-mapping.csv` / `glob-coverage-grep.log`。ADR: `outputs/phase-12/test-file-suffix-adr.md`。inventory: `references/workflow-issue-325-test-suffix-rename-migration-artifact-inventory.md`。Issue #325 は CLOSED 維持、PR は `Refs #325` のみ。 |
| issue-346-08a-canonical-workflow-tree-restore | spec_created / docs-only / NON_VISUAL / Phase 1-12 completed / Phase 13 pending_user_approval | `docs/30-workflows/issue-346-08a-canonical-workflow-tree-restore/` | 09c production release runbook が参照する 08a upstream contract gate の trace 回復タスク。A restore を採用し、`docs/30-workflows/08a-parallel-api-contract-repository-and-authorization-tests/` を current/partial canonical root として維持する。08a-A は follow-up であり canonical root の代替ではない。Phase 11 evidence は file existence / aiworkflow state diff / 09c targeted link check / unassigned grep / `pnpm indexes:rebuild` drift 0 / secret hygiene を NON_VISUAL として保存。アプリコード変更なし、screenshot 不要。Issue #346 は仕様作成時点で closed のため Phase 13 は `Refs #346` のみ。artifact inventory: `references/workflow-task-issue-346-08a-canonical-workflow-tree-restore-artifact-inventory.md`。lessons: `references/lessons-learned-issue-346-08a-canonical-workflow-tree-restore-2026-05.md`（L-I346-001〜006）。 |
| 06a-parallel-public-landing-directory-and-registration-pages | completed / Phase 1-12 完了 / Phase 13 pending_user_approval / VISUAL | `docs/30-workflows/completed-tasks/06a-parallel-public-landing-directory-and-registration-pages/` | apps/web 公開 4 route（`/`, `/members`, `/members/[id]`, `/register`）を実装。`apps/web/src/lib/url/members-search.ts` は `q` max 200、`zone/status/tag/sort/density` を URL query 正本として parse し、`fetchPublic` 経由で 04a public API のみを呼ぶ。Phase 11 は `wrangler dev` esbuild mismatch のため local mock API で curl + screenshot smoke を PASS、実 Workers + D1 smoke は 08b / 09a に引き継ぎ。follow-up: real Workers/D1 smoke、OGP/sitemap、mobile FilterBar + tag picker、04a shared query parser extraction 継続。固有教訓 `references/lessons-learned-06a-public-web-2026-04.md`（L-06A-001〜005）。 |
| task-sync-forms-d1-legacy-umbrella-001 | spec_created / docs-only / NON_VISUAL | `docs/30-workflows/completed-tasks/task-sync-forms-d1-legacy-umbrella-001/` | 旧 UT-09 Sheets→D1 sync を legacy umbrella として close。実装責務は 03a（Forms schema sync）/ 03b（Forms response sync）/ 04c（admin sync endpoints; current canonical は `references/api-endpoints.md`）/ 09b（cron runbook）/ 02c（sync_jobs 排他）へ移管。単一 `/admin/sync`、`sync_audit`、Google Sheets API 前提を stale とし、Forms API / split endpoint / `sync_jobs` を current として固定。**retry/offset canonical（max retry=3 / exponential backoff base 1s/factor 2/cap 32s/jitter ±20% / `processed_offset` chunk index）は U-UT01-09（2026-04-30）にて確定済み**。実装反映時は `references/lessons-learned-u-ut01-09-retry-offset-2026-04.md`（L-UUT0109-001〜003）を参照する。 |
| issue-194-03b-followup-001-email-conflict-identity-merge | implemented-local / implementation-spec / VISUAL_ON_EXECUTION / Phase 1-12 completed / Phase 11 runtime pending / Phase 13 pending_user_approval | `docs/30-workflows/completed-tasks/issue-194-03b-followup-001-email-conflict-identity-merge/` | 03b の `EMAIL_CONFLICT` follow-up を Phase 1-13 仕様へ再構成し、ローカル実装差分として admin API / D1 migrations / repository / shared schema / web UI を追加済み。候補抽出は `EMAIL_CONFLICT` が存在する運用文脈で `member_identities` 全体から name+affiliation 完全一致を検出し、merge は raw response 移動ではなく `identity_aliases.source_member_id -> target_member_id` と `identity_merge_audit` / `audit_log` の単一 D1 batch で canonical identity を記録する。Phase 11 は VISUAL_ON_EXECUTION helper のみ、Phase 12 strict 7 files と root/outputs `artifacts.json` parity を配置済み。historical source: `completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver-followups/03b-followup-001-email-conflict-identity-merge.md`。固有教訓: `references/lessons-learned-issue-194-identity-merge-2026-05.md`（L-IDENT-001〜006）。staging D1 migration / screenshots / commit / push / PR は user approval gate。 |
| 04c-followup-001-email-conflict-merge-api-and-ui | completed_alias / docs-only / NON_VISUAL / Issue #432 trace | `docs/30-workflows/04c-followup-001-email-conflict-merge-api-and-ui/` | 新規 implementation workflow ではなく、Issue #432 / 04c follow-up 名称を issue-194 正本へ誘導する alias。旧 draft の `identity_dismissals` / `admin_audit_log` 拡張 / `sync_jobs.lock_token` 転用 / `GET /admin/identity-conflicts/:id` / screenshot 3枚 / PR 実行文面は撤回。元 unassigned `03b-followup-001-workflow-elevation` と `04c-followup-001-email-conflict-merge-api-and-ui` は consumed stub。runtime evidence と Phase 13 は issue-194 user approval gate に従う。 |
| 06a-followup-001-public-web-real-workers-d1-smoke | historical/design canonical / superseded-for-execution-by 06a-A / NON_VISUAL | `docs/30-workflows/completed-tasks/06a-followup-001-public-web-real-workers-d1-smoke/` | 06a Phase 11 で deferred になった real Workers + D1 smoke を formalize した旧 root。設計背景と昇格 trace は保持するが、actual local / staging curl log と screenshot の保存先は current execution root `docs/30-workflows/06a-A-public-web-real-workers-d1-smoke-execution/` に一本化する。元 unassigned task は `docs/30-workflows/completed-tasks/task-06a-followup-001-real-workers-d1-smoke.md` に rename（昇格 trace のみ保持）。Issue #273 は CLOSED のまま `Refs #273` のみ。inventory: `references/workflow-task-06a-followup-001-real-workers-d1-smoke-artifact-inventory.md`。 |
| 06a-A-public-web-real-workers-d1-smoke-execution | spec_created / implementation-spec / docs-only / VISUAL_ON_EXECUTION / Phase 1-12 completed / Phase 13 pending_user_approval | `docs/30-workflows/06a-A-public-web-real-workers-d1-smoke-execution/` | 06a follow-up 001 の execution-oriented successor。既存 `completed-tasks/06a-followup-001-public-web-real-workers-d1-smoke/` を履歴・設計正本として残しつつ、実行時の local + staging real Workers/D1 smoke 手順、evidence path、Phase 11 10 screenshots, Phase 12 strict 7 outputs、root/outputs `artifacts.json` parity、user approval gate を current execution root に固定する。`apps/web/wrangler.toml` の staging / production API URL と `scripts/cf.sh` wrapper は既存で足りるため、本 spec wave は code/env/CI を変更しない。actual curl log / screenshot は Phase 11 実行後に保存し、planned evidence を PASS と扱わない。actual Phase 11 evidence completion が 08b / 09a の下流解放条件。inventory: `references/workflow-task-06a-A-public-web-real-workers-d1-smoke-execution-artifact-inventory.md`。 |
| issue-347-cloudflare-analytics-export-decision | spec_created / docs-only / NON_VISUAL / Phase 1-12 completed / Phase 13 blocked_pending_user_approval | `docs/30-workflows/completed-tasks/issue-347-cloudflare-analytics-export-decision/` | Cloudflare Analytics long-term evidence decision。GraphQL Analytics API aggregate-only export を canonical とし、CSV fallback / screenshot reject、4 metric groups / 5 scalar values、12 件 retention、PII 非保存、Logpush 不採用を正本化。Runtime production sample は Cloudflare dashboard session / API token が必要なため user approval 後の operation cycle で取得し、現 workflow は schema sample / redaction check / Free plan constraints / aiworkflow 同期までを完了範囲とする。Automation follow-up source `docs/30-workflows/completed-tasks/task-issue-347-cloudflare-analytics-export-automation-001.md` は Issue #484 spec に consumed。Issue #347 は CLOSED 維持、`Refs #347` のみ。 |
| issue-484-cloudflare-analytics-export-automation | implemented-local / implementation / NON_VISUAL / code evidence captured / runtime Cloudflare export pending_user_approval / Phase 13 blocked_pending_user_approval | `docs/30-workflows/issue-484-cloudflare-analytics-export-automation/` | Issue #347 automation follow-up を current implementation spec へ昇格。`scripts/fetch-cloudflare-analytics.ts`、`.github/workflows/cloudflare-analytics-export.yml`、redaction gate、multi-bucket summation、persisted zone/account redaction、active retention 12、`CLOUDFLARE_ANALYTICS_API_TOKEN` / `CLOUDFLARE_ACCOUNT_TAG`、schedule/manual one-export-per-month branch guard を固定。Runtime Cloudflare export / PR creation / token-backed workflow run は user approval 後の implementation cycle。 |
| task-spec-2a-admin-requests-e2e | implemented-local-runtime-pass / implementation / NON_VISUAL / Phase 11 desktop Chromium E2E PASS / Phase 12 strict outputs present | `docs/30-workflows/task-spec-2a-admin-requests-e2e/` | Stage 2 subtask 2a implementation is present: `apps/web/playwright/tests/admin-requests.spec.ts`, Auth.js-compatible Playwright session fixture, guarded SSR initial-data fixture (`PLAYWRIGHT_ADMIN_REQUESTS_FIXTURE=1` + `NODE_ENV !== "production"`), and RequestQueuePanel reject validation/row removal. Desktop Chromium E2E passed 6/6. member admin-gate expectation follows current middleware `/login?gate=admin_required`. |
| e2e-quality-uplift-stage-3-impl/3a-lighthouse-ci | spec_created / implementation / NON_VISUAL / runtime_pending | `docs/30-workflows/e2e-quality-uplift-stage-3-impl/3a-lighthouse-ci/` | Stage 3 subtask 3a。`lighthouse-ci` context、`.github/workflows/lighthouse.yml`、`lighthouserc.json`、4 route Lighthouse assertion、Q-02 `/profile` degradation decisionを固定。Parent umbrella archive is `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/`. Runtime CI evidence, commit, push, and PR are user-gated. |
| issue-630-authenticated-profile-lhci-a11y | implemented-local-runtime-pending / implementation / NON_VISUAL / CLOSED issue reconciliation | `docs/30-workflows/issue-630-authenticated-profile-lhci-a11y/` | Issue #630 successor。authenticated `/profile` Lighthouse a11y measurement を local 実装済み。test session JWT storageState 生成、mock API、LHCI puppeteer cookie 注入 + final URL pre-check、`lighthouserc.authenticated.json`、unauth `lighthouserc.json` から `/profile` 除外、`.github/workflows/lighthouse.yml` 二段化、`tsx` devDependency 追加、EXT-X1 backlog 接続を固定。Issue #630 は 2026-05-12T06:26:21Z に CLOSED 済みのため PR は `Refs #630`。runtime LHCI artifact / GitHub Secret mutation / commit / push / PR は user-gated。苦戦箇所は `references/lessons-learned-issue-630-authenticated-profile-lhci-a11y-2026-05.md` の L-I630-001..005 を参照（CLOSED issue PR ref policy / `signSessionJwt` spec-vs-impl 整合 / filter exec での `tsx` 依存 / LHCI cwd 起点 / Server Component LHCI の deterministic mock backend）。 |
| e2e-quality-uplift-stage-3-impl/3b-e2e-tests-hard-gate | implemented-local / implementation / NON_VISUAL / IMPLEMENTED_LOCAL_RUNTIME_PENDING | `docs/30-workflows/e2e-quality-uplift-stage-3-impl/3b-e2e-tests-hard-gate/` | Stage 3 subtask 3b は 2026-05-10 に local 実装完了。`.github/workflows/e2e-tests.yml` を `e2e-tests-coverage-gate` job として書き換え、`scripts/e2e-mock-api.mjs` deterministic mock API、`apps/web/src/lib/fetch/public.ts` の `PUBLIC_API_BASE_URL` 優先化（service binding より HTTP fallback を優先し CI mock 差し替えを成立）、`apps/web/playwright.config.ts` の monocart-reporter 配列末尾追加、`scripts/coverage-gate-e2e.sh`（line coverage 80% gate / `THRESHOLD_FIXTURE` override / `set -euo pipefail` / quality-gates.md path コメント付与）、devDeps `monocart-reporter@^2.9.0` / `c8@^10.1.0` を反映。fixture（pass 85.0% / fail-79 79.99% / missing）でローカル検証 PASS。実 CI run（T-3b-8..16, AC-3b-1..6）と branch protection mutation は PR / user-gated。苦戦箇所は `lessons-learned/lessons-learned-e2e-quality-uplift-stages-2026-05.md` の L-E2EQU-013..015 を参照。 |
| e2e-quality-uplift-stage-3-impl/3c-branch-protection-contexts | implemented-local-runtime-pending / implementation / NON_VISUAL / branch-protection-applied / PR-CI-runtime-pending | `docs/30-workflows/e2e-quality-uplift-stage-3-impl/3c-branch-protection-contexts/` + local execution root `docs/30-workflows/e2e-quality-uplift-stage-3/` | Stage 3 subtask 3c。3a/3b contexts registered後に dev/main required contextsを `ci`, `Validate Build`, `coverage-gate`, `lighthouse-ci`, `e2e-tests-coverage-gate` に拡張する。Local implementation adds `.github/branch-protection/{dev,main}.json`, governance-invariant `.github/branch-protection/apply.sh`, `scripts/verify-branch-protection.sh`, and Lighthouse `workflow_dispatch` + `wait-on`. `gh api -X PUT` + fresh GET evidence は captured。commit, push, PR, PR checks required 表示, Lighthouse workflow run は user-gated. |

### unassigned-task → Phase 1-13 仕様書ディレクトリへの昇格パターン

| Task | 状態 | Root | Summary |
| --- | --- | --- | --- |
| UT-17 follow-up 005 alert relay KV operation error metrics | implemented_local_evidence_captured / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING | `docs/30-workflows/completed-tasks/ut-17-followup-005-alert-relay-kv-operation-error-metrics/` | Issue #701. Adds fail-safe structured logging for `ALERT_DEDUP_KV.get` / `.put` failures in `apps/api/src/routes/internal/alert-relay.ts`. `KV.get` now fails open after emitting `event=alert_relay_kv_op_failed`; `KV.put` preserves `dedupPersisted:false`. `dedupeKeyHash` is SHA-256 first 12 hex or `hash_error` if hashing fails; logging sink failure is swallowed. Local evidence: API typecheck / lint / build PASS and API Vitest 48 files / 294 tests PASS with `ESBUILD_BINARY_PATH` pinned to project-local esbuild. Runtime Workers Logs tail, deploy, commit, push, and PR remain user-gated. |
| runtime-smoke-staging-secrets-restore | implemented_local_evidence_captured / implementation / NON_VISUAL / runtime_pending user-gated | `docs/30-workflows/completed-tasks/runtime-smoke-staging-secrets-restore/` | 2026-05-16 runtime smoke failure follow-up。`staging-runtime-smoke` 必須 4 secret (`STAGING_API_BASE`, `STAGING_ADMIN_BEARER`, `STAGING_MEMBER_ID`, `STAGING_ME_BEARER`) を `scripts/ci/verify-env-secrets.allowlist` の `env=...;required=...;reason=...` contract に追加し、`verify-env-secrets.sh` が GitHub Environment secret name-only inventory と照合する。`runtime-smoke-staging.yml` の inline value check は最終防御として維持。secret mutation、runtime workflow rerun、commit、push、PR は user-gated。 |
| UT-17 follow-up 004 Cloudflare Notification Policy IaC | implementation_complete / implementation / NON_VISUAL / runtime Cloudflare mutation pending_user_approval / Phase 13 pending_user_approval | `docs/30-workflows/completed-tasks/ut-17-followup-004-cloudflare-notification-policy-iac/` | Parent UT-17 T9/T10 Dashboard manual Notification Policy setup successor. Implements Cloudflare Notification Policy 4 categories / 5 policy files + webhook destination IaC under `infra/cloudflare-alerts/`, `bash scripts/cf.sh alerts {apply,diff,list}`, PR-local validate + schedule/manual read-only drift CI, token split `CLOUDFLARE_ALERTS_TOKEN_APPLY` / `CLOUDFLARE_ALERTS_TOKEN_READ`, URL drift secret `CLOUDFLARE_ALERT_RELAY_URL`, canonical webhook definition root `infra/cloudflare-alerts/webhooks/`, and Cloudflare API `PUT` update method. No Cloudflare mutation, GitHub Secret placement, commit, push, or PR executed. |
| UT-17 Cloudflare Analytics alerts + Slack relay | implemented-local / implementation / NON_VISUAL / CODE_COMPLETE_EXTERNAL_OPS_PENDING | `docs/30-workflows/ut-17-cloudflare-analytics-alerts/` | Cloudflare usage alert workflow. Free baseline is Cloudflare Notifications email + runbook. Local Slack Japanese relay is implemented in `apps/api` as `POST /internal/alert-relay` with `cf-webhook-auth` fixed-secret auth, Japanese Block Kit formatting, Slack retry sender, focused tests, and runbooks. Body HMAC / `X-CF-Alert-Signature` are explicitly out of contract. Cloudflare Secrets, deploy, Notification Policy setup, Slack runtime smoke, commit, push, and PR remain user-gated. |
| UT-17 follow-up 002 alert relay dedup KV | implemented-local-runtime-pending / implementation / NON_VISUAL / external_ops_pending | `docs/30-workflows/completed-tasks/ut-17-followup-002-alert-relay-dedup-kv/` | Successor for closed-unresolved Issue #634 and source `docs/30-workflows/completed-tasks/ut-17-followup-002-alert-relay-dedup-kv-persistence.md`. Replaces isolate-local `seenAlerts` Map with Cloudflare KV binding `ALERT_DEDUP_KV`, keeping dedup as practical reduction rather than exactly-once guarantee because KV is eventually consistent. Dedup key is persisted only after Slack delivery succeeds, so Cloudflare retries after Slack failure are not suppressed. Canonical focused test path is `apps/api/src/routes/internal/__tests__/alert-relay.test.ts`. KV namespace creation, real namespace ids, deploy, Slack runtime smoke, commit, push, and PR are user-gated. |
| UT-17 follow-up 006 ALERT_DEDUP_KV usage dashboard monitoring | implemented_local_runtime_pending / implementation / NON_VISUAL / Issue #702 open | `docs/30-workflows/ut-17-followup-006-alert-dedup-kv-usage-dashboard-monitoring/` | Source unassigned task is superseded because the old Dashboard-only premise is stale after followup-004. Current implementation reuses `infra/cloudflare-alerts/` IaC and adds 2 Workers KV account quota guard policies (`workers-kv-writes-per-day`, `workers-kv-stored-bytes`) with initial `enabled:false`, plus quota-base/test fixture/runbook updates. Namespace filter is not available, so this is not `ALERT_DEDUP_KV`-exclusive monitoring; current acceptability depends on the account having only that KV namespace before apply. Cloudflare apply, Slack delivery smoke, `enabled:true` rollout, commit, push, and PR are user-gated. |
| UT-17 follow-up 002 alert relay dedup KV | implemented-local-runtime-pending / implementation / NON_VISUAL / external_ops_pending | `docs/30-workflows/completed-tasks/ut-17-followup-002-alert-relay-dedup-kv/` | Successor for closed-unresolved Issue #634 and source `docs/30-workflows/completed-tasks/ut-17-followup-002-alert-relay-dedup-kv-persistence.md`. Replaces isolate-local `seenAlerts` Map with Cloudflare KV binding `ALERT_DEDUP_KV`, keeping dedup as practical reduction rather than exactly-once guarantee because KV is eventually consistent. Dedup key is persisted only after Slack delivery succeeds, so Cloudflare retries after Slack failure are not suppressed. Canonical focused test path is now `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts` (`*.test.ts` source wording is historical). KV namespace creation, real namespace ids, deploy, Slack runtime smoke, commit, push, and PR are user-gated. |

- **用途**: `docs/30-workflows/unassigned-task/` の簡易仕様書を完全な Phase 1-13 仕様書に昇格させる
- **配置先**: `docs/30-workflows/completed-tasks/{{task-id}}/`
- **手順**:
  1. unassigned-task 仕様書の Why/What/How を Phase 1 要件定義へ変換
  2. Phase 2-13 の仕様書を task-specification-creator テンプレートで生成
  3. 元の unassigned-task ファイルを completed-tasks に移動
  4. aiworkflow-requirements の同 wave 更新
- **参考**: UT-UIUX-VISUAL-BASELINE-DRIFT-001（2026-04-03）
| issue-627-composite-setup-action | implemented_local_runtime_pending / implementation / NON_VISUAL / CI infra | `docs/30-workflows/issue-627-composite-setup-action/` | RB-02 composite setup action implemented locally. Checkout-less `.github/actions/setup-project/action.yml` consolidates Node / pnpm setup and optional install across `lighthouse`, `e2e`, `e2e-tests-coverage-gate`, `workflow-shell-lint`, `ci`, `coverage-gate`, and `build-test`. Required contexts are preserved; local static checks passed. Runtime GHA evidence, commit, push, and PR are user-gated. Issue #627 is CLOSED; use `Refs #627` only. |

### Task 18 W7 verify tokens and Playwright smoke（2026-05-12）

| 項目 | 内容 |
| --- | --- |
| workflow root | `docs/30-workflows/task-18-w7-verify-tokens-and-playwright-smoke/` |
| ステータス | implemented-local / implementation / NON_VISUAL / runtime_pending / Phase 13 blocked_pending_user_approval |
| 目的 | `09b-design-tokens.md`、`apps/web/src/styles/tokens.css`、`globals.css @theme inline` の token drift と、17 URL smoke / 4 screen visual baseline を CI gate 化する |
| 実装対象 | `scripts/verify-design-tokens.ts`, `scripts/verify-design-tokens.test.ts`, `apps/web/playwright/tests/full-smoke.spec.ts`, `apps/web/playwright/tests/visual/*.spec.ts`, `apps/web/playwright/fixtures/auth.ts`, `apps/web/playwright.config.ts`, `.github/workflows/verify-design-tokens.yml`, `.github/workflows/playwright-smoke.yml` |
| required status check 候補 | `verify-design-tokens / verify-design-tokens`, `playwright-smoke / smoke (chromium)`, `playwright-smoke / visual (chromium, 4 screens)` |
| evidence boundary | Phase 11 evidence は tracked `.txt` / `.json` のみを正本とし、`.log` は `.gitignore` 対象のため PASS 根拠にしない。branch protection PUT、commit、push、PR は user approval 後 |
| upstream | task-08 / task-09 / task-10 / task-11..17 |
## UT-17 followup-003 alert-relay weekly healthcheck cron

| 項目 | 値 |
| --- | --- |
| canonical root | `docs/30-workflows/ut-17-followup-003-alert-relay-healthcheck-cron/` |
| state | `implementation_completed_external_ops_pending / implementation / NON_VISUAL / CODE_COMPLETE_EXTERNAL_OPS_PENDING` |
| issue | `#635`（CLOSED / Refs only） |
| implementation | `apps/api/src/scheduled/healthcheck.ts`, `apps/api/src/lib/healthcheck-mail-fallback.ts`, `apps/api/src/index.ts`, `apps/api/src/env.ts` |
| cron | existing `0 18 * * *` + UTC Monday gate; no new cron slot |
| external ops pending | Cloudflare secrets, staging deploy, manual cron fire, production deploy, first production observation, commit, push, PR |

### task-709 visual baseline runtime capture（2026-05-16）

| 項目 | 内容 |
| --- | --- |
| workflow root | `docs/30-workflows/task-709-visual-baseline-runtime-capture/` |
| ステータス | `PR_OPEN_MERGE_DIRTY / implementation / VISUAL` |
| Issue | `#709` |
| upstream | `docs/30-workflows/completed-tasks/task-18-fu-full-visual-regression-suite/` |
| 目的 | task-18-fu で implemented_local_runtime_pending だった 51 full visual baseline capture を実行し、visual-full PR trigger を復活させる |
| target visual scope | `VISUAL_ROUTES.length` 17 x visual-full 3 projects = 51 PNG |
| evidence boundary | Phase 1-13 / root-output artifacts parity / Phase 12 strict 7 / 51 PNG / visual-full 2-run stability (`25961476237` / `25961551972`) / matrix 17/19 / PR #760 は完了。PR #760 は `mergeStateStatus=DIRTY` のため conflict 解消待ち |
| follow-up | `docs/30-workflows/unassigned-task/task-709-fu-branch-protection-required-check.md` |
| 苦戦箇所 | `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-task-709-visual-baseline-runtime-capture-2026-05.md`（L-709-001 Actions PR-write 権限失敗 → cherry-pick / -002 visual-full 2-run stability / -003 51 PNG count+sha256 / -004 `PR_OPEN_MERGE_DIRTY` workflow_state / -005 branch protection 昇格 follow-up 分離） |

### task-18-FU full visual regression suite（2026-05-14）

| 項目 | 内容 |
| --- | --- |
| workflow root | `docs/30-workflows/task-18-fu-full-visual-regression-suite/` |
| ステータス | `implemented_local_runtime_pending / implementation / VISUAL` |
| 目的 | task-18 W7 の 4 baseline を、W7 17 URL route set x 3 viewport = 51 baseline へ拡張する実装仕様を固定する |
| route contract | public 6 / member 2 / admin 8 / not-found 1。`/login?error=invalid` など状態差分は本 root に混ぜない |
| local implementation | `apps/web/playwright.config.ts`, `apps/web/playwright/fixtures/{viewports,visual-routes}.ts`, `apps/web/playwright/tests/visual-full/full-visual.spec.ts`, `.github/workflows/playwright-visual-{full,baseline-update}.yml`, `apps/web/package.json` scripts |
| evidence boundary | 現 wave は local implementation まで完了。51 baseline PNG、runtime CI evidence、commit、push、PR は未実行 |
| baseline gate | baseline 未存在 CI fail の admin override は禁止。required check 化は 51 baseline と green runtime evidence が揃った後 |
| source | `docs/30-workflows/unassigned-task/task-18-full-visual-regression-suite-001.md` |
