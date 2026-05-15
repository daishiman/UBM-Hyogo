# クイックリファレンス

> 最重要情報への即時アクセス
> 詳細は resource-map.md → 該当ファイル を参照

---

### task-parallel-07 Auth And Shared（2026-05-15）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/task-parallel-07-auth-and-shared/` |
| 状態 | `implemented_local_runtime_pending / implementation / VISUAL / Phase 11 screenshots captured / Phase 12 strict 7 present` |
| source spec | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-07-auth-and-shared/spec.md` |
| scope | `/login` loading/error、root error/loading、`/profile` loading、not-found branding verification |
| boundary | no `apps/api/**`, no D1 schema, no Auth.js flow, no new design token |
| suffix policy | component/unit specs `.spec.tsx`; Playwright specs `.spec.ts` |
| Phase 12 | `docs/30-workflows/task-parallel-07-auth-and-shared/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| user gate | staging smoke, broad task-18 regression, commit, push, PR |

### Issue #638 CLOUDFLARE_PAGES_PROJECT GitHub Variable deletion（2026-05-14）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-638-cloudflare-pages-project-var-deletion/` |
| 状態 | `implemented_local_pending_pr / implementation / NON_VISUAL / external_mutation_completed` |
| deletion target | GitHub repository variable `CLOUDFLARE_PAGES_PROJECT` (`ubm-hyogo-web`) |
| evidence | `outputs/phase-11/evidence/current-repo-variables.json`, `source-grep-preflight.txt`, `pre-mutation-static-summary.txt`, `user-approval-marker.md`, `before.json`, `before-single.json`, `after.json`, `after-single.txt`, `grep-gate.txt`, `deletion-log.md` |
| user gate | DELETE completed with approval marker. Rollback `POST`, push, PR, and Issue operation still require separate user approval |
| source task | `docs/30-workflows/unassigned-task/issue-331-followup-001-cloudflare-pages-project-var-deletion.md` superseded in place |
| related | Issue #331 Workers deploy cleanup, Issue #419 Pages dormant cleanup historical-only, followup-002 Pages project physical deletion remains separate |

### UT-17 follow-up 004 — Cloudflare Notification Policy IaC（2026-05-14）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/ut-17-followup-004-cloudflare-notification-policy-iac/` |
| 状態 | `implementation_complete / implementation / NON_VISUAL / runtime Cloudflare mutation pending_user_approval` |
| scope | Cloudflare Notification Policy 4 categories / 5 policy files + webhook destination 1 件を IaC 化済み。Cloudflare apply は user-gated |
| command contract | `bash scripts/cf.sh alerts {apply,diff,list}`（implemented。Cloudflare update は `PUT`） |
| token contract | apply=`CLOUDFLARE_ALERTS_TOKEN_APPLY` / read=`CLOUDFLARE_ALERTS_TOKEN_READ` / URL drift=`CLOUDFLARE_ALERT_RELAY_URL` |
| webhook definition root | `infra/cloudflare-alerts/webhooks/` |
| parent | `docs/30-workflows/ut-17-cloudflare-analytics-alerts/` |
| user gate | Cloudflare token placement / Cloudflare mutation / commit / push / PR |


### task-18-FU Full Visual Regression Suite（2026-05-14）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/task-18-fu-full-visual-regression-suite/` |
| 状態 | `implemented_local_runtime_pending / implementation / VISUAL` |
| upstream | `docs/30-workflows/completed-tasks/task-18-w7-verify-tokens-and-playwright-smoke/` |
| route contract | W7 17 URL set: public 6 / member 2 / admin 8 / not-found 1 |
| target visual scope | 17 routes x desktop/tablet/mobile = 51 baselines |
| artifact inventory | `references/workflow-task-18-fu-full-visual-regression-suite-artifact-inventory.md` |
| baseline boundary | baseline-missing CI fail is not acceptable for required checks; 51 baselines must be present before required-check promotion |
| user gate | baseline update approval, commit, push, PR |

### UI prototype alignment / MVP recovery task-23 verification status matrix（2026-05-14）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/task-23-ui-mvp-w8-par-verification-status-matrix/` |
| 状態 | `implemented_local_evidence_captured / docs-only / NON_VISUAL / Phase 13 blocked_pending_user_approval` |
| parent workflow | `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/` |
| generated deliverable | `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/VERIFICATION-STATUS.md` |
| evidence boundary | Phase 5/7/9 deterministic matrix evidence, root/output artifacts parity, Phase 11 NON_VISUAL marker, Phase 12 strict 7 present, documentation-changelog entry checklist + validator execution log |
| lessons-learned | `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-task-23-docs-only-final-deliverable-state-gate-2026-05.md` |
| downstream | `docs/30-workflows/task-27-ui-mvp-w9-solo-mvp-3-layer-task-mapping/` can use the generated `VERIFICATION-STATUS.md` |
| user gate | commit / push / PR |

### Issue #622 Packages Test Suffix Rename（2026-05-11）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-622-packages-test-suffix-rename/` |
| 状態 | `implemented-local / implementation / NON_VISUAL / rename-only / local-evidence-partial` |
| source | `docs/30-workflows/completed-tasks/task-issue-325-followup-002-packages-test-suffix-rename.md` |
| upstream | #325 apps/api rename, #621 apps/web rename |
| downstream | #623 / `docs/30-workflows/unassigned-task/task-issue-325-followup-003-vitest-spec-suffix-convergence.md` |
| implementation targets | `packages/shared` 17 test files, `packages/integrations` and `packages/integrations-google` 11 test files, package ADR files |
| evidence | `outputs/phase-05/rename-mapping.csv`, `outputs/phase-11/main.md`, `outputs/phase-11/evidence/`, `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| focused tests | `@ubm-hyogo/shared`, `@ubm-hyogo/integrations`, `@ubm-hyogo/integrations-google` |
| issue wording | Issue body 26 files is stale; implementation uses current measured 28 files. PR uses `Closes #622`; `Refs #325`, `Refs #621`, `Refs #623` |
| lessons-learned | `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-issue-622-packages-test-suffix-rename-2026-05.md`（Issue body と実測の乖離 / `local-evidence-partial` 採用 / `apps/api/tsconfig.build.json` exclude pattern / Phase-12 strict 7 と artifacts.json の SSOT 関係） |
| changelog | `.claude/skills/aiworkflow-requirements/changelog/20260511-issue622-packages-test-suffix-rename-spec.md` |

### Issue #590 Phase 11 canonical evidence paths（2026-05-10）

### Issue #589 Gate Metadata Structured Ledger（2026-05-10）

### E2E Quality Uplift Stage 3 — branch protection desired-state manifest land（Issue #608 / 2026-05-12）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/e2e-quality-uplift-stage-3/` |
| 状態 | `implemented_local_runtime_pending / implementation / NON_VISUAL`（Phase 12 strict 7 PASS / apply+verify evidence captured） |
| desired contexts manifest | `.github/branch-protection/{dev,main}.json`（`ci`, `Validate Build`, `coverage-gate`, `lighthouse-ci`, `e2e-tests-coverage-gate` のみを宣言。PUT body 全体ではない） |
| adapter | `.github/branch-protection/apply.sh`（fresh GET → contexts/strict 差し替え → CLAUDE.md 不変条件正規化 → optional fields は fresh 値保持） |
| verifier | `scripts/verify-branch-protection.sh`（read-only drift gate / 契約: 最終行 `OK(<branch>): no drift`） |
| INV 正規化対象 | INV-SOLO (`required_pull_request_reviews=null`) / INV-ENF (`enforce_admins=true`) / INV-LINEAR (`required_linear_history=true`) / INV-LOCK (`lock_branch=false`) |
| lighthouse readiness | `.github/workflows/lighthouse.yml`（`nohup pnpm --filter @ubm-hyogo/web start` + `pnpm dlx wait-on -t 120000 http-get://localhost:3000` / `pull_request.branches=[dev,main]` + `workflow_dispatch`） |
| canonical reference | `references/branch-protection-desired-state-manifest.md` |
| 関連 lessons | `lessons-learned/lessons-learned-e2e-quality-uplift-stages-2026-05.md` L-E2EQU-S3A-001..003 |
| operational SSOT | GitHub branch protection fresh GET（`gh api repos/daishiman/UBM-Hyogo/branches/{dev,main}/protection`） |
| user gate | PR creation / `gh pr checks` required-context 表示 / Lighthouse workflow run / commit / push / PR |

### Wait-on readiness pattern（CI server startup）

| 目的 | 内容 |
| --- | --- |
| 適用先 | 外部サーバ起動を待つ CI step（Lighthouse / smoke / E2E） |
| 起動 | `nohup pnpm --filter <app> start > /tmp/<app>-server.log 2>&1 &` + `echo $! > /tmp/<app>-server.pid` |
| 待機 | `pnpm dlx wait-on -t 120000 http-get://localhost:<port>`（`npx` は L-E2EQU-011 により禁止） |
| 利点 | exit code / timeout / cleanup を構造担保。手作り retry loop の二重起動・SIGTERM 漏れを排除 |
| 関連 | `references/quality-e2e-testing.md`「lighthouse-ci の readiness pattern」/ L-E2EQU-S3A-003 |

---

### Issue #603 phase-12 compliance-check CI gate（2026-05-11）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/issue-603-phase12-compliance-check-ci-gate/` |
| 状態 | `implemented_local_runtime_pending / implementation / NON_VISUAL` |
| CI gate | `.github/workflows/verify-phase12-compliance.yml` |
| script | `scripts/verify-phase12-compliance.ts` |
| canonical headings | `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md` Required Sections 9 項目 |
| focused test | `scripts/__tests__/verify-phase12-compliance.test.ts` |
| artifact inventory | `references/workflow-issue-603-phase12-compliance-check-ci-gate-artifact-inventory.md` |
| source task | `task-spec-skill-compliance-check-ci-gate` consumed/promoted |

### UI prototype alignment / MVP recovery task-16 admin tags meetings requests（2026-05-10）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/task-16-admin-tags-meetings-requests/` |
| 状態 | `implemented-local / implementation / VISUAL_ON_EXECUTION / IMPLEMENTED_LOCAL_RUNTIME_PENDING` |
| route scope | `/admin/tags`, `/admin/meetings`, `/admin/requests` |
| implementation targets | `apps/web/app/(admin)/admin/{tags,meetings,requests}/page.tsx`, `apps/web/src/components/admin/{TagQueuePanel,MeetingPanel,RequestQueuePanel}.tsx`, `apps/web/src/lib/admin/{api,server-fetch}.ts` |
| API boundary | Existing admin endpoints only: `/admin/tags/queue`, `/admin/tags/queue/:queueId/resolve`, `/admin/meetings`, `/admin/meetings/:id`, `/admin/meetings/:id/attendances`, `/admin/requests`, `/admin/requests/:noteId/resolve` |
| corrected drift | Stale `apps/web/src/app`, `src/features/admin`, `adminClient`, `/decision`, and `approved` wording removed from normative task-16 contract |
| evidence | `outputs/phase-11/main.md`, `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-task-16-admin-tags-meetings-requests-artifact-inventory.md` |
| user gate | runtime screenshots / staging smoke / commit / push / PR |

### Issue #630 authenticated /profile LHCI a11y（2026-05-13）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/issue-630-authenticated-profile-lhci-a11y/` |
| 状態 | `implemented-local-runtime-pending / implementation / NON_VISUAL` |
| issue state | #630 CLOSED at `2026-05-12T06:26:21Z`; use `Refs #630` |
| route scope | `/profile` |
| auth contract | `signSessionJwt(AUTH_SECRET, { memberId, email, isAdmin: false, ttlSeconds: 3600 })` |
| cookie | `authjs.session-token` for `localhost` |
| implementation targets | `apps/web/scripts/lhci-auth-storage.ts`, `apps/web/scripts/lhci-profile-mock-api.ts`, `apps/web/lhci/lhci-auth.cjs`, `lighthouserc.authenticated.json`, `.github/workflows/lighthouse.yml`, `lighthouserc.json` |
| evidence | `outputs/phase-12/phase12-task-spec-compliance-check.md`; CI LHCI artifacts pending user-approved PR run |
| lessons-learned | `.claude/skills/aiworkflow-requirements/references/lessons-learned-issue-630-authenticated-profile-lhci-a11y-2026-05.md` |
| user gate | GitHub Secret mutation / runtime LHCI / commit / push / PR |

### UI prototype alignment / MVP recovery task-14 my profile and requests（2026-05-10）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/task-14-my-profile-and-requests/` |
| 状態 | `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING / implementation / VISUAL_ON_EXECUTION / IMPLEMENTED_LOCAL_RUNTIME_PENDING` |
| route scope | `/profile` |
| implementation targets | `apps/web/app/profile/page.tsx`, `apps/web/app/profile/_components/*` |
| UI contract | `PublicVisibilityBanner`, `StatusSummary`, `RequestActionPanel`, `VisibilityRequestDialog`, `DeleteRequestDialog` |
| selector contract | `public-visibility-banner`, `status-summary`, `request-action-panel`, `visibility-request-dialog`, `delete-request-dialog` |
| API boundary | Existing `/me` self-service API only; no task-14 changes to `apps/api/src/routes/me/*` or new `apps/web/app/api/me/*` handlers |
| evidence | `outputs/phase-11/manifest.md`, `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-task-14-my-profile-and-requests-artifact-inventory.md` |
| user gate | authenticated screenshots / staging smoke / production smoke / commit / push / PR |

### UI prototype alignment / MVP recovery task-13 login rebuild（2026-05-09）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/task-13-login-rebuild/` |
| 状態 | `implemented-local / implementation / VISUAL_ON_EXECUTION / IMPLEMENTED_LOCAL_RUNTIME_PENDING` |
| route scope | `/login` |
| implementation targets | `apps/web/app/login/page.tsx`, `apps/web/app/login/_components/{LoginPanel.client,LoginCard,LoginStatus,MagicLinkForm.client,GoogleOAuthButton.client}.tsx`, `apps/web/src/lib/url/login-query.ts`, `apps/web/playwright/tests/login-smoke.spec.ts` |
| UI contract | 5 core states (`input / sent / unregistered / deleted / error`) + `rules_declined` derived state + `gate=admin_required` overlay |
| locator contract | `data-testid="login-card"` + `data-state="<LoginGateState>"` |
| a11y contract | `deleted` / `error` / `rules_declined` are `role="alert"` |
| API boundary | Auth.js + Magic Link API surface unchanged; `apps/web/app/api/auth/*` diff must remain 0 |
| dependencies | task-09 / task-10 |
| downstream | task-18 regression smoke / verify-design-tokens |
| evidence boundary | Phase 12 strict 7, artifacts parity, apps/web implementation, focused tests, and local screenshot evidence are present. Staging smoke, production-equivalent runtime evidence, commit, push, and PR remain user-gated |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-task-13-login-rebuild-artifact-inventory.md` |

### CI Pipeline Recovery Web CD And Runtime Smoke（2026-05-09）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/` |
| 状態 | `implemented-local-runtime-pending / implementation / NON_VISUAL` |
| web deploy | `.github/workflows/web-cd.yml` uses `build:cloudflare` + `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging|production` |
| web deploy secret | `.github/workflows/web-cd.yml` maps environment-scoped `secrets.CLOUDFLARE_API_TOKEN` into step-scoped env only for verify/deploy steps. `CLOUDFLARE_API_TOKEN` must not appear in job-level env or install/build steps. |
| Issue #640 step-scoped CF token cutover | `docs/30-workflows/issue-640-oidc-cf-token-cutover/`（`implemented-local-runtime-pending` / implementation / NON_VISUAL）。`web-cd.yml` and `post-release-dashboard.yml` job-level token exposure removed; `scripts/redaction-check.sh` and `scripts/__tests__/workflow-env-scope.test.sh` provide local gates. Runtime deploy evidence, OIDC full migration, legacy token revocation, commit, push, and PR are user-gated. |
| runtime smoke guard | `.github/workflows/runtime-smoke-staging.yml` Slack post runs only when `ci-evidence/summary.json` exists |
| secret provisioning | `bash scripts/smoke/provision-staging-secrets.sh` |
| web-cd staging / production secret provisioning | canonical runbooks: `docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/staging-secret-provisioning.md` and `docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/production-secret-provisioning.md`; separate from `staging-runtime-smoke`; `CLOUDFLARE_API_TOKEN` is environment-scoped web-cd deploy token, `CLOUDFLARE_ACCOUNT_ID` is Variables-managed, evidence records `op://` references only, and secret mutation / commit / push / PR are user-gated |
| Phase 12 | parent design root pending; task-01 strict outputs at `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/task-01-web-cd-secret-name-alignment/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| approval boundary | secret placement / deploy run / runtime smoke / Slack failure injection / commit / push / PR are user-gated |
| build mode 不変条件 | `apps/web` production build は `next build --webpack`。Turbopack は local dev 限定（`deployment-cloudflare-opennext-workers.md` §11.1） |
| failure cascade guard | 通知 step は `if: ${{ failure() && hashFiles('<artifact>') != '' }}` で前提 artifact を guard する（`deployment-gha.md`） |
| Environment secret 0 件問題 | smoke 起動前に `bash scripts/smoke/provision-staging-secrets.sh` + name-only inventory を必須化（`deployment-secrets-management.md`） |
| lessons-learned | `references/lessons-learned-ci-pipeline-recovery-2026-05.md`（L-CIPR-001〜006） |

### E2E quality uplift Stage 2 / 2a admin requests（2026-05-09）

| 目的 | 参照先 |
| --- | --- |
| parent workflow root | `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-2/` |
| sub-task specs | `docs/30-workflows/e2e-quality-uplift-stage-2-sub-tasks/` |
| 2a spec | `docs/30-workflows/e2e-quality-uplift-stage-2-sub-tasks/2a-admin-requests.md` |
| 2a implementation target | `apps/web/playwright/tests/admin-requests.spec.ts` |
| 状態 | `implemented-local-runtime-pass / implementation / NON_VISUAL` |
| strict outputs | `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-2/outputs/phase-12/` strict 7 files |
| evidence boundary | 2a local E2E spec and support code are implemented. Desktop Chromium E2E passed 6/6; coverage 70% / CI gate PASS remains Stage 3-owned |
| SSR fixture boundary | Server Component initial `/admin/requests` data uses `PLAYWRIGHT_ADMIN_REQUESTS_FIXTURE=1` + `NODE_ENV !== "production"` because browser `page.route()` cannot intercept SSR `fetchAdmin()` |
| downstream | `docs/30-workflows/e2e-quality-uplift-stage-3/` |

### E2E quality uplift Stage 2 / 2d contract-stage-2（2026-05-11）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/task-spec-2d-contract-stage-2/` |
| 状態 | `implemented-local-runtime-pending / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` |
| source spec | `docs/30-workflows/e2e-quality-uplift-stage-2-sub-tasks/2d-contract-stage-2.md` |
| implementation target | `apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts` |
| strict outputs | `docs/30-workflows/completed-tasks/task-spec-2d-contract-stage-2/outputs/phase-12/` strict 7 files |
| evidence boundary | Local focused Vitest / typecheck / lint / grep gates passed. Commit / push / PR / CI runtime remain user-gated |
| fixture boundary | `MergeIdentityResponseZ` shared schema is the response shape SSOT; requests/audit response fixtures parse route-exported `AdminRequestsListResponseZ` / `AdminAuditListResponseZ` |
| artifact inventory | `references/workflow-task-spec-2d-contract-stage-2-artifact-inventory.md` |
| lessons-learned | `references/lessons-learned-task-spec-2d-contract-stage-2-2026-05.md`（L-2D-001..006: shared schema SSOT / named export 昇格 / pure unit / fixture inline / type-level 同型 / path 一括更新） |

### E2E Quality Uplift Stage 0-3（2026-05-09）

| 目的 | 参照先 |
| --- | --- |
| workflow roots | `docs/30-workflows/e2e-quality-uplift-stage-{0,1,2,3}/` |
| Stage 0 状態 | `implementation_complete_pending_pr / implementation / NON_VISUAL` (Playwright README / project filter / `evidence-capture` project / logged-in spec split / quality-gate exception) |
| Stage 1 状態 | `implemented_local / implementation_complete_e2e_verification_recorded / NON_VISUAL`（auth fixture HS256 JWT 署名・server fetch mock API・tracked `.txt` evidence） |
| Stage 2 状態 | `spec_verified_pending_dependency / docs-only spec / NON_VISUAL`（tier-aware coverage 自動 enforcement: critical ≥80% / standard ≥70% / experimental ≥50%） |
| Stage 3 状態 | `implemented-local-runtime-pending / implementation / NON_VISUAL`（branch protection desired contexts: CI / Lighthouse / e2e-tests-coverage-gate、local execution root `docs/30-workflows/e2e-quality-uplift-stage-3/`） |
| evidence boundary | Stage 0/1 は tracked runtime evidence。Stage 2 は placeholder evidence。Stage 3 は branch protection PUT + verify evidence captured、PR CI required 表示 / Lighthouse run / commit / push / PR は user-gated |
| tier policy 正本 | `.claude/skills/task-specification-creator/references/coverage-standards.md` + `quality-gates.md §7.1 (4)` (`evidence-capture` project 例外条項) |
| artifact inventory | `references/workflow-e2e-quality-uplift-stage-0-3-artifact-inventory.md`（4 stage 責務分割表 / Phase 11 evidence kind matrix / tier policy 表） |
| lessons-learned | `lessons-learned/lessons-learned-e2e-quality-uplift-stages-2026-05.md`（L-E2EQU-001..007 + 002A: Server Component fetch は browser route mock で検証不可） |
| changelog | `changelog/20260509-e2e-quality-uplift-stage0-3.md` |
| Phase 12 strict 7 | 4 stage 全てに present（main / implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check） |
| user gate | runtime tier enforcement / PR CI required 表示 / Lighthouse run / commit / push / PR は user approval 後 |


### UI prototype alignment / MVP recovery task-05 error boundary and staging smoke（2026-05-09）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/task-05-error-boundary-and-staging-smoke/` |
| 状態 | `implemented-local / implementation / runtime evidence pending_user_approval / VISUAL_ON_EXECUTION / IMPLEMENTED_LOCAL_RUNTIME_PENDING` |
| route SSOT | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/specs/staging-smoke-checklist.md`（19 routes） |
| implementation targets | `apps/web/app/{error,global-error,not-found,loading}.tsx` |
| e2e target | `apps/web/tests/e2e/staging-smoke.spec.ts` |
| fixture safety | `ENABLE_STAGING_SMOKE_FIXTURE=1`; `NODE_ENV` による staging fixture 制御は禁止 |
| command | `ENABLE_STAGING_SMOKE_FIXTURE=1 mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test tests/e2e/staging-smoke.spec.ts --project=staging-smoke` |
| evidence boundary | runtime deploy / Playwright smoke / Sentry dashboard は user approval 後。Phase 12 strict 7 と artifacts parity は作成済み |
| artifact inventory | `references/workflow-task-05-error-boundary-and-staging-smoke-artifact-inventory.md` |

### Issue #547 Cloudflare Audit Logs Redacted Feature Export（2026-05-08）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/issue-547-cf-audit-logs-redacted-production-feature-export/` |
| 状態 | `implemented_local_runtime_pending / implementation / NON_VISUAL / IMPLEMENTED_LOCAL_RUNTIME_PENDING` |
| CLI | `scripts/cf.sh audit-log feature-export` |
| implementation | `scripts/cf-audit-log/feature-export.ts`, `scripts/cf-audit-log/feature-export/schema-validation.ts`, `scripts/cf-audit-log/feature-export/manifest.ts` |
| D1 boundary | `readEventsForFeatureExport()` returns `AuditLogEvent[]`; `raw_json` does not cross module boundary |
| evidence | `outputs/phase-11/main.md`, `fixture-exported-features.jsonl`, `fixture-export-manifest.json`, `secret-leakage-grep.log`, `schema-validation.log` |
| production gate | `outputs/phase-11/production-pending-user-gate.md`; production export is `PENDING_RUNTIME_EVIDENCE` until approval |
| PR wording | Issue #547 is CLOSED; use `Refs #547` only |

### Issue #532 Write/Tag/Note Provider ctx Injection（2026-05-08）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-532-extend-ctx-injection-to-write-tag-note-providers/` |
| 状態 | `implemented-local / implementation / NON_VISUAL / local command evidence recorded / Phase 13 pending_user_approval` |
| parent | `docs/30-workflows/completed-tasks/issue-371-ut-02a-followup-003-hono-ctx-di-migration/` |
| provider set | `adminNotesProvider`, `auditLogProvider`, `notificationOutboxProvider`, `tagDefinitionsProvider`, `tagQueueProvider`, `memberTagsProvider` |
| boundary | D1 schema / public response shape / Auth.js admin gate unchanged |
| route write consolidation | `/admin/requests` guarded note/status/audit batch is owned by `adminNotesProvider.resolveRequestAtomic()` |
| scheduled path | Hono `c.var` is route-only; scheduled workflows use explicit provider bundle |
| evidence | `outputs/phase-11/evidence/{typecheck,lint,focused-tests,grep-direct-import,grep-fallback,coverage-guard}.log`, `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| artifact inventory | `references/workflow-issue-532-write-tag-note-provider-ctx-injection-artifact-inventory.md` |
| lessons | `references/lessons-learned-issue-532-write-tag-note-provider-ctx-injection-2026-05.md` |
| Issue 取扱 | Issue #532 CLOSED 維持。PR 文脈は `Refs #532` のみ |
| user gate | commit / push / PR は user approval 後のみ |

### Issue #526 CI actionlint / shellcheck gate（2026-05-08）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/governance/issue-526-ci-actionlint-shellcheck-gate/` |
| 状態 | `implemented-local / implementation / NON_VISUAL / IMPLEMENTED_LOCAL_RUNTIME_PENDING / Phase 13 pending_user_approval` |
| CI owner | `.github/workflows/ci.yml` |
| dedicated job | `workflow-shell-lint` |
| required context path | 既存 required context `ci` 内で `pnpm observation:lint` を実行 |
| local command | `pnpm observation:lint` |
| lint対象 | `.github/workflows/post-release-observation-reminder.yml`, `.github/workflows/ci.yml`, `scripts/observation/*.sh`, `scripts/observation/test/*.sh` |
| source unassigned | `docs/30-workflows/completed-tasks/ut-350-fu-01-ci-actionlint-shellcheck-gate.md` consumed |
| 正本 refs | `references/deployment-gha.md`, `references/post-release-long-term-observation.md`, `references/task-workflow-active.md` |
| inventory | `references/workflow-issue-526-ci-actionlint-shellcheck-gate-artifact-inventory.md` |
| lessons | `references/lessons-learned-issue-526-ci-actionlint-shellcheck-gate-2026-05.md` |
| 境界 | reminder workflow の schedule / workflow_dispatch / Issue 作成副作用は変更しない。runtime CI evidence、branch protection PUT、commit / push / PR は user approval 後 |

### Issue #520 Slack Incident Channel Webhook Provisioning（2026-05-07）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/issue-520-slack-incidents-channel-webhook-provisioning/` |
| 状態 | `implemented-local / implementation / NON_VISUAL / IMPLEMENTED_LOCAL_RUNTIME_PENDING` |
| channel SSOT | `#ubm-hyogo-incidents` |
| secret SSOT | `SLACK_WEBHOOK_INCIDENT` |
| 1Password 正本 | `op://Employee/ubm-hyogo-env/SLACK_WEBHOOK_INCIDENT_<ENV>` |
| runbook | `docs/30-workflows/runbooks/slack-incidents-channel-provisioning.md` |
| redaction gate | `bash scripts/redaction-grep.sh .` |
| blocks | Issue #495 Phase 11 runtime smoke / 09c production readiness observability gate |
| boundary | Slack / 1Password / Cloudflare / GitHub / smoke / commit / push / PR は user approval 後のみ |

### UI prototype alignment / MVP recovery task-20 screen blueprints public/member（2026-05-07）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/task-20-w2-screen-blueprints-public-and-member/` |
| 状態 | `implemented-local / docs-only / NON_VISUAL / Phase 13 blocked_pending_user_approval` |
| 実 docs 正本 | `docs/00-getting-started-manual/specs/09e-screen-blueprints-public.md`, `docs/00-getting-started-manual/specs/09f-screen-blueprints-member.md` |
| scope | 公開 6 routes + 会員 2 routes の screen blueprint。コード変更なし |
| API 境界 | 既存 `/public/*`, `/auth/*`, `/me/*` endpoint のみ。新 endpoint / D1 schema 変更なし |
| visual gate | fenced JSX prototype 転記を除く仕様本文で visual literal 0。凍結 prototype 一字一句転記を優先 |
| downstream | task-11 / task-12 / task-13 / task-14 / task-06 |
| evidence | `outputs/phase-11/main.md`, `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| boundary | commit / push / PR は user approval 後 |

### UI prototype alignment / MVP recovery task-02 wrangler env injection（2026-05-07）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/task-02-w2-wrangler-env-injection/` |
| 状態 | `implemented-local / implementation / NON_VISUAL / IMPLEMENTED_LOCAL_RUNTIME_PENDING / Phase 13 pending_user_approval` |
| 実装正本 | `apps/web/wrangler.toml`, `apps/web/.dev.vars.example`, `apps/web/src/lib/env.ts`, `apps/web/src/lib/__tests__/env.test.ts` |
| env contract | `[vars]` / `[env.staging.vars]` / `[env.production.vars]` に `ENVIRONMENT`, `NEXT_PUBLIC_API_BASE_URL`, `PUBLIC_API_BASE_URL`, `INTERNAL_API_BASE_URL`, `AUTH_URL`, `SENTRY_ENVIRONMENT`, `SENTRY_TRACES_SAMPLE_RATE` を配置 |
| secret boundary | `SENTRY_DSN_WEB` / `AUTH_SECRET` は Cloudflare Secrets / 1Password 正本。`wrangler.toml` に値を書かない |
| downstream | task-03 は `SENTRY_*`、task-04/05/18 は `getEnv()` / grep gate を利用 |
| evidence | `outputs/phase-12/phase12-task-spec-compliance-check.md`。Cloudflare dry-run / secret put / commit / push / PR は user approval 後 |
| lessons | `references/lessons-learned-task-02-w2-wrangler-env-injection-2026-05.md`（L-T02W2-001..005: getEnv() 単一窓口 / zod throw を error.tsx に委譲 / public env schema 分離 / vars vs Secrets 境界 / NON_VISUAL platform evidence 5 点） |

### UI prototype alignment / MVP recovery scope gate（2026-05-07）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/task-01-w1-solo-scope-gate-all-screens/` |
| 状態 | `spec_created / docs-only / NON_VISUAL / Phase 1-12 completed / Phase 13 blocked_pending_user_approval` |
| scope SSOT | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` |
| 実行順 | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/EXECUTION-ORDER.md` |
| routes | 19 routes（公開 6 / 会員 2 / 管理 8 / 共通 3） |
| API 境界 | 既存 `apps/api/src/routes/` endpoint のみ接続。新 endpoint / D1 schema / Google Form 変更は禁止 |
| design boundary | OKLch token 正本化、task-10 primitive set 内で画面を構成、apps/web direct D1 access 禁止 |
| downstream | task-02..22 は `SCOPE.md §6` の diff scope discipline / archive rule を完了前に確認 |
| archive hygiene | 5 dir は `docs/30-workflows/completed-tasks/` へ archive。純削除 blocker は解消済み |
| evidence | `outputs/phase-11/manual-smoke-log.md`, `outputs/phase-12/phase12-task-spec-compliance-check.md` |

### UI prototype alignment / MVP recovery task-10 UI primitives（2026-05-09）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/task-10-ui-primitives-spec/` |
| 状態 | `runtime-evidence-captured / implementation / VISUAL_ON_EXECUTION / existing-ui-integration` |
| current baseline | `apps/web/src/components/ui/index.ts` の PascalCase barrel export |
| 方針 | Wave 0 の 15 primitive を削除せず、task-10 の 11 primitive contract を統合 |
| 既存拡張 | `Button / Avatar / Field / Input / Select` |
| 新規追加 | `Card / Badge / Sidebar / Stat / EmptyState / Banner` |
| 維持 | `Chip / Switch / Segmented / Textarea / Search / Drawer / Modal / Toast / KVList / LinkPills` |
| local evidence | typecheck / lint / focused test / coverage / next build PASS |
| blocker | 解消済み。follow-up 001 で `pnpm.overrides.esbuild = 0.25.4` により `build:cloudflare` PASS |
| downstream | task-11..17 は `@/components/ui` から import |
| evidence | `outputs/phase-12/phase12-task-spec-compliance-check.md`、`outputs/phase-11/evidence/screenshots/task10-ui-primitives-runtime.png`、`outputs/phase-11/evidence/axe-report.json` |
| follow-up 001 | `docs/30-workflows/task-10-followup-001-opennext-esbuild-mismatch/`、`references/workflow-task-10-followup-001-opennext-esbuild-mismatch-artifact-inventory.md`、`lessons-learned/lessons-learned-task-10-followup-001-opennext-esbuild-mismatch-2026-05.md` |
| follow-up 002 | `docs/30-workflows/task-10-followup-002-runtime-visual-axe-evidence/`、`lessons-learned/lessons-learned-task-10-followup-002-runtime-visual-axe-evidence-2026-05.md`（L-T10FU002-001 VISUAL_ON_EXECUTION 2 段 workflow_state / -002 親 evidence 集約 / -003 axe DOM 構造） |
| 苦戦箇所 | `lessons-learned/lessons-learned-task-10-ui-primitives-2026-05.md`（L-T10-001 OpenNext esbuild mismatch / L-T10-002 C/M/R + barrel owner / L-T10-003 VISUAL_ON_EXECUTION local↔runtime 分離 / L-T10-004 lint.log capture header） |
| changelog | `.claude/skills/aiworkflow-requirements/changelog/20260511-task-10-runtime-evidence-captured.md`、`.claude/skills/aiworkflow-requirements/changelog/20260511-task-10-followup-001-opennext-esbuild-mismatch.md` |

### E2E quality uplift Stage 2 sub-task 2b admin identity conflicts spec（2026-05-09）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/2b-admin-identity-conflicts-spec/` |
| 状態 | `runtime_pending / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING / Phase 12 completed` |
| primary implementation file | `apps/web/playwright/tests/admin-identity-conflicts.spec.ts` |
| parent | `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-2/` |
| source spec | `docs/30-workflows/e2e-quality-uplift-stage-2-sub-tasks/2b-admin-identity-conflicts.md` |
| source unassigned | `docs/30-workflows/unassigned-task/e2e-stage-2-2b-admin-identity-conflicts-001.md`（formalized trace） |
| mock boundary | initial list is server-side `fetchAdmin()` and uses `PLAYWRIGHT_ADMIN_IDENTITY_CONFLICTS_FIXTURE=1`; browser `page.route()` is only for `/api/admin/identity-conflicts/*/{merge,dismiss}` and negative `/api/admin/members/*` observation |
| schema | `IdentityConflictRowZ` uses `conflictId`, `candidateTargetMemberId`, `matchedFields`, `detectedAt`, `responseEmailMasked`, `syncJobId` |
| auth fixture | import `test` / `expect` from `apps/web/playwright/fixtures/auth.ts`; do not named-import `adminPage` |
| evidence | `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| runtime gate | local chromium Phase 11 evidence captured; firefox / webkit / staging / CI, commit, push, PR are user-gated |

### E2E quality uplift Stage 2 sub-task 2c admin member delete spec（2026-05-10）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/admin-member-delete-e2e-spec/` |
| 状態 | `implemented-local-runtime-pending / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING / Phase 12 completed` |
| primary implementation file | `apps/web/playwright/tests/admin-member-delete.spec.ts` |
| source spec | `docs/30-workflows/e2e-quality-uplift-stage-2-sub-tasks/2c-admin-member-delete.md` |
| source unassigned | `docs/30-workflows/unassigned-task/e2e-stage-2-2c-admin-member-delete-001.md`（consumed trace） |
| mock boundary | initial members/audit are server-side `fetchAdmin()` and use `PLAYWRIGHT_ADMIN_MEMBER_DELETE_FIXTURE=1`; browser `page.route()` is only for drawer detail and delete mutation |
| UI reflection | delete/restore mutation passes `{ memberId, isDeleted }` from `MemberDrawer` to `MembersClient`; row label updates before `router.refresh()` completes |
| evidence | `outputs/phase-11/evidence/e2e-run.txt` = desktop-chromium 5 passed / 1 skipped |
| reusable refs | `references/workflow-admin-member-delete-e2e-spec-artifact-inventory.md`, `lessons-learned/lessons-learned-admin-member-delete-e2e-2026-05.md` |
| runtime gate | firefox / webkit / staging / CI, commit, push, PR are user-gated |

### task-21 09g Admin Screen Blueprints（2026-05-07）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/task-21-w2-par-screen-blueprints-admin/` |
| 状態 | `spec_created / docs-only / NON_VISUAL / Phase 1-12 completed / Phase 13 blocked_pending_user_approval` |
| primary spec | `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` |
| verify | `scripts/verify-09g-screen-blueprints-admin.sh` |
| scope | AdminSidebar + admin 8 routes（dashboard / members / tags / meetings / schema / requests / identity-conflicts / audit） |
| API boundary | current `references/api-endpoints.md` admin contract。旧 `/admin/kpi`、direct tag approve/reject、schema apply、identity resolve は採用しない |
| downstream | task-15 consumes §2/§3, task-16 consumes §4/§5/§7, task-17 consumes §6/§8/§9, task-22 verifies anchors |
| evidence | `outputs/phase-07/automated-checks.log`, `outputs/phase-12/phase12-task-spec-compliance-check.md` |

### UI prototype alignment task-17 admin schema-conflicts-audit（2026-05-10）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/task-17-admin-schema-conflicts-audit/` |
| 状態 | `implemented-local / implementation / VISUAL_ON_EXECUTION / local_visual_evidence_pass` |
| 実装方針 | `existing-admin-contract-hardening-with-e2e-fixture-fix`。新規 route tree ではなく既存 admin route/component/helper の不足補強 |
| route 正本 | `apps/web/app/(admin)/admin/schema/page.tsx`, `apps/web/app/(admin)/admin/identity-conflicts/page.tsx`, `apps/web/app/(admin)/admin/audit/page.tsx` |
| component 正本 | `apps/web/src/components/admin/SchemaDiffPanel.tsx`, `apps/web/src/components/admin/IdentityConflictRow.tsx`, `apps/web/src/components/admin/AuditLogPanel.tsx` |
| helper 正本 | `apps/web/src/lib/admin/api.ts`, `apps/web/src/lib/admin/server-fetch.ts` |
| API 境界 | 既存 `apps/api/src/routes/admin/{schema,sync-schema,identity-conflicts,audit}.ts` のみ。新 endpoint / D1 schema 追加なし |
| downstream | task-18 Playwright smoke / design-token / a11y regression |
| evidence | `docs/30-workflows/completed-tasks/task-17-admin-schema-conflicts-audit/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| lessons-learned | `.claude/skills/aiworkflow-requirements/references/lessons-learned-task-17-admin-schema-conflicts-audit-2026-05.md`（L-TASK17-001 Server Component fixture / 002 artifacts.json parity / 003 existing-UI inventory / 004 AUTH_SECRET override 禁止） |

### UI prototype alignment task-21 Admin Blueprint 09g（2026-05-07）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/task-21-w2-screen-blueprints-admin/` |
| 状態 | `spec_created / docs-only / NON_VISUAL / Phase 1-12 completed / Phase 13 blocked_pending_user_approval` |
| blueprint 正本 | `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` |
| 対象 | admin 8 routes + AdminSidebar contract。既存補助 route `/admin/dashboard/attendance` は削除しない |
| source | `docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx`, `docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-3/phase-3.md` |
| evidence | `outputs/phase-11/main.md`, `outputs/phase-11/manual-smoke-log.md`, `outputs/phase-11/link-checklist.md`, `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| downstream | task-15 / task-16 / task-17 admin implementation |
| 境界 | apps/packages code 変更なし。既存 admin API endpoint surface のみ参照。screenshot 不要 |

### UI prototype alignment / task-19 09c primitives full spec（2026-05-07）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/task-19-w2-primitives-full-spec/` |
| 状態 | `spec_created / docs-only / NON_VISUAL / Phase 1-12 completed / Phase 13 blocked_pending_user_approval` |
| primary spec | `docs/00-getting-started-manual/specs/09c-primitives.md` |
| source | `docs/00-getting-started-manual/claude-design-prototype/primitives.jsx` |
| validation | 600-1200 lines、17 JSX excerpts、HEX / `oklch()` / `px` / `bg-[` grep 0、placeholder token grep 0 |
| downstream | task-06 contract index、task-10 ui-primitives、task-11..17 screens、task-20..22 blueprints |
| evidence | `outputs/phase-11/evidence/grep-gate.log`, `scripts/verify-09c-no-visual-values.sh`, `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| boundary | task-19 primary deliverable は docs-only。隣接 `apps/api/src/repository/identity-conflict.ts` diff は branch review で分離記録 |
| 苦戦箇所 | `references/lessons-learned-task19-primitives-full-spec-2026-05.md`（L-T19-001..005: placeholder token grep 必須化 / §99 keyword 二段検証 / docs-only staged path scope 検証 / prototype `export const` 1:1 照合 / verify script の Phase 1-4 雛形配置） |
| changelog | `changelog/20260507-task19-primitives-full-spec.md` |

### Task 08 W2 Design Tokens Doc（2026-05-07）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/task-08-w2-design-tokens-doc/` |
| 状態 | `spec_created / docs-only / NON_VISUAL / Phase 1-12 completed / Phase 13 blocked_pending_user_approval` |
| token SSOT | `docs/00-getting-started-manual/specs/09b-design-tokens.md` |
| source values | `docs/00-getting-started-manual/claude-design-prototype/styles.css` L1-L70 |
| scope | stone / warm / cool OKLch values、surface/text/border HEX、radius、shadow、font、spacing、motion、sRGB fallback、dark placeholder |
| naming | 正本 token は `--ubm-color-*` / `--ubm-radius-*` / `--ubm-shadow-*` / `--ubm-font-*` / `--ubm-text-*` / `--ubm-space-*` / `--ubm-dur-*` / `--ubm-ease-*`。旧 `--ubm-bg` / `--ubm-accent` は 09b 互換 mapping で置換 |
| downstream | task-09 `tokens.css` / `@theme inline`、task-10 primitives、task-18 verify-design-tokens |
| evidence | `docs/30-workflows/task-08-w2-design-tokens-doc/outputs/phase-11/main.md`, `outputs/phase-12/phase12-task-spec-compliance-check.md` |

### Task 09 W3 Tailwind v4 setup（2026-05-08）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/task-09-w3-par-tailwind-v4-setup/` |
| 状態 | `implemented-local / implementation / VISUAL_ON_EXECUTION / local PASS 5-point evidence captured / Phase 13 blocked_pending_user_approval` |
| upstream | task-08 `docs/00-getting-started-manual/specs/09b-design-tokens.md` |
| scope | `apps/web` Tailwind v4 CSS-first build pipeline、`tokens.css`、`globals.css @theme inline`、PostCSS config、token tests |
| package pins | `tailwindcss@~4.0.0`, `@tailwindcss/postcss@~4.0.0` |
| evidence boundary | generated CSS は utility probe 経由で `.bg-accent` + `var(--ubm-color-accent)` を確認済み。runtime PASS は Phase 11 local evidence として記録済み |
| downstream | task-10 primitives, task-11..17 screens, task-18 verify-design-tokens |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-task-09-w3-par-tailwind-v4-setup-artifact-inventory.md` |

### UI prototype mapping table task-07（2026-05-07）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/task-07-prototype-mapping-table/` |
| 状態 | `spec_created / docs-only / NON_VISUAL / Phase 1-12 completed / Phase 13 blocked_pending_user_approval` |
| artifact | `docs/00-getting-started-manual/specs/09a-prototype-map.md` |
| aiworkflow ref | `references/ui-ux-prototype-map.md` |
| inventory | `references/workflow-task-07-prototype-mapping-table-artifact-inventory.md` |
| 苦戦箇所 | `lessons-learned/lessons-learned-task-07-prototype-mapping-table-2026-05.md`（L-07-001..004: 逆引き目次の責務分離 / verifier による frozen JSX 保護 / 層別カウント契約 / derivation rule §5.1-§5.8 固定） |
| verifier | `scripts/verify-09a-prototype-line-ranges.sh` |
| scope | frozen prototype JSX -> production component/route/spec mapping, 19 routes, 13+ primitives, shell/chrome, 09c-09h source mapping |
| boundary | no app/package code, no token values, no props/state canon, no new primitives for missing screens |
| rejection | `TweaksPanel`, `AvatarStoreProvider`, `data-theme="warm"`, `data-theme="cool"` are `不採用` |
| downstream | task-10 uses §2/§6, task-11..17 use §3/§5, task-19..22 use §4.2 |

### UI/UX Contract Rewrite task-06（2026-05-07）

| workflow root | `docs/30-workflows/completed-tasks/task-06-ui-ux-contract-rewrite/` |
| 状態 | `implemented-local / implementation / NON_VISUAL / primary spec rewritten / Phase 13 pending_user_approval` |
| primary spec | `docs/00-getting-started-manual/specs/09-ui-ux.md` |
| 契約範囲 | 19 routes、13 primitives、feature components、page state、login 5 状態、dialog / drawer / form / live region a11y、token prefix |
| 視覚詳細委譲 | `09a-prototype-map.md`, `09b-design-tokens.md`, `09c-primitives.md`, `09d-icons.md`, `09e-screen-blueprints-public.md`, `09f-screen-blueprints-member.md`, `09g-screen-blueprints-admin.md`, `09h-shell-and-fixtures.md`, Storybook VRT |
| diff discipline | primary M: `docs/00-getting-started-manual/specs/09-ui-ux.md`; same-wave skill/index sync M; A: workflow package + aiworkflow changelog; D: なし |
| guard | `##` count 10、`### 2.` count 19+、`#### 3.1.` count 13、HEX / oklch / px / `bg-[` 0 hits、route/API trace PASS |
| downstream | task-07 / task-08 / task-09 / task-10 / task-11..17 / task-19..22 が本契約を grep 起点に参照 |

### UI prototype alignment task-03 Sentry Workers SDK unify（2026-05-07）
| workflow root | `docs/30-workflows/task-03-w2-par-sentry-workers-sdk-unify/` |
| 状態 | `implemented-local / implementation / NON_VISUAL / IMPLEMENTED_LOCAL_RUNTIME_PENDING / Phase 12 strict outputs present / Phase 13 blocked_pending_user_approval` |
| parent | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/` W2 runtime task |
| server SDK | `@sentry/cloudflare` via `apps/web/src/instrumentation.ts` |
| browser SDK | `@sentry/nextjs` via `apps/web/src/instrumentation-client.ts` |
| secret boundary | web server DSN is `SENTRY_DSN_WEB` (`op://UBM-Hyogo/Sentry Web DSN (<env>)/dsn`); browser DSN is `[vars]` `NEXT_PUBLIC_SENTRY_DSN` |
| Phase 11 boundary | `IMPLEMENTED_LOCAL_RUNTIME_PENDING`; local typecheck / tests / build / OpenNext worker grep pass, staging deploy and dashboard evidence pending user approval |
| strict evidence | `outputs/phase-11/main.md`, `outputs/phase-12/phase12-task-spec-compliance-check.md`, `outputs/phase-13/pr-creation-result.md` |
| downstream | task-04 logger and task-05 error boundary consume `captureException` / `captureMessage` contract |
### UI prototype alignment task-04 Window guard and logger（2026-05-08）
| workflow root | `docs/30-workflows/task-04-w3-window-guard-and-logger/` |
| 状態 | `implemented-local / implementation / NON_VISUAL / IMPLEMENTED_LOCAL_RUNTIME_PENDING / Phase 12 strict outputs present / Phase 13 blocked_pending_user_approval` |
| runtime guard | `apps/web/src/lib/is-browser.ts` exports `isBrowser()`, `whenBrowser()`, `browserHistory()`, `browserDocument()`; direct `window.` / `document.` runtime code is lint-gated |
| structured logger | `apps/web/src/lib/logger.ts` emits JSON one-line logs, redacts sensitive keys, and bridges `logger.error({ event, error, digest })` to task-03 `captureException` |
| ESLint gate | `apps/web/package.json` `lint` runs `tsc` + ESLint; `apps/web/eslint.config.mjs` restricts `window` / `document` outside allow-list |
| Phase 11 boundary | local typecheck / lint / tests / build / grep-gate PASS; Sentry dashboard smoke and runtime logger staging evidence pending user approval |
| strict evidence | `outputs/phase-11/evidence/{typecheck,lint,test,build,grep-gate}.log`, `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| lessons-learned | `.claude/skills/aiworkflow-requirements/references/lessons-learned-task-04-w3-window-guard-and-logger-2026-05.md`（L-T04-001..008: `init?.()` / `RUNTIME_TAG` / allow-list 同期 / `lint` false-green / `Error` redaction / `historyImpl` DI / Phase 拡張 ledger / observability swallow） |
| downstream | task-05 error boundary should call `logger.error({ event, error, digest })`; task-09..17 consume `isBrowser()` / `whenBrowser()` for remaining UI browser APIs |
### UI prototype alignment task-20 public/member screen blueprints（2026-05-07）
| workflow root | `docs/30-workflows/completed-tasks/task-20-screen-blueprints-public-and-member/` |
| public blueprint | `docs/00-getting-started-manual/specs/09e-screen-blueprints-public.md`（990 行 / section count 6） |
| member blueprint | `docs/00-getting-started-manual/specs/09f-screen-blueprints-member.md`（917 行 / section count 3） |
| endpoint surface | `SCOPE.md` §2 + 現行 `apps/api` route の AND: `GET /public/members/:memberId`, `POST /auth/magic-link`, `GET /auth/gate-state`, `GET /auth/session-resolve`, `GET /me`, `POST /me/visibility-request`, `POST /me/delete-request` |
| login state | `input / sent / unregistered / deleted / rules_declined / error` |
| legacy endpoint 撤回 | `/v1/public/*`, `/public/member-profile/:id`, `/auth/schemas`, `/auth/logout`, `/api/me`, `ruleConsent` を 09e/09f から削除 |
| docs-only NON_VISUAL lifecycle | `references/lessons-learned-docs-only-lifecycle.md`（L-DOCS-LIFECYCLE-001..005: 状態語彙固定 / endpoint surface AND 検証 / consent key grep / lifecycle model / artifacts parity） |
| changelog | `.claude/skills/aiworkflow-requirements/changelog/20260507-task-20-screen-blueprints-public-member.md` |
| 境界 | apps/packages コード変更 0。Phase 13 commit / push / PR は user approval 後のみ |
### Issue #497 Post-release Dashboard 30 Day Feedback（2026-05-06）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/` |
| 状態 | `spec_created / docs-only / NON_VISUAL / external-time-dependent / 30day gate pending` |
| 親 trace | `docs/30-workflows/completed-tasks/issue-351-09c-post-release-dashboard-automation/outputs/phase-12/unassigned-task-detection.md` U-1 |
| 対象 workflow | `.github/workflows/post-release-dashboard.yml` |
| 30 日 gate | `gh run list --workflow=post-release-dashboard.yml --limit=80 --json createdAt` の最古 run が実行日 - 30 日以前 |
| runtime evidence | `outputs/phase-11/post-release-dashboard-30d.json` と conclusion / root cause / consecutive failure / failure rate / redaction grep |
| 正本反映先 | `references/deployment-gha.md` §30 day schedule feedback contract, `changelog/20260506-issue497-30day-feedback.md` |
| 苦戦箇所 | `lessons-learned/lessons-learned-issue-497-post-release-dashboard-30day-conclusion-2026-05.md`（L-497-001..004: 二相状態分離 / file-existence と runtime AC 分離 / 親契約 hardening 同サイクル / 3-fence detection model） |
| 同サイクル親 hardening | `scripts/post-release-dashboard/lib/redaction-check.sh`（`redaction-check.md` artifact 出力）, `scripts/post-release-dashboard/__tests__/redaction-check.test.sh`, `.github/workflows/ci.yml`（`pnpm post-release-dashboard:test`） |
| 境界 | screenshots 不要。Issue #497 runtime は docs-only / gate pending。親 Issue #351 automation hardening として redaction report artifact + CI script test を同 cycle で補正。Issue #497 は CLOSED 維持し、PR 文面は `Refs #497, Refs #351` |

---

### U-FIX-CF-ACCT-01-DERIV-01 GitHub OIDC short-lived credentials（2026-05-06）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/u-fix-cf-acct-01-deriv-01-github-oidc-short-lived-credentials/` |
| 状態 | `implemented-local / implementation / runtime evidence pending_user_approval / NON_VISUAL / Phase 12 strict outputs present / runtime evidence pending_user_approval` |
| primary IdP | AWS STS（GitHub OIDC federation） |
| workflow inventory | `.github/workflows/web-cd.yml`, `.github/workflows/backend-ci.yml`, `.github/workflows/d1-migration-verify.yml` |
| current token references | `backend-ci.yml` still uses `CLOUDFLARE_API_TOKEN` and `d1-migration-verify.yml` still uses `CLOUDFLARE_API_TOKEN_STAGING` until their runtime cutover. `web-cd.yml` uses environment-scoped `CLOUDFLARE_API_TOKEN` after task-01 web-cd secret alignment. |
| approval gates | G1 trust policy / G2 staging cutover / G3 production cutover / G4 long-lived token revoke |
| close-out evidence | `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| runtime evidence | `outputs/phase-11/main.md` + `manual-smoke-log.md` + `link-checklist.md` are RUNTIME_PENDING placeholder ledgers. deploy / revoke are未実行 |
| 正本 refs | `references/deployment-gha.md`, `references/deployment-secrets-management.md`, `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` |

---

### Issue #401 Admin Request Notification（2026-05-06）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-401-admin-request-notification/` |
| 状態 | `implemented-local / implementation / NON_VISUAL / Phase 1-12 completed / Phase 11 runtime evidence pending / Phase 13 blocked_until_user_approval` |
| API | `POST /admin/requests/:noteId/resolve` 後に `notification_outbox` へ best-effort enqueue |
| DB | `notification_outbox`, `notification_ledger`(migration `0014_notification_outbox.sql`) |
| mail env | `MAIL_PROVIDER_KEY` / `MAIL_FROM_ADDRESS`（旧 `RESEND_API_KEY` / `RESEND_FROM_EMAIL` は使わない） |
| mail config gate | `MAIL_PROVIDER_KEY` missing / `.example` sender は claim 前に dispatch skip |
| retry | retryable failure は `pending` 復帰。`failed` は ledger event only |
| stuck recovery | stale `dispatching` rows are reclaimed after lease timeout |
| recipient | `member_identities.response_email` |
| PII boundary | raw `resolutionNote` is not copied to email / `reason_summary` / ledger detail |
| close-out evidence | `docs/30-workflows/completed-tasks/issue-401-admin-request-notification/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| runtime boundary | staging D1 apply / Resend send / production migration / commit / push / PR は user approval 後 |

---


### task-05a `/public/form-preview` 503 root cause + fix（2026-05-05）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/task-05a-form-preview-503-001/` |
| 状態 | `implemented-local-runtime-evidence-blocked / implementation / NON_VISUAL / Phase 12 strict 7 files present / Phase 11 runtime evidence blocked / Phase 13 blocked_until_user_approval` |
| 対象 endpoint | staging `GET /public/form-preview`。`getLatestVersion()` null → `UBM-5500` → HTTP 503 |
| current D1 contract | `schema_versions.form_id`, `revision_id`, `state='active'`, `synced_at`; `schema_questions.revision_id` |
| runtime fact | 2026-05-05 review curl: staging 503 / production 503。D1 write / production mutation は user approval gate 後 |
| close-out evidence | `docs/30-workflows/task-05a-form-preview-503-001/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| Phase 11 evidence contract | `outputs/phase-11/main.md`, `manual-smoke-log.md`, `link-checklist.md`, `manual-test-result.md` |
| artifact inventory | `references/workflow-task-05a-form-preview-503-001-artifact-inventory.md` |
| lessons | `references/lessons-learned-05a-form-preview-503-2026-05.md` |
| 禁止事項 | response shape 変更、D1 schema 列追加、apps/web direct D1 access、production mutation、commit / push / PR |

---


### Issue #359 Out-of-Band Production D1 Apply Audit（2026-05-04）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/task-issue-359-production-d1-out-of-band-apply-audit-001/` |
| 状態 | `spec_created root / docs-only / NON_VISUAL / Phase 1-12 completed / runtime_evidence_captured / decision=confirmed / Phase 13 blocked_until_user_approval` |
| 監査対象 | production D1 `ubm-hyogo-db-prod` の `0008_schema_alias_hardening.sql` (`2026-05-01 08:21:04 UTC`) / `0008_create_schema_aliases.sql` (`2026-05-01 10:59:35 UTC`) 先行 apply |
| runtime evidence | `outputs/phase-11/` に read-only audit evidence を保存済み。`confirmed` = `backend-ci` `deploy-production` / `Apply D1 migrations`（run `25207878876`, `25211958572`） |
| CI guard | `.github/workflows/backend-ci.yml` に migration success + deploy failure を `$GITHUB_STEP_SUMMARY` へ明示する `Record post-migration deploy failure` step を追加済み |
| close-out evidence | `docs/30-workflows/task-issue-359-production-d1-out-of-band-apply-audit-001/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| artifact inventory | `references/workflow-task-issue-359-production-d1-out-of-band-apply-audit-001-artifact-inventory.md` |
| 禁止事項 | production write / additional apply / rollback / deploy / commit / push / PR / Issue state change |

---

### Issue #484 Cloudflare Analytics Monthly Export Automation（2026-05-06）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/issue-484-cloudflare-analytics-export-automation/` |
| 状態 | `implemented-local / implementation / NON_VISUAL / code evidence captured / runtime Cloudflare export pending_user_approval / Phase 13 blocked_pending_user_approval` |
| consumed source | `docs/30-workflows/completed-tasks/task-issue-347-cloudflare-analytics-export-automation-001.md` |
| parent decision | `docs/30-workflows/completed-tasks/issue-347-cloudflare-analytics-export-decision/` |
| output dir | `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11/long-term-evidence/` |
| required secrets/env | `CLOUDFLARE_ANALYTICS_API_TOKEN`, `CLOUDFLARE_ZONE_TAG`, `CLOUDFLARE_ACCOUNT_TAG` |
| persisted identifiers | `zoneTag` / `accountTag` are stored as `[redacted]`; they are GraphQL inputs only |
| metric aggregation | GraphQL groups are summed across returned buckets |
| redaction gate | email / IPv4 / bearer-token / URL query / member ID / session-cookie |
| Phase 12 compliance | `docs/30-workflows/issue-484-cloudflare-analytics-export-automation/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| runtime boundary | Cloudflare runtime export and PR creation are pending explicit implementation/runtime execution |

---

### UT-07B-FU-03 D1 Production Migration Apply Runbook（2026-05-04）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/unassigned-task/task-ut-07b-fu-03-production-migration-apply-runbook.md` |
| 実行コマンド | `bash scripts/cf.sh d1:apply-prod`（production 実適用はユーザー明示承認後のみ） |
| scripts | `scripts/d1/preflight.sh`, `scripts/d1/postcheck.sh`, `scripts/d1/evidence.sh`, `scripts/d1/apply-prod.sh`, `scripts/cf.sh` |
| CI gate | `.github/workflows/d1-migration-verify.yml` |
| artifact inventory | `references/workflow-ut-07b-fu-03-production-migration-apply-runbook-artifact-inventory.md` |
| reverse-index close-out | `docs/30-workflows/completed-tasks/ut-07b-fu-05-aiworkflow-skill-d1-runbook-reverse-index/outputs/phase-12/phase12-task-spec-compliance-check.md` |

---

### Issue #194 / 04c Identity Conflict Merge Alias（2026-05-04）

| 目的 | 参照先 |
| --- | --- |
| 実装正本 | `docs/30-workflows/completed-tasks/issue-194-03b-followup-001-email-conflict-identity-merge/` |
| 04c alias trace | `docs/30-workflows/04c-followup-001-email-conflict-merge-api-and-ui/` |
| consumed unassigned | `docs/30-workflows/unassigned-task/03b-followup-001-workflow-elevation.md`, `docs/30-workflows/unassigned-task/04c-followup-001-email-conflict-merge-api-and-ui.md` |
| 正本 tables | `identity_merge_audit`, `identity_aliases`, `identity_conflict_dismissals`, `audit_log` |
| runtime evidence | issue-194 Phase 11 / Phase 13 user approval boundary。04c alias root では screenshot / deploy / migration / PR を PASS 主張しない |
| withdrawn stale 04c draft | `identity_dismissals`, `admin_audit_log` 拡張, `sync_jobs.lock_token` 転用, `GET /admin/identity-conflicts/:id`, screenshot 3枚必須, 04c root での `gh pr create` |

---

### Issue #399 Admin Queue Resolve Staging Visual Evidence（2026-05-03）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/issue-399-admin-queue-resolve-staging-visual-evidence/` |
| 状態 | `implementation-prepared / implementation / VISUAL_ON_EXECUTION / Phase 12 strict outputs present / Phase 11 runtime evidence pending / Phase 13 blocked_until_user_approval` |
| seed識別 | D1 schema変更なし。既存ID列の `ISSUE399-` synthetic prefix で cleanup する |
| 実装artifacts | apps/api/migrations/seed/issue-399-admin-queue-staging-{seed,cleanup}.sql, scripts/staging/{seed,cleanup}-issue-399.sh, focused Vitest |
| close-out evidence | `docs/30-workflows/issue-399-admin-queue-resolve-staging-visual-evidence/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| runtime evidence | `outputs/phase-11/screenshots/` は未取得。staging seed投入 / screenshot取得 / cleanup は user承認付き実行サイクルで行う |
| parent | `docs/30-workflows/completed-tasks/04b-followup-004-admin-queue-resolve-workflow/` の delegated visual evidence gap を閉じるための実行仕様 |
| Issue 取扱 | #399 は CLOSED 維持。reopen / commit / push / PR / Issue comment は user 明示指示後のみ |

---

### UT-05A Auth UI Logout Button（2026-05-03）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/ut-05a-auth-ui-logout-button-001/` |
| 状態 | `implemented-local-runtime-evidence-blocked / implementation / VISUAL_ON_EXECUTION / Phase 12 strict outputs present / Phase 13 blocked_until_user_approval` |
| 実装 | `apps/web/src/components/auth/SignOutButton.tsx`, `apps/web/src/components/layout/MemberHeader.tsx`, `apps/web/app/profile/page.tsx`, `apps/web/app/(member)/layout.tsx`, `apps/web/src/components/layout/AdminSidebar.tsx` |
| close-out evidence | `docs/30-workflows/ut-05a-auth-ui-logout-button-001/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| runtime evidence | `outputs/phase-11/` は placeholder。OAuth visual smoke / cookie / session evidence は未取得で PASS 扱いしない |
| Issue 取扱 | #386 は CLOSED 維持。PR / comment は user 明示指示後のみ |

---

### Issue #196 response_email UNIQUE DDL / Spec Canonicalization（2026-05-02）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/issue-196-03b-followup-003-response-email-unique-ddl/` |
| 状態 | `implemented-local-static-evidence-pass / implementation / NON_VISUAL / Phase 1-12 strict outputs present / Phase 13 blocked_until_user_approval` |
| 正本 UNIQUE | `member_identities.response_email TEXT NOT NULL UNIQUE` |
| 非 UNIQUE | `member_responses.response_email` は履歴行の system field。UNIQUE を付与しない |
| close-out evidence | `docs/30-workflows/issue-196-03b-followup-003-response-email-unique-ddl/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| migration コメント方針 | `0001_init.sql` / `0005_response_sync.sql` はコメントのみ同期済み。SQL semantics は不変で、typecheck / lint / SQL semantic diff は PASS。production D1 migration list は Phase 13 承認時に取得 |
| Issue 取扱 | #196 は CLOSED 維持。PR / commit は `Refs #196` のみ |

---

### Issue #346 08a canonical workflow tree restore（2026-05-02）

| 目的 | 参照先 |
| --- | --- |
| 13 Phase 仕様 | `docs/30-workflows/issue-346-08a-canonical-workflow-tree-restore/` |
| 採用案 | A. canonical tree 復元（08a current/partial canonical root を維持し、本タスクは A restore trace） |
| 08a canonical root（維持） | `docs/30-workflows/08a-parallel-api-contract-repository-and-authorization-tests/` |
| 下流 gate | `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/` |
| close-out evidence | `docs/30-workflows/issue-346-08a-canonical-workflow-tree-restore/outputs/phase-12/main.md` |
| Phase 11 evidence | `outputs/phase-11/evidence/{file-existence.log,verify-indexes.log,aiworkflow-state-diff.log,09c-targeted-link-check.log,unassigned-grep.log,secret-hygiene.log}` |
| 苦戦箇所・教訓 | `references/lessons-learned-issue-346-08a-canonical-workflow-tree-restore-2026-05.md` |
| artifact inventory | `references/workflow-task-issue-346-08a-canonical-workflow-tree-restore-artifact-inventory.md` |
| Issue 取扱 | #346 は CLOSED at spec time。Phase 13 commit message は `Refs #346` のみ |

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

### Issue #400 Admin Request Audit Target Taxonomy（2026-05-06）

| 目的 | 参照先 |
| --- | --- |
| workflow | `docs/30-workflows/completed-tasks/issue-400-admin-request-audit-target-taxonomy/` |
| API 契約 | `references/api-endpoints.md`（04c 構造的不変条件 / request resolve audit） |
| 実装 | `apps/api/src/repository/auditLog.ts`, `apps/api/src/routes/admin/requests.ts`, `apps/api/src/routes/admin/audit.ts`, `apps/web/src/components/admin/AuditLogPanel.tsx` |
| taxonomy | 新規 request resolve audit は `targetType='admin_member_note'`, `targetId=<noteId>`, `after.memberId` を保持。legacy `member` 行は migration せず readable |
| tests | `apps/api/src/repository/__tests__/auditLog.test.ts`, `apps/api/src/routes/admin/{requests,audit}.test.ts`, `apps/web/src/components/admin/__tests__/AuditLogPanel.test.tsx` |

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
| Issue #355 cutover spec workflow | `docs/30-workflows/completed-tasks/issue-355-opennext-workers-cd-cutover-task-spec/`（spec_created / implementation / NON_VISUAL / Phase 11 evidence contracts） |
| 残る実装 task | `docs/30-workflows/unassigned-task/task-impl-opennext-workers-migration-001.md`（2026-05-09 CI recovery wave で `web-cd.yml` Workers deploy 置換は local 実装済み。残りは Cloudflare side cutover / user-approved runtime smoke evidence） |
| Pages delete after dormant (current) | `docs/30-workflows/issue-639-cloudflare-pages-project-physical-deletion/`（Issue #639 / `spec_created` / implementation / NON_VISUAL / destructive external mutation / dormant 30 day observation + Gate C user approval pending）。source: `docs/30-workflows/unassigned-task/issue-331-followup-002-cloudflare-pages-project-physical-deletion.md` consumed |
| Pages delete after dormant (historical predecessor) | `docs/30-workflows/issue-419-pages-project-dormant-delete-after-355/`（Issue #419 formalized historical runtime contract for Issue #355 era。current tracking is superseded by Issue #639）。起票元: `docs/30-workflows/unassigned-task/task-issue-355-pages-project-delete-after-dormant-001.md` |
| Delete request retention purge | `docs/30-workflows/issue-402-admin-request-retention-physical-delete/`（Issue #402 / `implemented-local` / implementation / NON_VISUAL / retention policy / runtime evidence pending）。SSOT: `references/data-retention-policy.md`。対象 table: `member_responses` / `member_identities` / `member_status` + response child rows; `deleted_members` は tombstone 保持。default `RETENTION_PURGE_MODE=dry-run`、production apply は user-gated |
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
### Issue #494 09a-A Runtime Staging Smoke（2026-05-06）

09a の `NOT_EXECUTED` 境界を実測 evidence に置換する execution-oriented successor。current execution root は issue-494 root であり、historical `09a-A-staging-deploy-smoke-execution/` root はこのブランチの実行正本ではない。deploy / D1 apply / Forms sync / Playwright visual / wrangler tail / 09c blocker update は G1〜G4 user approval 後のみ実行し、Phase 12 spec contract completeness と runtime PASS / Phase 12 runtime update を分離する。親 `09a-parallel...` directory は現 worktree 不在のため、親 mirror update は restoration follow-up 後にのみ実施する。

| 目的 | 参照先 |
| --- | --- |
| current execution root | `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/` |
| evidence root | `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/outputs/phase-11/evidence/` |
| Phase 12 compliance | `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| artifact inventory | `references/workflow-task-issue-494-09a-A-exec-staging-smoke-runtime-artifact-inventory.md` |
| parent mirror restoration follow-up | `docs/30-workflows/unassigned-task/task-09a-canonical-directory-restoration-001.md` |
| runtime exec task | `docs/30-workflows/unassigned-task/task-09a-A-exec-staging-smoke-001.md`（`UT-09A-A-EXEC-STAGING-SMOKE-001`, HIGH, G1-G4 multi-stage approval gate, 2026-05-06 formalize） |
| downstream blocker | `09c-production-deploy-execution-001` remains blocked until actual 09a-A runtime evidence exists |

---
### UT-06-FU-E D1 Backup Long-Term Storage（2026-05-01）

UT-06 Phase 12 UNASSIGNED-E を `implemented-local` / docs-only / NON_VISUAL workflow として formalize。日次 D1 export は GHA schedule を主経路、Cloudflare cron triggers を R2 latest healthcheck として併用する。R2 30日 + 月次保存、暗号化、UT-08 alert、復元机上演習を実装 PR 前の正本仕様に固定する。

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

UT-07B-FU-01 schema alias back-fill queue/cron split の current root は `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/`。状態は `implemented-local / implementation / NON_VISUAL / local implementation GO / runtime evidence pending`。Phase 10 は `design-ready` のみで、implementation GO / NO-GO / staging-deferred は `outputs/phase-11/gate-decision.md` が唯一の判定点。公開 `backfill.status` は `pending / running / exhausted / completed` に固定し、internal failure state は DB/retry metadata に閉じる。Issue #361 は CLOSED 維持、`Refs #361` のみ。苦戦箇所と適用ルールは `references/lessons-learned-ut07b-fu-01-schema-alias-backfill-queue-cron-split-2026-05.md`（L-UT07B-FU01-001 Queue dedupe 二層 / L-002 Cron 分割と CPU budget / L-003 public-internal status 値域変換 / L-004 remaining-scan 選定 / L-005 consumer dedupe 再確認 / L-006 Phase 11 gate 文言）。

UT-07B-FU-02 admin schema alias retry label の current root は `docs/30-workflows/ut-07b-fu-02-admin-schema-alias-retry-label/`。状態は `implemented-local / implementation / VISUAL_ON_EXECUTION / component evidence PASS / runtime screenshot pending`。目的は HTTP 202 + `backfill.status='exhausted'` + `retryable=true` + `code='backfill_cpu_budget_exhausted'` + `mode='apply'` を `/admin/schema` の `SchemaDiffPanel` で通常 success / validation error / conflict error と区別し、「続きから再試行できる状態」として表示すること。web client predicate は `isSchemaAliasRetryableContinuation`（`apps/web/src/lib/admin/api.ts`）で 5 点完全合致による narrowing。不一致時は generic path にフォールバックする。実装は `apps/web/src/lib/admin/api.ts` / `apps/web/src/components/admin/SchemaDiffPanel.tsx` / focused tests、JUnit evidence は `outputs/phase-11/test-junit.xml`（30 tests PASS）。API contract と D1 schema は変更しない。Issue #362 は CLOSED 維持、PR 文面は `Refs #362` のみ。苦戦箇所と適用ルールは `references/lessons-learned-ut07b-fu-02-admin-schema-alias-retry-label-2026-05.md`（L-UT07B-FU02-001 5 点 narrowing / L-002 confirmed と backfill.status の責務分離 / L-003 code 不一致 fallback / L-004 4 状態 manual screenshot deferred）。

UT-07B-FU-03 production migration apply runbook は、`apps/api/migrations/0008_schema_alias_hardening.sql` を `ubm-hyogo-db-prod` へ適用する別運用のための手順書 + 検証スクリプト実装である。workflow root は `docs/30-workflows/unassigned-task/task-ut-07b-fu-03-production-migration-apply-runbook.md`。状態は `spec_created / implemented-local / NON_VISUAL`、実装は `scripts/d1/{preflight,postcheck,evidence,apply-prod}.sh`、Cloudflare CLI ラッパー、`.github/workflows/d1-migration-verify.yml`、`pnpm test:scripts`。production apply は未実行であり正本 production 状態を上書きしない。

UT-07B-FU-04 production migration already-applied verification は、`references/database-schema.md` の production D1 ledger fact（`0008_schema_alias_hardening.sql` applied at `2026-05-01 08:21:04 UTC`）を優先し、duplicate apply を禁止する operations verification workflow である。workflow root は `docs/30-workflows/ut-07b-fu-04-production-migration-apply-execution/`。状態は `spec_created / implementation / NON_VISUAL / completed_boundary_runtime_pending / runtime verification blocked_until_user_approval`。Phase 11 は placeholder evidence、Phase 12 は strict 7 files materialized、artifact inventory は `references/workflow-ut-07b-fu-04-production-migration-apply-execution-artifact-inventory.md`。post-check scope は `schema_diff_queue.backfill_cursor` / `backfill_status` のみで、`schema_aliases` table / UNIQUE indexes は `0008_create_schema_aliases.sql` 側の責務。Issue #424 は CLOSED 維持。苦戦箇所と適用ルールは `references/lessons-learned-ut07b-fu04-production-migration-already-applied-verification-2026-05.md`（L-UT07B-FU04-001 duplicate apply 禁止 / L-002 preflight `--expect pending|applied` 二モード / L-003 post-check scope 縮約 / L-004 placeholder + user-gate runtime 分離）。

| 目的 | 参照先 |
| --- | --- |
| 正本 DB 契約 | `references/database-implementation-core.md`（§Schema Alias Resolution Contract） |
| 13 Phase 補完仕様 | `docs/30-workflows/completed-tasks/issue-191-schema-aliases-ddl-and-07b-alias-resolution-wiring/` |
| 07b stale contract 上書き | `docs/30-workflows/completed-tasks/07b-parallel-schema-diff-alias-assignment-workflow/index.md` |
| 実装 follow-up | `docs/30-workflows/unassigned-task/task-issue-191-schema-aliases-implementation-001.md` |
| fallback 廃止 follow-up | `docs/30-workflows/unassigned-task/task-issue-191-schema-questions-fallback-retirement-001.md` |
| direct update guard follow-up | `docs/30-workflows/unassigned-task/task-issue-191-direct-stable-key-update-guard-001.md` |

### UT-02A Canonical Section/Field Resolver（Issue #108 / 2026-05-01）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/ut-02a-section-field-canonical-schema-resolution/` |
| 実装 | `apps/api/src/repository/_shared/metadata.ts`, `apps/api/src/repository/_shared/builder.ts` |
| generated baseline | `apps/api/src/repository/_shared/generated/static-manifest.json` |
| shared enum | `packages/shared/src/types/common.ts`, `packages/shared/src/zod/primitives.ts` (`FieldKind=consent/system`) |
| Phase 11 NON_VISUAL evidence | `docs/30-workflows/ut-02a-section-field-canonical-schema-resolution/outputs/phase-11/` |
| Phase 12 guide | `docs/30-workflows/ut-02a-section-field-canonical-schema-resolution/outputs/phase-12/implementation-guide.md` |
| diagnostics hardening workflow | `docs/30-workflows/issue-373-ut02a-canonical-metadata-diagnostics-hardening/` |
| source follow-up | `docs/30-workflows/completed-tasks/task-ut02a-canonical-metadata-diagnostics-hardening-001.md` (`formalized_as_issue_373_workflow`) |
| lessons | `lessons-learned/lessons-learned-ut-02a-canonical-schema-resolver-2026-05.md` (L-UT02A-001〜004) |

### Issue #373 UT-02A Canonical Metadata Diagnostics Hardening（UT-02A-FU-DIAG-001 / 2026-05-06）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/issue-373-ut02a-canonical-metadata-diagnostics-hardening/` |
| 状態 | `implemented-local / Phase 11 evidence captured / Phase 12 completed / Phase 13 blocked_pending_user_approval` |
| PR本文ソース | `outputs/phase-12/implementation-guide.md` |
| static manifest stale検出 | `scripts/verify-static-manifest.mjs`（sourceSpecHash drift → exit 1 + stderr、CI gate `verify-static-manifest`） |
| 決定的再生成 | `scripts/regenerate-static-manifest.mjs`（top-level key固定順序＋sections/fields決定的整列、3連続sha256一致 DT-05 確認） |
| 構造化 diagnostics | `apps/api/src/repository/_shared/builder.ts` の `buildSectionsWithDiagnostics()` で `logWarn({code:"UBM-MANIFEST-UNKNOWN-KEY",count,stableKeys,note})` 発火 |
| 構造化ロガー | `apps/api/src/lib/logger.ts`（最小ロガー、sink 差し替え可） |
| AliasQueueAdapter contract | `apps/api/src/repository/_shared/__tests__/alias-queue-adapter.contract.test.ts`（DT-11..DT-14、D1非依存 `vi.fn()` fake） |
| retirement condition | `docs/00-getting-started-manual/specs/01-api-schema.md` §Static Manifest Retirement Condition（03a alias queue 完了後に generated manifest と CI gate を retire） |
| AC PASS 一覧 | AC-1〜AC-8（DT-01/02/05/06/07/11..14/16, builder.test.ts AC-3/AC-6, metadata.test.ts AC-4/AC-5）|
| 苦戦箇所 | source spec canonicalize↔sourceSpecHash 境界、byte-identical のための key 順序固定、D1非依存 contract 設計、retirement 条件の 03a 依存明文化 |
| lessons | `lessons-learned/lessons-learned-ut-02a-canonical-schema-resolver-2026-05.md`（L-UT02A-001〜004） |
| changelog | `changelog/20260506-issue373-ut02a-canonical-metadata-diagnostics-spec.md` |

## よく使うパターン

> **検索パターン集・コードパターン早見は [quick-reference-search-patterns.md](quick-reference-search-patterns.md) に分離**
> 機能・タスク別のキーワード分割、読む順番、IPC/Zustand/Result 等のコードスニペットを収録

### 08a-B Public Members Search Filter

| 目的 | 最初に開くファイル |
| --- | --- |
| workflow root | `docs/30-workflows/08a-B-public-search-filter-coverage/` |
| query 正本 | `docs/00-getting-started-manual/specs/12-search-tags.md` |
| public API contract | `docs/00-getting-started-manual/specs/01-api-schema.md` |
| page / UI contract | `docs/00-getting-started-manual/specs/05-pages.md`, `docs/00-getting-started-manual/specs/09-ui-ux.md` |
| API parser / repository | `apps/api/src/_shared/search-query-parser.ts`, `apps/api/src/repository/publicMembers.ts` |
| Web URL parser / filter UI | `apps/web/src/lib/url/members-search.ts`, `apps/web/app/(public)/members/_components/MembersFilterBar.client.tsx` |
| Phase 11 runtime evidence contract | `docs/30-workflows/08a-B-public-search-filter-coverage/outputs/phase-11/main.md` |

`status` は参加ステータスであり、公開状態フィルタではない。公開境界は API の base WHERE（`public_consent` / `publish_state` / `is_deleted` / canonical alias exclusion）で固定する。`q` は LIKE wildcard literal escape、tag AND は先行 bind 数を考慮した placeholders offset、sort は `name`/`recent` とも fullName tie-break を使う。runtime screenshot / curl / axe は VISUAL_ON_EXECUTION として 08b / 09a で取得する。

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
| Phase 12 close-out strict 7 成果物 | `outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md` |
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
| `sync_jobs` runtime contract SSOT（Issue #435 / 2026-05-04） | runtime: `apps/api/src/jobs/_shared/sync-jobs-schema.ts` / logical spec: `docs/30-workflows/_design/sync-jobs-spec.md` / owner table: `docs/30-workflows/_design/sync-shared-modules-owner.md` / workflow: `docs/30-workflows/completed-tasks/issue-195-sync-jobs-contract-schema-consolidation-001/` |
| cron `*/15 * * * *` 設定・JWT 署名・Secret 配置 | `references/deployment-cloudflare.md`（§API Worker cron / Forms response sync 03b） |
| `GOOGLE_FORM_ID` / `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY` / `SYNC_ADMIN_TOKEN` 配置 | `references/environment-variables.md`（§Cloudflare Workers / Google Forms 同期） |
| `RETENTION_PURGE_MODE`（dry-run/apply/off）/ `RETENTION_PURGE_LIMIT` 配置（Issue #402 retention purge gate） | `references/environment-variables.md`（§Cloudflare Workers / Google Forms 同期）, `references/data-retention-policy.md` |
| D1 health endpoint（`GET /health/db`、`X-Health-Token`、`HEALTH_DB_TOKEN`、401/403/503 境界） | `references/api-endpoints.md`（§UBM-Hyogo Health API）, `references/environment-variables.md`（§Cloudflare Workers / Google Forms 同期） |
| 苦戦箇所（per-sync write 200 cap / partial UNIQUE で重複 enqueue 抑止 / submittedAt 同値時 responseId 降順 tie-break / `metrics_json.cursor` ≠ `pageToken`） | `docs/30-workflows/03b-parallel-forms-response-sync-and-current-response-resolver/outputs/phase-12/implementation-guide.md` Part 2 |
| follow-up 責務 8 項目（responseEmail merge / 退会 identity 表示制御 / sync 共通モジュール owner / response_email UNIQUE 所在明文化 / 旧 `ruleConsent` lint / per-sync cap 通知 / lock TTL 解除 runbook / E2E fixture） | `docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver-followups/03b-response-sync-followups.md`。UNIQUE 所在は Issue #196 workflow `docs/30-workflows/issue-196-03b-followup-003-response-email-unique-ddl/` で consumed / 訂正済み: 正本は `member_identities.response_email`、`member_responses.response_email` は非 UNIQUE |
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

### Sentry / Slack Runtime Smoke（09b-A / 2026-05-05）

09b-A は implementation / NON_VISUAL / `implemented-local`。API smoke route は実装済みで、実 Sentry event 受信、Slack message 送信、production secret 登録は user-approved runtime execution wave で取得する。

| 目的 | 最初に開くファイル |
| --- | --- |
| workflow root / AC / approval gate | `docs/30-workflows/completed-tasks/09b-A-observability-sentry-slack-runtime-smoke/index.md` |
| Secret 命名と Slack/Sentry smoke 設計 | `docs/30-workflows/completed-tasks/09b-A-observability-sentry-slack-runtime-smoke/phase-02.md` |
| Runtime evidence template | `docs/30-workflows/completed-tasks/09b-A-observability-sentry-slack-runtime-smoke/outputs/phase-11/main.md` |
| Phase 12 strict 7 compliance | `docs/30-workflows/completed-tasks/09b-A-observability-sentry-slack-runtime-smoke/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| API smoke route 実装 | `apps/api/src/routes/admin/smoke-observability.ts`, `apps/api/src/routes/admin/smoke-observability.test.ts` |
| Canonical observability / secrets | `references/observability-monitoring.md`, `references/deployment-secrets-management.md` |
| 苦戦箇所 / lessons-learned | `references/lessons-learned-09b-A-sentry-slack-runtime-smoke-2026-05.md` |
| Runtime execution 後続タスク | `docs/30-workflows/unassigned-task/task-09b-a-runtime-provider-smoke-execution-001.md` |

