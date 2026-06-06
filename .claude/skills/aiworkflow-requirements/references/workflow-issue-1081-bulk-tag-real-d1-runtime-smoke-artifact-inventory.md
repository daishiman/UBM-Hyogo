# issue-1081 bulk tag real D1 runtime smoke artifact inventory

## Workflow

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/issue-1081-bulk-tag-real-d1-runtime-smoke/` |
| status | `implemented_local_evidence_captured / implementation / NON_VISUAL / staging_runtime_pending_user_gate` |
| issue | #1081 CLOSED 維持（Issue mutation は user-gated） |
| source | `docs/30-workflows/unassigned-task/task-issue-1036-followup-005-bulk-tag-real-d1-runtime-smoke.md`（consumed・`formalized_consumed_local_implementation_done`・unassigned-task/ に trace 残置） |
| parent | issue #1036 `POST /admin/members/tags/bulk` endpoint landed（実装変更しない） |

## Implementation

| path | change |
| --- | --- |
| `scripts/smoke/runtime-tag-bulk.sh` | staging Workers + real D1 への bulk tag smoke runner（env/production guard・redaction・summary.json・fail-closed contract assertion）を新規実装 |
| `apps/api/migrations/seed/bulk-tag-staging-seed.sql` | `e2e_test_issue1081_` prefix の synthetic 行 seed + `member_tags` 初期 zero-out DELETE |
| `apps/api/migrations/seed/bulk-tag-staging-cleanup.sql` | prefix scope 限定 DELETE による cleanup |
| `.github/workflows/runtime-smoke-staging.yml` | `bulk-tag-runtime-smoke` job 追加（protected environment / user-gated 実走） |
| `package.json` | `pnpm smoke:test` に `runtime-tag-bulk.test.sh` を追加 |

## Tests

| path | 種別 |
| --- | --- |
| `scripts/smoke/__tests__/runtime-tag-bulk.test.sh` | network-free shell stub test（PATH-based fake curl / cf.sh 注入・引数解析 / production guard / redaction / contract assertion） |

## Evidence

| evidence | result |
| --- | --- |
| local shell test | `runtime-tag-bulk.test.sh` PASS（`outputs/phase-11/evidence/runtime-tag-bulk-test.log`） |
| actionlint | PASS（`outputs/phase-11/evidence/runtime-tag-bulk-actionlint.log`） |
| `pnpm smoke:test` | PASS |
| Phase 11 | `outputs/phase-11/manual-test-result.md`（local present / staging real D1 行は pending） |
| Phase 12 | strict 7 present, `outputs/phase-12/phase12-task-spec-compliance-check.md`（ok:true / ancestor:false） |

## Boundary

endpoint contract / D1 schema / IPC / UI route / auth 方式 / Cloudflare Secret は変更なし。response は既存 `{ batchId, results[] }`、fixture prefix は `e2e_test_issue1081_` 固定、production guard は staging DB（`ubm-hyogo-db-staging`）固定。Cloudflare staging deploy・real D1 seed/mutation/cleanup の実走、commit、push、PR、Issue #1081 state 変更は user-gated。

## Lessons

- [lessons-learned-issue-1081-bulk-tag-real-d1-runtime-smoke-2026-06.md](lessons-learned-issue-1081-bulk-tag-real-d1-runtime-smoke-2026-06.md) — L-I1081-001..009（issue 本文 vs 実装 contract 乖離固定 / audit correlation_id 欠落の prefix count 代替 / seed DELETE zero-out / user-gated 境界の語彙 / cleanup WHERE scope static check / secret fail-closed exit 2 / production guard 多層 + exit code 区分 / PATH-based provider injection / `.test.sh` invariant #8 非抵触 + read-only 監査 Bash mover 無断 close-out の active-root 前提 revert）
