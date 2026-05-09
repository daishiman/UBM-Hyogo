# タスク実行仕様書生成ガイド / active guide

> 親仕様書: [task-workflow.md](task-workflow.md)
> 役割: active guide
> 区分: 正本（current contract）

## 概要

本ドキュメントは、複雑なタスクを単一責務の原則に基づいて分解し、各サブタスクに最適なスラッシュコマンド・エージェント・スキルの組み合わせを選定するためのガイドラインを定義する。

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

### Issue #553 Live audit-correlation endpoint（2026-05-08）

| 項目 | 値 |
| --- | --- |
| ステータス | implemented-local / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING / Phase 13 blocked_pending_user_approval |
| 成果物 | `docs/30-workflows/issue-553-live-audit-correlation-endpoint/` |
| 親 | Issue #516 GitHub audit log cross-source correlation |
| 目的 | FU-01 live wiring: Cloudflare Worker route + cron + D1 redact-safe persistence + HIGH Slack incoming webhook notification をローカル実装し、runtime operation を user gate に分離 |
| 実装対象 | `apps/api/src/routes/audit-correlation/`, `apps/api/src/audit-correlation/{scheduled,run-correlation,persist,notify-slack,runbook-url}.ts`, `apps/api/wrangler.toml`, `apps/api/migrations/*audit_correlation_findings.sql`, `scripts/audit-correlation/`, `.github/workflows/audit-correlation-verify.yml`, `docs/runbooks/audit-correlation.md` |
| evidence boundary | Phase 11 は local evidence / staging runtime evidence path を分離。Cloudflare deploy / D1 apply / secrets / production PASS は user approval 後に取得 |
| approval boundary | Cloudflare deploy / D1 apply / secret injection / commit / push / PR は G1-G4 user approval 後のみ |
| SSOT | `references/audit-correlation.md` §Issue #553 Live Wiring Formalization / §Live wiring (Issue #553) implementation landing / §Additional implementation surface / §Cloudflare Secrets (5 種) op-reference rule / §Salt rotation procedure / §Lessons learned (Issue #553 wave) |
| 苦戦記録 | L-AC553-001..007（scheduled retry 不可 / Slack per-finding 部分成功 / INSERT OR IGNORE dedup / fixture vs grep gate 整合 / runbook-url SSOT / env validate throw / redact 3 層） |

### Issue #549 Cloudflare Audit Logs ML production switch（2026-05-08）

| 項目 | 値 |
| --- | --- |
| ステータス | implemented-local / implementation / NON_VISUAL / IMPLEMENTED_LOCAL_RUNTIME_PENDING / Phase 13 blocked_pending_user_approval |
| 成果物 | `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/` |
| 親 | Issue #515 ML-ready classifier / Issue #518 HOLD |
| switch contract | Gate-0〜C 通過後のみ `.github/workflows/cf-audit-log-monitor.yml` で `CF_AUDIT_CLASSIFIER=ml` |
| model path | `ML_MODEL_PATH=op://Employee/ubm-hyogo-env/CF_AUDIT_ML_MODEL_PATH_PROD`（解決値は記録しない） |
| observation | production switch merge 後 7 日 / 168 hourly snapshots / fallback rate / p95 latency / leakage grep |
| rollback | `CF_AUDIT_CLASSIFIER=threshold` へ戻す。D1 `classifier_used` / `classifier_version` / `confidence` は削除しない |
| evidence | local focused tests / skeleton dry-run / grep gate、`outputs/phase-12/` strict 7 files |
| 境界 | 本サイクルは observation scripts / fallback alert / leakage grep CLI まで。workflow YAML / secret / artifact / production mutation は実行しない。Issue #549 は CLOSED のまま `Refs #549` |

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
| 成果物 | `docs/30-workflows/issue-577-api-coverage-rerun-miniflare-port-exhaustion/` |
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
| ステータス | implemented-local / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING / Phase 13 pending_user_approval |
| 成果物 | `docs/30-workflows/issue-571-runtime-smoke-ci-staging-integration/` |
| parent | `docs/30-workflows/completed-tasks/issue-531-runtime-smoke-attendance-provider-migration/` |
| 目的 | attendanceProvider runtime smoke を staging deploy 後に GitHub Actions で自動実行する workflow / scripts / ADR を固定 |
| workflow | `.github/workflows/runtime-smoke-staging.yml` |
| trigger | reusable `workflow_call` from `backend-ci.yml` after API staging deploy + debug `workflow_dispatch` |
| runtime command | `bash scripts/smoke/runtime-attendance-provider.sh staging --out-dir ci-evidence --ci-summary` |
| secret境界 | staging runtime credentials は GitHub Environment `staging-runtime-smoke` only。repository-scoped dispatch token は不要 |
| evidence boundary | local PASS 5 点取得済み。G1-G4 approval 後に real workflow run / artifact redaction grep / Slack failure injection evidence を取得 |
| production boundary | production runtime smoke CI は staging 30 日観測後に起票・着手 |
| Issue 取扱 | Issue #571 CLOSED 維持。PR 文脈では `Refs #571` のみ |