### Sentry / Slack Runtime Smoke Production Extension（Issue #495 / 2026-05-06）

Production smoke uses the same route and secret names as staging, but requires `x-smoke-production-confirm: YES` and G1-G4 approval before runtime execution.

| 目的 | 最初に開くファイル |
| --- | --- |
| workflow root / production AC | `docs/30-workflows/issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension/index.md` |
| production confirmation gate design | `docs/30-workflows/issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension/phase-02.md` |
| implementation runbook | `docs/30-workflows/issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension/phase-05.md` |
| staging / production runtime templates | `docs/30-workflows/issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension/outputs/phase-11/main.md` |
| production smoke route implementation | `apps/api/src/routes/admin/smoke-observability.ts`, `apps/api/src/routes/admin/smoke-observability.test.ts` |

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
| GitHub Actions variable semantics | `references/deployment-gha.md`（`CLOUDFLARE_PAGES_PROJECT` deleted by Issue #638; rollback value only = `ubm-hyogo-web`） |
| U-FIX-CF-ACCT-01-DERIV-02 Cloudflare token split | `references/deployment-gha.md`, `references/deployment-secrets-management.md`, `docs/30-workflows/u-fix-cf-acct-01-deriv-02-scope-split-tokens/`（`CF_TOKEN_D1_*` / `CF_TOKEN_WORKERS_*` / `CF_TOKEN_PAGES_*`, Issue #406 は `Refs`） |
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
| production execution | `docs/30-workflows/completed-tasks/09c-A-production-deploy-execution/` |
| production execution issue mirror | `docs/30-workflows/issue-353-09c-production-deploy-execution/` |
| production execution status | `implemented-local` / implementation / VISUAL_ON_EXECUTION / user approval G1-G3 required / production runtime evidence pending |
| production execution inventory | `references/workflow-task-09c-production-deploy-execution-001-artifact-inventory.md` |
| production execution lessons | `references/lessons-learned-09c-production-deploy-execution-001-2026-05.md`（L-09C-EXEC-001〜006）|
| 境界 | 09c 本体は runbook / evidence template。実 production D1 migration / deploy / tag push / 24h verification は `09c-A-production-deploy-execution` の Phase 5-11 で user approval 後に実行 |

