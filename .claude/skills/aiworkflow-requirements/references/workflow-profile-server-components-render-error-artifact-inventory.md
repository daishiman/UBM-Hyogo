# Workflow Artifact Inventory - profile-server-components-render-error

| Item | Path / Value |
| --- | --- |
| Workflow root | `docs/30-workflows/completed-tasks/profile-server-components-render-error/` |
| Root artifacts | `docs/30-workflows/completed-tasks/profile-server-components-render-error/artifacts.json` |
| Output artifacts mirror | `docs/30-workflows/completed-tasks/profile-server-components-render-error/outputs/artifacts.json` |
| Status | `implemented_local_evidence_captured / implementation / NON_VISUAL / staging_runtime_pending_user_gate` |
| Task ID | `TASK-FIX-PROFILE-SCR-ERR-STG-001` |
| Related workflow | `docs/30-workflows/fix-admin-server-components-render-error-stg/` |
| Implementation targets | `apps/web/src/lib/fetch/authed.ts`, `apps/web/app/(member)/profile/page.tsx` |
| Tests | `apps/web/src/lib/fetch/authed.spec.ts`, `apps/web/app/(member)/profile/page.spec.tsx` |
| Phase 11 result | `docs/30-workflows/completed-tasks/profile-server-components-render-error/outputs/phase-11/manual-test-result.md` |
| Phase 11 canonical paths | `docs/30-workflows/completed-tasks/profile-server-components-render-error/outputs/phase-11/canonical-paths.json` |
| Phase 12 compliance | `docs/30-workflows/completed-tasks/profile-server-components-render-error/outputs/phase-12/phase12-task-spec-compliance-check.md` |

## Phase 1-13 Outputs

| Phase | Path |
| --- | --- |
| 1 | `docs/30-workflows/completed-tasks/profile-server-components-render-error/outputs/phase-1/phase-1.md` |
| 2 | `docs/30-workflows/completed-tasks/profile-server-components-render-error/outputs/phase-2/phase-2.md` |
| 3 | `docs/30-workflows/completed-tasks/profile-server-components-render-error/outputs/phase-3/phase-3.md` |
| 4 | `docs/30-workflows/completed-tasks/profile-server-components-render-error/outputs/phase-4/phase-4.md` |
| 5 | `docs/30-workflows/completed-tasks/profile-server-components-render-error/outputs/phase-5/phase-5.md` |
| 6 | `docs/30-workflows/completed-tasks/profile-server-components-render-error/outputs/phase-6/phase-6.md` |
| 7 | `docs/30-workflows/completed-tasks/profile-server-components-render-error/outputs/phase-7/phase-7.md` |
| 8 | `docs/30-workflows/completed-tasks/profile-server-components-render-error/outputs/phase-8/phase-8.md` |
| 9 | `docs/30-workflows/completed-tasks/profile-server-components-render-error/outputs/phase-9/phase-9.md` |
| 10 | `docs/30-workflows/completed-tasks/profile-server-components-render-error/outputs/phase-10/phase-10.md` |
| 11 | `docs/30-workflows/completed-tasks/profile-server-components-render-error/outputs/phase-11/phase-11.md` |
| 12 | `docs/30-workflows/completed-tasks/profile-server-components-render-error/outputs/phase-12/phase-12.md` |
| 13 | `docs/30-workflows/completed-tasks/profile-server-components-render-error/outputs/phase-13/phase-13.md` |

## Phase 12 Strict 7

| Output | Path |
| --- | --- |
| main | `docs/30-workflows/completed-tasks/profile-server-components-render-error/outputs/phase-12/main.md` |
| implementation guide | `docs/30-workflows/completed-tasks/profile-server-components-render-error/outputs/phase-12/implementation-guide.md` |
| system spec update summary | `docs/30-workflows/completed-tasks/profile-server-components-render-error/outputs/phase-12/system-spec-update-summary.md` |
| documentation changelog | `docs/30-workflows/completed-tasks/profile-server-components-render-error/outputs/phase-12/documentation-changelog.md` |
| unassigned task detection | `docs/30-workflows/completed-tasks/profile-server-components-render-error/outputs/phase-12/unassigned-task-detection.md` |
| skill feedback report | `docs/30-workflows/completed-tasks/profile-server-components-render-error/outputs/phase-12/skill-feedback-report.md` |
| compliance check | `docs/30-workflows/completed-tasks/profile-server-components-render-error/outputs/phase-12/phase12-task-spec-compliance-check.md` |

## Evidence

| Evidence | Status |
| --- | --- |
| Focused Vitest | PASS: `apps/web/src/lib/__tests__/env.spec.ts` + `apps/web/src/lib/fetch/authed.spec.ts` + `apps/web/app/(member)/profile/page.spec.tsx` = 43 tests |
| Web typecheck | PASS: `pnpm --filter @ubm-hyogo/web typecheck` |
| Web lint | PASS: `pnpm --filter @ubm-hyogo/web lint` |
| Static grep guard | PASS: `apps/web/src/lib/fetch/authed.ts` has no `process.env[` and no `127.0.0.1` |
| Staging `/profile` runtime smoke | `pending_user_approval` |
| Commit / push / PR | `pending_user_approval` |

## Lessons Learned

- **L-PROFSCR-001 (parity-by-admin-template)**: Server Component の `try/catch + throw err;` パターンは SCR digest 化を誘発する。同型違反は admin 側の既存 `safeServerFetch` ラップを **template-by-parity** として profile 側へ適用し、`AuthRequiredError` のみ rethrow / それ以外は SectionError UI 降格で固定する。member route group 全体への横展開はフォローアップ候補（possible-lessons-learned）。
- **L-PROFSCR-002 (partial env accessor 追加)**: `getEnv()` の full-schema は API base URL 取得時に PUBLIC fallback まで到達できない。**責務分割した部分 accessor**（`getApiBaseEnv()` 等）を追加し、INTERNAL → PUBLIC → fail-fast の優先順位を accessor 内に閉じ込めると、route 側の env 解決ロジックが消える。
- **L-PROFSCR-003 (localhost fallback 撤去 + grep gate)**: `http://127.0.0.1:8787` のような localhost fallback は Cloudflare Workers では到達不能。**完全撤去**した上で `apps/web/src/lib/fetch/authed.ts` 配下に `process.env[` / `127.0.0.1` リテラル 0 件の grep gate（focused spec の static guard）を置き、regression を CI で即検出する。
- **L-PROFSCR-004 (focused regression spec 三点セット)**: env accessor 経路是正タスクでは「accessor spec（partial parse 契約） + fetch helper spec（INTERNAL→PUBLIC→throw + source guard） + page spec（5xx は SectionError / 401 は redirect）」の **focused vitest 3 spec** を Phase 4 contracts に固定する。broader lint/build/staging smoke は Phase 13 user-gated に残す。