### Issue #526 CI actionlint / shellcheck gate（2026-05-08）

| 項目 | 値 |
| --- | --- |
| ステータス | implemented-local / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING / Phase 13 pending_user_approval |
| 成果物 | `docs/30-workflows/completed-tasks/governance/issue-526-ci-actionlint-shellcheck-gate/` |
| Artifact inventory | `references/workflow-issue-526-ci-actionlint-shellcheck-gate-artifact-inventory.md` |
| Lessons | `references/lessons-learned-issue-526-ci-actionlint-shellcheck-gate-2026-05.md` |
| 実装対象 | `.github/workflows/ci.yml`, `package.json`, `scripts/observation/test/test-create-reminder-issue.sh` |
| lint対象 | `.github/workflows/post-release-observation-reminder.yml`, `.github/workflows/ci.yml`, `scripts/observation/*.sh`, `scripts/observation/test/*.sh` |
| merge gate | 既存 required context `ci` 内で `pnpm observation:lint` を実行。dedicated `workflow-shell-lint` job は見やすい分離証跡で、required context 追加は user-gated |
| 境界 | Reminder workflow の schedule / workflow_dispatch / Issue 作成副作用は変更しない。GitHub Actions runtime evidence、branch protection PUT、commit、push、PR は user approval 後 |
| Issue 取扱 | #526 / #350 CLOSED 維持。PR 文脈では `Refs #526, Refs #350` のみ |

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

### UI prototype alignment / MVP recovery task-02 wrangler env injection（2026-05-07）

| 項目 | 値 |
| --- | --- |
| ステータス | implemented-local / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING / Phase 13 pending_user_approval |
| 成果物 | `docs/30-workflows/task-02-w2-wrangler-env-injection/` |
| 実装対象 | `apps/web/wrangler.toml`, `apps/web/.dev.vars.example`, `apps/web/src/lib/env.ts`, `apps/web/src/lib/__tests__/env.test.ts` |
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
| state boundary | parent issue-371 remains `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` until real staging smoke PASS exists |
| Issue 取扱 | #531 CLOSED 維持。PR 文脈では `Refs #531` のみ |


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
| ステータス | implemented-local / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING / Phase 12 strict outputs present / Phase 13 blocked_pending_user_approval |
| 成果物 | `docs/30-workflows/completed-tasks/task-03-w2-par-sentry-workers-sdk-unify/` |
| parent | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/` W2 runtime task |
| 契約 | Workers / Node SSR / Edge は `@sentry/cloudflare`、Browser は `@sentry/nextjs` に entry を分離し、`@sentry/nextjs` / browser SDK token の Workers bundle 混入を grep gate で禁止 |
| secret境界 | web server DSN は Cloudflare Secret `SENTRY_DSN_WEB`、1Password 正本は `op://UBM-Hyogo/Sentry Web DSN (<env>)/dsn`。Browser DSN は `[vars]` `NEXT_PUBLIC_SENTRY_DSN` |
| API | `captureException(error, ctx?)`, `captureMessage(message, ctx?)`, `register()` の contract を Phase 3 に固定 |
| evidence境界 | Phase 11 は local typecheck / tests / build / OpenNext worker grep を取得済みの `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`。staging deploy、Sentry dashboard event は user approval 後 |
| 下流 | task-04 logger、task-05 error boundary / staging smoke |
| 検証 | `pnpm --filter @ubm-hyogo/web exec tsc --noEmit` PASS、web Vitest 51 files / 420 tests PASS、`pnpm --filter @ubm-hyogo/web build:cloudflare` PASS、worker grep 0 hits、Phase 12 strict 7 outputs、Phase 11 outputs、Phase 13 approval-boundary outputs を同 wave で配置 |
### Issue #559 task-03 follow-up 001 Sentry staging runtime evidence（2026-05-08）
| ステータス | spec_created / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING |
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
| ステータス | implemented-local / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING / Phase 12 strict outputs present / Phase 13 blocked_pending_user_approval |
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