### 09c Incident Runbook Slack Delivery（2026-05-06 / spec_created）

| 項目 | 正本 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/09c-incident-runbook-slack-delivery/` |
| 種別 | implementation-spec / NON_VISUAL / runtime-contract-formalization |
| source | `docs/30-workflows/completed-tasks/task-09c-incident-runbook-slack-delivery-001.md` consumed |
| secret spec | `references/deployment-secrets-management.md` §Slack Incident Runbook Delivery |
| lessons | `references/lessons-learned-09c-incident-runbook-slack-delivery-2026-05.md`（L-09C-IRSD-001〜005: workflow_run inputs / 二段ゲート / permalink evidence / Refs #N / secret promote）|
| Phase 12 compliance | `docs/30-workflows/completed-tasks/09c-incident-runbook-slack-delivery/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| implementation | `.github/workflows/incident-runbook-slack-delivery.yml`, `scripts/notify/{slack-incident-runbook.{sh,ts,template.json}, save-slack-evidence.ts}` |
| evidence schema | `ok`, `mode`, `ts`, `channel`, `message.permalink`, `commitSha`, `runbookPermalink`, `deliveredAt` |
| boundary | `workflow_run` は dry-run のみ。production delivery は `workflow_dispatch` + `production-slack-delivery` environment approval + `dryrun_evidence_confirmed=true` 後に実行 |

### Issue #348 GitHub Release Tag Automation（2026-05-06 / implemented-local）

| 項目 | 正本 |
| --- | --- |
| workflow root | `docs/30-workflows/issue-348-09c-github-release-tag-automation/` |
| scripts | `scripts/release/generate-release-notes.sh`, `scripts/release/create-github-release.sh` |
| template | `scripts/release/release-notes.template.md` |
| GitHub Actions | `.github/workflows/release-create.yml` |
| runbook | `docs/runbooks/release-create.md`, `references/release-runbook.md` |
| tag format | `vYYYYMMDD-HHMM` |
| command | `bash scripts/release/create-github-release.sh --tag vYYYYMMDD-HHMM --target <sha> --changelog-path <path> --evidence-url <url> --dry-run` |
| boundary | `workflow_dispatch` は dry-run のみ。tag push は draft release 作成。local `--apply` は user 承認後のみ |

### Issue #352 Postmortem Template Automation（2026-05-05 / implemented-local）

| 項目 | 正本 |
| --- | --- |
| workflow root | `docs/30-workflows/issue-352-postmortem-template-automation/` |
| generator | `scripts/postmortem/generate-postmortem.ts` |
| command | `pnpm postmortem:generate -- --release vX.Y.Z --commit <sha> --evidence <09c-phase-11-dir> --rollback-evidence <rollback-md> --occurred-at <iso8601>` |
| runbook/template | `docs/30-workflows/runbooks/postmortem/README.md`, `docs/30-workflows/runbooks/postmortem/template.md` |
| upstream evidence | `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11/` |
| status | implementation / NON_VISUAL / implemented-local / Phase 13 blocked_pending_user_approval |
| validation | `--evidence` は directory + `main.md` 必須。`--rollback-evidence` は file 必須、0 byte は warning + exit 0 |
| runner | Node 24 `--experimental-strip-types`。`tsx` は esbuild host/binary mismatch のため本CLIでは使わない |
| boundary | postmortem markdown generation only。incident response 本文置換、Slack 通知、GitHub Releases 自動生成、PR 作成は user-gated / scope-out |

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
| profile self-service request UI follow-up | `docs/30-workflows/completed-tasks/06b-B-profile-self-service-request-ui/`（implemented-local / implementation / runtime-evidence-blocked / VISUAL_ON_EXECUTION。`/profile` に `RequestActionPanel`、公開停止/再公開申請 dialog、退会申請 dialog、同一 origin proxy、`/api/me/visibility-request` / `/api/me/delete-request` client helper を追加済み。ログイン済み実 screenshot は runtime capture 待ち） |
| profile logged-in visual evidence follow-up | `docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/`（implementation-prepared / runtime evidence pending / M-08〜M-10, M-14〜M-16） |
| remaining follow-up | `docs/30-workflows/unassigned-task/UT-06B-MAGIC-LINK-RETRY-AFTER.md` |

---

### UT Coverage 2026-05 Wave 早見（Issue #320）

| 目的 | 最初に開くファイル |
| --- | --- |
| wave 実行順序 | `docs/30-workflows/ut-coverage-2026-05-wave/README.md` |
| apps/api coverage precondition | `docs/30-workflows/completed-tasks/ut-api-cov-precondition-01-test-failure-recovery/index.md` |
| apps/web auth/fetch/session coverage spec | `docs/30-workflows/ut-web-cov-03-auth-fetch-lib-coverage/index.md` |
| wave-3 roadmap | `docs/30-workflows/ut-coverage-2026-05-wave/wave-3-roadmap.md`（Issue #433 / implemented-local / Phase 1-12 completed / Phase 13 approval gate） |
| artifact inventory | `references/workflow-ut-coverage-2026-05-wave-artifact-inventory.md` |
| lessons learned | `references/lessons-learned-ut-coverage-2026-05-wave.md` |
| Phase 11 NON_VISUAL evidence | `docs/30-workflows/completed-tasks/ut-api-cov-precondition-01-test-failure-recovery/outputs/phase-11/` |
| Phase 12 compliance | `docs/30-workflows/completed-tasks/ut-api-cov-precondition-01-test-failure-recovery/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| coverage command | `bash scripts/coverage-guard.sh` |

Boundary: wave-1 is `implemented-local / test-fixture implementation / NON_VISUAL`; only `apps/api/src/jobs/__fixtures__/d1-fake.ts` is changed. `ut-web-cov-03` is now `implemented-local / test implementation / NON_VISUAL`: apps/web auth/fetch/session Vitest tests, `fetch-mock` helper + helper test, and root `vitest.config.ts` coverage exclude are implemented and measured (40 files / 359 tests PASS). Issue #433 wave-3 roadmap measured all four packages and materialized 8 candidate tasks; root `vitest.config.ts` also contains the React / React DOM alias used to keep coverage runs stable under isolated node-linker. Runtime production code, packages/*, commit, push, PR creation, and post-push `verify-indexes-up-to-date` CI evidence remain blocked until Phase 13 user approval.

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
| current blocker | `packages/shared/src/types/skill.ts` の `SkillExecutionStatus` は現状 6 値。Task12 は `implemented-local` 前提で、Phase 1 では実体確認が先。                                                                                                                    |
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

### Issue #372 Attendance Pagination 早見（implemented-local / 2026-05-07）

| 観点 | 値 / 参照先 |
| --- | --- |
| canonical task root | `docs/30-workflows/issue-372-attendance-pagination/` |
| 状態 | implemented-local / implementation / VISUAL / Phase 11 visual evidence pending / Phase 13 pending_user_approval |
| source | `docs/30-workflows/completed-tasks/ut-02a-attendance-profile-integration/ut-02a-followup-004-attendance-pagination.md` |
| repository | `apps/api/src/repository/attendance.ts` (`findByMemberId(id, { limit, cursor })`) |
| routes | `/me/attendance`, `/admin/members/:memberId/attendance` |
| shared contract | `MemberProfile.attendance` は配列維持、`attendanceMeta?: { hasMore, nextCursor }` を optional 追加 |
| web targets | `apps/web/app/profile/_components/AttendanceList.tsx`, `apps/web/src/components/admin/MemberDrawer.tsx` |
| scope boundary | `findByMemberIds(ids)` bulk pagination は明示スコープ外。未タスク化しない |
| evidence | local focused tests + Phase 12 strict files: `docs/30-workflows/issue-372-attendance-pagination/outputs/phase-12/`; staging screenshots/curl remain Phase 11 pending |
| lessons-learned | `references/lessons-learned-issue-372-attendance-pagination-2026-05.md`（L-ISSUE372-001〜006: cursor encoded/decoded 境界 / bulk と個人特化 API 分離 / `attendanceMeta` optional 追加 / miniflare EADDRNOTAVAIL focused run / 1Password CLI timeout 切り分け / Phase 11 visual evidence pending を spec sync の blocker にしない） |

### Issue #531 AttendanceProvider Runtime Smoke 早見（spec_created / 2026-05-07）

| 観点 | 値 / 参照先 |
| --- | --- |
| canonical task root | `docs/30-workflows/issue-531-runtime-smoke-attendance-provider-migration/` |
| 状態 | spec_created / implementation / NON_VISUAL / runtime evidence pending_user_credentials |
| purpose | issue-371 の `c.var.attendanceProvider` middleware DI 移行を Cloudflare staging Worker で read-only smoke する。DI-bound evidence は `/admin/members/:memberId` と `/me/profile` |
| smoke script | `scripts/smoke/runtime-attendance-provider.sh` |
| evidence boundary | persistent evidence は summary-only（status / jq contract / count or type）。raw body は `mktemp` + `trap`、保存禁止 |
| route contract | `/admin/members` = `.members[]`, `/admin/members/:memberId` = `.attendance[]`, `/admin/members/:memberId/attendance` = `.records[]`, `/me/` = `.user.memberId`, `/me/profile` = `.profile.attendance[]`, `/me/attendance` = `.records[]` |
| boundary | POST self-request routes are inventory-only because they write staging queue state; production smoke remains forbidden |

### UBM-Hyogo Attendance Write Operations Close-out（UT-02A follow-up / 2026-05-06）

| 観点 | 値 / 参照先 |
| --- | --- |
| canonical task root | `docs/30-workflows/completed-tasks/ut-02a-followup-001-attendance-write-operations/` |
| 状態 | implemented-local / resolved-by-existing-06cE-07c / implementation / NON_VISUAL |
| source unassigned | `docs/30-workflows/completed-tasks/ut-02a-attendance-profile-integration/task-ut-02a-attendance-write-operations-001.md`（解消済み） |
| repository write | `apps/api/src/repository/attendance.ts` (`addAttendance` / `removeAttendance`) |
| canonical route | `POST /admin/meetings/:sessionId/attendances` |
| legacy routes | `POST /admin/meetings/:sessionId/attendance`, `DELETE /admin/meetings/:sessionId/attendance/:memberId` |

### UBM-Hyogo Attendance Provider Context Migration（Issue #371 / UT-02A follow-up / 2026-05-06）

| 観点 | 値 / 参照先 |
| --- | --- |
| canonical task root | `docs/30-workflows/issue-371-ut-02a-followup-003-hono-ctx-di-migration/` |
| 状態 | implemented-local / implementation / NON_VISUAL / code evidence captured / runtime smoke pending / Issue #371 CLOSED |
| source stub | `docs/30-workflows/completed-tasks/ut-02a-attendance-profile-integration/ut-02a-followup-003-hono-ctx-or-di-container-migration.md`（transferred） |
| target contract | `buildMemberProfile(c, mid)` / `buildAdminMemberDetailView(c, mid, adminNotes)` に縮小し、provider は `c.var.attendanceProvider` から解決 |
| type boundary | 既存 `DbCtx` (`readonly db`) は変更せず、attendance builder だけ `RepositoryProviderCtx = DbCtx & { var: RepositoryProviderVariables }` を要求 |
| evidence boundary | Phase 11 は `IMPLEMENTED_LOCAL_RUNTIME_PENDING`。typecheck / lint / test / build / grep gate logs captured、runtime smoke は下流 gate |
| error boundary | duplicate=409, deleted member=422, session/member not found=404 |
| design decision | 新規 `AttendanceWriter` / `AttendanceRecordId` は導入しない |

### UBM-Hyogo Attendance Dashboard Analytics（UT-02A follow-up / 2026-05-06）

| 観点 | 値 / 参照先 |
| --- | --- |
| canonical task root | `docs/30-workflows/ut-02a-followup-002-attendance-dashboard-analytics/` |
| 状態 | implemented-local / implementation / VISUAL_ON_EXECUTION / local tests passed / runtime curl and UI screenshot pending |
| source issue | Issue #370（CLOSED 維持、PR は `Refs #370`） |
| repository aggregate | `apps/api/src/repository/attendance.ts` 末尾に `computeAttendanceOverview` / `listSessionAttendanceStats` / `listMemberAttendanceRanking` を実装済み |
| route | 既存 `apps/api/src/routes/admin/dashboard.ts` を拡張し `/admin/dashboard/attendance/{overview,by-session,ranking}` を実装済み |
| web UI | `apps/web/app/(admin)/admin/dashboard/attendance/page.tsx` |
| proxy | 既存 `apps/web/app/api/admin/[...path]/route.ts` を再利用。attendance 専用 proxy は作らない |
| schema boundary | `meeting_sessions.session_id` が PK。`meeting_sessions.id` は使用禁止 |
| index policy | 新規は `idx_member_attendance_member` 1 本。既存 `idx_member_attendance_session` / `idx_meeting_sessions_active_held_on` を流用 |
| evidence boundary | repository / route / EXPLAIN Vitest は local PASS。runtime curl / browser screenshot は user-approved capture cycle まで pending |

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
| issue #377 retry tick | `apps/api/src/workflows/tagQueueRetryTick.ts` / `TAG_QUEUE_TICK_CRON="*/5 * * * *"`。retry 対象は `reason='retry_tick'` / `attempt_count > 0` / `last_error IS NOT NULL` / `next_visible_at IS NOT NULL` のいずれか。plain human-review `queued` は skip。default scheduled path でも `incrementRetryWithDlqAudit` を呼び、DLQ 移送時は `admin.tag.queue_dlq_moved` audit (`target_type='tag_queue'`) を D1 batch で同時記録 |
| issue #378 pause flag | `TAG_QUEUE_PAUSED` は non-secret Cloudflare variable。`"true"` 完全一致のみ Forms sync candidate enqueue を停止し、`has_tags` / `has_pending_candidate` / `paused` reason contract を維持する。runbook: `docs/30-workflows/runbooks/tag-queue-pause.md`、workflow: `docs/30-workflows/completed-tasks/issue-378-tag-queue-paused-flag/`、inventory: `references/workflow-issue-378-tag-queue-paused-flag-artifact-inventory.md`、苦戦知見: `lessons-learned/lessons-learned-issue-378-tag-queue-paused-flag-2026-05.md`（L-378-001〜004） |
| Issue #408 Cloudflare audit-log monitoring | canonical: `docs/30-workflows/completed-tasks/issue-408-cf-audit-logs-monitoring/`。secret は `CF_AUDIT_TOKEN_PROD` (`Account > Audit Logs:Read` only) で deploy 用 `CLOUDFLARE_API_TOKEN` と分離。alert labels は HIGH=`priority:high` / MEDIUM=`priority:medium` / LOW=`priority:low` + `type:security`。runtime コード (`scripts/cf-audit-log/{fetch,analyze,baseline}.ts` / migration `0014_create_cf_audit_log.sql` / 2 workflows: `cf-audit-log-monitor.yml` `0 * * * *` + `cf-audit-log-monitor-watchdog.yml` `15 * * * *` `WATCHDOG_STALE_MINUTES=90`) は merge 済。Token 発行・1Password 登録・GitHub Secret 登録・D1 apply・7 日 baseline は manual runbook (`outputs/phase-5/secrets-registration.md`)。Phase 11 placeholder = `IMPLEMENTED_LOCAL_RUNTIME_PENDING`。D1 schema: `references/database-schema-cf-audit-log.md` (`cf_audit_log` / `cf_audit_baseline` / `cf_audit_finding_dedupe`、apps/api runtime read-only)。苦戦知見: `references/lessons-learned-issue-408-cf-audit-logs-monitoring-2026-05.md`（L-ISSUE408-001〜007: cursor pagination + INSERT OR IGNORE / Account scope / WranglerD1 quoting / fetch 直接呼び / rotation window env / TTL purge in analyze.ts / 監視・deploy token 分離）。followup 3 件: FU-02 cold-storage / FU-03 ml-anomaly / FU-04 github-audit-merge |
| Issue #546 Cloudflare audit-log 90 day baseline observation | canonical: `docs/30-workflows/completed-tasks/observability/issue-546-cf-audit-logs-90day-baseline-observation/`。status は `observation_continue / docs-only / NON_VISUAL / Gate-A FAIL / Gate-B-C pending`。2026-05-08 evidence: monitor 32 runs and watchdog 32 runs from 2026-05-06〜2026-05-07 are all failure; monitor evidence is normalized to a JSON array; `cf-audit` issue label count 0; production D1 read-only query returned `no such table: cf_audit_log`; baseline thresholds and monthly tuning minutes log are pending. Issue #546 remains CLOSED and PR text must use `Refs #546` only. ML comparison / production switch is not unlocked by this evidence; earliest 90 day re-check is after 2026-08-05 if successful hourly runs begin on 2026-05-08. Reminder: `docs/30-workflows/unassigned-task/issue-546-cf-audit-logs-90day-reobservation-reminder-001.md`; inventory: `references/workflow-issue-546-cf-audit-logs-90day-baseline-observation-artifact-inventory.md`; lessons: `references/lessons-learned-issue-546-cf-audit-logs-90day-baseline-observation-2026-05.md`. |
| Issue #514 Cloudflare audit-log cold storage / R2 export | canonical: `docs/30-workflows/completed-tasks/issue-514-cf-audit-logs-cold-storage-r2-export/`。status は `implemented-local / implementation / NON_VISUAL / IMPLEMENTED_LOCAL_RUNTIME_PENDING`。daily `0 2 * * *` で `[now - 29d, now - 26d)` を export、manifest `cf_audit_log_export_manifest` は `(yyyy, mm, dd)` UNIQUE + `pending -> completed/failed` + `r2_etag`。R2 binding は `UBM_AUDIT_COLD_STORAGE`、Secret は `CF_AUDIT_R2_TOKEN_PROD`。G1 R2/bucket/secret/deploy -> G2 D1 migration apply -> G3-prod first daily export + restore drill -> G4 commit/push/PR。Issue #514 CLOSED のため PR 文脈は `Refs #514` のみ。苦戦知見: `references/lessons-learned-issue-514-cf-audit-logs-cold-storage-r2-export-2026-05.md`（L-ISSUE514-001..007: artifacts mirror parity / Phase 11 10 screenshots, Phase 12 strict 7 outputs / `IMPLEMENTED_LOCAL_RUNTIME_PENDING` 語彙 / G1-G4 gate sequence / monthly→daily cadence 補正 / source schema 整合 + r2_etag / 6-category redaction guard） |
| Issue #408 / #518 Cloudflare audit-log monitoring | canonical: `docs/30-workflows/completed-tasks/issue-408-cf-audit-logs-monitoring/`、HOLD spec: `docs/30-workflows/issue-518-cf-audit-logs-monitoring-hold/`、manual runbook: `docs/30-workflows/runbooks/cf-audit-logs-weekly-manual-check.md`。secret は `CF_AUDIT_TOKEN_PROD` (`Account > Audit Logs:Read` only) で deploy 用 `CLOUDFLARE_API_TOKEN` と分離。Issue #518 により runtime は HOLD / manual-check-only: `cf-audit-log-monitor.yml` は schedule 削除 + `workflow_dispatch` のみ + `dry_run=true` 既定、`cf-audit-log-monitor-watchdog.yml` は削除。runtime コード (`scripts/cf-audit-log/{fetch,analyze,baseline}.ts` / migration `0014_create_cf_audit_log.sql`) と D1 schema は保持。自動 alert labels は HIGH=`priority:high` / MEDIUM=`priority:medium` / LOW=`priority:low` + `type:security` だが HOLD 中は公開 Issue 自動起票を既定無効。D1 schema: `references/database-schema-cf-audit-log.md` (`cf_audit_log` / `cf_audit_baseline` / `cf_audit_finding_dedupe`、apps/api runtime read-only)。苦戦知見: `references/lessons-learned-issue-408-cf-audit-logs-monitoring-2026-05.md`。followup 3 件: FU-02 cold-storage / FU-03 ml-anomaly / FU-04 github-audit-merge |
| `tag_definitions` カテゴリ | 6 カテゴリ single source（41 行 seed） |
| fake D1 テストパターン | `apps/api/src/repository/_shared/__fakes__/fakeD1.ts`（in-memory pattern-matching SQL） |
| Issue #379 current verification | `docs/30-workflows/issue-379-schema-diff-queue-faked1-compat/`。旧 `schemaDiffQueue.test.ts` list 系 2 fail は 2026-05-05 focused Vitest 7/7 PASS で stale 扱い。fakeD1 parser 拡張 / seed edit / SQL rewrite は未実施 |
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
| strict blocker | legacy literal blocker resolved by `docs/30-workflows/issue-393-stablekey-literal-legacy-cleanup/` (`strict_ready`, 0 violation). `fully enforced` は strict CI gate 後 |
| follow-up | `docs/30-workflows/unassigned-task/task-03a-stablekey-strict-ci-gate-001.md` |
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

### UBM-Hyogo Admin Meetings Remaining（06c-E / 2026-05-04）

| 観点 | 値 / 参照先 |
| --- | --- |
| canonical task root | `docs/30-workflows/06c-E-admin-meetings/` |
| 状態 | `implemented-local / implementation / remaining-only / VISUAL_ON_EXECUTION` |
| API | `PATCH /admin/meetings/:id`, `POST /admin/meetings/:id/attendances`, `GET /admin/meetings/:id/export.csv` |
| DB | `meeting_sessions.deleted_at`, `member_attendance` |
| Web | `MeetingPanel` edit details / soft delete / CSV link |
| Evidence | API meetings 15 PASS / MeetingPanel 17 PASS; visual runtime evidence deferred to 08b / 09a |

### UBM-Hyogo Admin Tags Remaining Spec（06c-C / 2026-05-03）

| 観点 | 値 / 参照先 |
| --- | --- |
| canonical task root | `docs/30-workflows/06c-C-admin-tags/` |
| 状態 | `implemented-local / implementation / runtime evidence pending_user_approval / docs-only / remaining-only / VISUAL_ON_EXECUTION` |
| 正本境界 | `/admin/tags` は未タグ会員キュー。タグ辞書 CRUD / alias editor / `member_tags` 直接編集 UI/API は作らない |
| API 正本 | `GET /admin/tags/queue`, `POST /admin/tags/queue/:queueId/resolve` |
| schema 正本 | `packages/shared/src/schemas/admin/tag-queue-resolve.ts` の `tagQueueResolveBodySchema` |
| audit | `admin.tag.queue_resolved`, `admin.tag.queue_rejected` |
| evidence | Phase 12 strict outputs present。runtime visual evidence は 08b / 09a に委譲 |

### UBM-Hyogo Admin Dashboard Follow-up 早見（06c-A / 2026-05-02）

| 観点 | 値 / 参照先 |
| --- | --- |
| canonical task root | `docs/30-workflows/06c-A-admin-dashboard/` |
| 状態 | `implemented-local` / docs-only / remaining-only / `VISUAL_ON_EXECUTION` / outputs contract only |
| endpoint | apps/api は `GET /admin/dashboard`、apps/web は proxy 経由 `GET /api/admin/dashboard`（split `/kpi` / `/recent-actions` は不採用） |
| KPI | `総会員数 / 公開中人数 / 未タグ人数 / スキーマ未解決件数` |
| recent actions | `audit_log` 直近7日 / max20 / `dashboard.view` 除外 |
| audit | dashboard read は `dashboard.view` として記録し、recent actions と KPI を自己汚染しない |
| Phase 12 evidence | `docs/30-workflows/06c-A-admin-dashboard/outputs/phase-12/phase12-task-spec-compliance-check.md` |

### UBM-Hyogo Playwright Full Execution 早見（08b-A / 2026-05-04）

| 観点 | 値 / 参照先 |
| --- | --- |
| canonical task root | `docs/30-workflows/completed-tasks/08b-A-playwright-e2e-full-execution/` |
| 状態 | `implemented-local` / `implementation-spec` / `VISUAL_ON_EXECUTION` / Phase 1-10 and 12 completed / Phase 11 contract_ready_runtime_pending / Phase 13 pending_user_approval |
| 実測境界 | Phase 11 runtime evidence is `PENDING_RUNTIME_EVIDENCE`; implemented-local paths are not PASS evidence |
| evidence manifest | `docs/30-workflows/completed-tasks/08b-A-playwright-e2e-full-execution/outputs/phase-11/evidence-manifest.md` |
| required runtime evidence | Playwright HTML/JSON report、real axe report、30+ desktop/mobile screenshots、non-admin `/admin/*` UI gate、direct `/api/admin/*` 403、foreign content edit 403、secret hygiene、zero skipped spec inventory |
| Phase 12 evidence | `docs/30-workflows/completed-tasks/08b-A-playwright-e2e-full-execution/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| upstream | `08b-parallel-playwright-e2e-and-ui-acceptance-smoke` scaffold |
| downstream | 09a staging smoke and 09c production deploy remain gated until fresh runtime evidence or explicit blocker |

### UBM-Hyogo Staging Smoke / Forms Sync Validation 早見（09a / 2026-05-01）

| 観点 | 値 / 参照先 |
| --- | --- |
| canonical task root | `docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/`（現 worktree では不在。復元 blocker は `task-09a-canonical-directory-restoration-001.md`） |
| 状態 | `implemented-local` / implementation execution spec / `VISUAL_ON_EXECUTION` / Phase 13 blocked until user approval |
| 実測境界 | Phase 11 の `manual-smoke-log.md` / `sync-jobs-staging.json` / `wrangler-tail.log` は現状 `NOT_EXECUTED` placeholder。実測 PASS として扱わない |
| consumes | 05a OAuth/admin gate、06a public web、06b login/profile、06c admin UI、08b Playwright scaffold、03a/03b/U-04 Forms sync |
| blocks | 09c production deploy。09a の実 staging evidence 完了まで GO 判定不可 |
| follow-up | `docs/30-workflows/unassigned-task/task-09a-exec-staging-smoke-001.md` |
| execution workflow | `docs/30-workflows/ut-09a-exec-staging-smoke-001/`（implemented_local_runtime_pending / implementation / VISUAL_ON_EXECUTION。2026-05-02 user 明示指示後に Phase 11 を試行し、`cloudflare_unauthenticated + 09a_directory_missing` で `EXECUTED_BLOCKED`） |
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

### Issue #475 coverage-gate required context（runtime evidence captured / 2026-05-05）

| 項目 | 値 |
| --- | --- |
| workflow | `docs/30-workflows/issue-475-branch-protection-coverage-gate/` |
| 目的 | `coverage-gate` を `main` / `dev` の `required_status_checks.contexts` に append し、coverage 80% gate を merge gate 化 |
| current applied 境界 | `deployment-branch-strategy.md` current applied 表を Issue #475 適用後 fresh GET evidence へ更新済み |
| Gate A | external GitHub PUT は外部適用済みとして fresh GET で観測済。追加 PUT は実行しない |
| Gate B | git commit / push / PR approval before Phase 13。throwaway PR による `mergeStateStatus=BLOCKED` 経験的観測も Gate B 後 |
| invariant | Issue #475 起因の non-target drift なし。dev の `required_pull_request_reviews=null` は out-of-scope / solo policy 方向として記録 |
| runtime evidence | Phase 11 fresh GET / drift / invariant / contexts-preserved / SSOT diff は取得済み。empirical PR observation only pending |
| 実 PUT のゲート | Gate A は消化済み。Phase 13 = `blocked_pending_gate_b_git_publish_and_empirical_pr`（ユーザー明示承認後の別オペレーションでのみ実行） |
| 苦戦知見 | `references/lessons-learned-ut-gov-001-2026-04.md`（L-GOV-001 payload adapter / L-GOV-002 5 重明記 / L-GOV-003 Phase 12-13 二重ゲート / L-GOV-004 NON_VISUAL evidence） |
| 正本仕様 | `references/deployment-branch-strategy.md`（current applied / Issue #475 適用 evidence） |

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
### UT-17 Followup-003 Alert Relay Weekly Healthcheck Cron（2026-05-14 / implemented-local）

UT-17 Cloudflare Notifications → alert-relay → Slack 経路を、既存 API Worker daily cron `0 18 * * *` へ相乗りして週次 healthcheck する。UTC Monday gate (`getUTCDay() === 1`) により新規 cron slot は追加しない。Slack `200 + body != "ok"` を失敗扱いにし、Resend mail fallback で silent failure を検出する。状態は `implementation_completed_external_ops_pending / implementation / NON_VISUAL / CODE_COMPLETE_EXTERNAL_OPS_PENDING`。Cloudflare secrets / deploy / manual cron fire / first production observation / commit / push / PR は user-gated。

| 項目 | 正本 |
| --- | --- |
| workflow root | `docs/30-workflows/ut-17-followup-003-alert-relay-healthcheck-cron/` |
| implementation | `apps/api/src/scheduled/healthcheck.ts`, `apps/api/src/lib/healthcheck-mail-fallback.ts`, `apps/api/src/index.ts`, `apps/api/src/env.ts` |
| tests | `apps/api/src/scheduled/__tests__/healthcheck.test.ts`, `apps/api/src/lib/__tests__/healthcheck-mail-fallback.test.ts` |
| runbook | `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` |
| deployment spec | `references/deployment-cloudflare.md`（UT-17 weekly alert-relay healthcheck cron） |
| artifact inventory | `references/workflow-ut-17-cloudflare-analytics-alerts-artifact-inventory.md` |

### Issue #627 Composite setup-project action（RB-02 / 2026-05-12）

| 観点 | 値 / 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/issue-627-composite-setup-action/` |
| status | `implemented_local_runtime_pending / implementation / NON_VISUAL / CI infra` |
| composite contract | `.github/actions/setup-project/action.yml` implemented locally. Checkout is caller-owned; action owns Node / pnpm or mise setup plus optional install. |
| input vocabulary | `setup-strategy: node-setup | mise`, `install: 'true' | 'false'`, `node-version`, `pnpm-version`, `working-directory` |
| required contexts preserved | `ci`, `coverage-gate`, `lighthouse-ci`, `e2e-tests-coverage-gate`, `build-test`, `workflow-shell-lint` |
| evidence boundary | Local static checks passed; GitHub Actions runtime evidence is `runtime_pending` until user-approved commit / push / draft PR. |
| closed issue rule | Issue #627 is CLOSED; PR text must use `Refs #627` only. |
| lessons-learned | `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-issue-627-composite-setup-action-2026-05.md` (L-627-001..003) |

### Issue #655 D+7 recovery 2nd-cycle（2026-05-14）

| 観点 | 値 / 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/issue-655-d7-recovery-2nd-cycle/` |
| status | `implemented-local-runtime-pending / implementation / NON_VISUAL / IMPLEMENTED_LOCAL_RUNTIME_PENDING` |
| parent | Issue #586 post-switch 7 day close-out; grandparent is Issue #549 CF Audit Logs ML production switch |
| recovery contract | 1 周目と 2 周目 evidence を `*-recovery.*` suffix と `./hourly-snapshots-recovery` input directory で分離 |
| canonical state | workflow root は `implemented-local-runtime-pending`、runtime collection は `runtime_pending`、D'+7 成功後の業務状態のみ `pass_runtime_synced` |
| strict outputs | `outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md` |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-655-d7-recovery-2nd-cycle-artifact-inventory.md` |
| user gate | commit / push / PR / workflow_dispatch / secret or variable mutation / runtime promotion は user approval 後のみ |

### UT-17 Follow-up 002 / Alert Relay Dedup KV（2026-05-13）

| 観点 | 値 / 参照先 |
| --- | --- |
| canonical workflow | `docs/30-workflows/ut-17-followup-002-alert-relay-dedup-kv/` |
| source task | `docs/30-workflows/unassigned-task/ut-17-followup-002-alert-relay-dedup-kv-persistence.md`（transferred_to_workflow） |
| state | `implemented-local-runtime-pending / implementation / NON_VISUAL / external_ops_pending` |
| planned binding | `ALERT_DEDUP_KV: KVNamespace` |
| canonical test path | `apps/api/src/routes/internal/__tests__/alert-relay.test.ts` |
| artifact inventory | `references/workflow-ut-17-followup-002-alert-relay-dedup-kv-artifact-inventory.md` |
| patterns | `references/patterns-kv-dedup.md`（env binding narrowing / KV stub fixture / persistence ordering / wrangler gating / wording 規律） |
| lessons-learned | `lessons-learned/lessons-learned-ut-17-followup-002-alert-relay-dedup-kv-2026-05.md`（5 教訓） |
| boundary | KV eventual consistency のため exactly-once は保証しない。目的は isolate 跨ぎ重複通知の実用大幅低減。Dedup key は Slack 配信成功後にのみ保存する。Cloudflare mutation / deploy / Slack runtime smoke / commit / push / PR は user-gated |
