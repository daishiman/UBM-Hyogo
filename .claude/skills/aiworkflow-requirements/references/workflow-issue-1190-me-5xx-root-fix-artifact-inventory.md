# workflow-issue-1190-me-5xx-root-fix Artifact Inventory

## Metadata

| Item | Value |
| --- | --- |
| workflow | `issue-1190-me-5xx-root-fix` |
| status | `implemented_local_evidence_captured / implementation / NON_VISUAL / staging_runtime_pending_user_gate` |
| canonical root | `docs/30-workflows/completed-tasks/issue-1190-me-5xx-root-fix/` |
| related issue | #1190 |

## Implemented Targets

| Area | Files |
| --- | --- |
| API route | `apps/api/src/routes/me/index.ts` |
| API middleware | `apps/api/src/middleware/session-guard.ts` |
| Contract tests | `apps/api/src/routes/me/index.contract.spec.ts` |
| Workflow docs | `docs/30-workflows/completed-tasks/issue-1190-me-5xx-root-fix/**` |

## Evidence

| Check | Result |
| --- | --- |
| issue-focused D1 contract tests | PASS, 6 passed |
| full `/me` contract spec | PASS, 34 passed |
| API typecheck | PASS |
| API lint | PASS |

## Invariants

- `/me` path, response shape, and status taxonomy remain unchanged.
- D1 schema, Google Form schema, and new endpoint surface are unchanged.
- `apps/web` remains untouched; existing profile 5xx degrade UI is reused.
- Error response does not expose memberId or email; scope identifiers are literal internal strings only.

## Lessons Learned

- **L-I1190MX-001（deferred_pending_root_cause からの static-audit promotion）**: 起票時ブロッカー `deferred_pending_root_cause`（staging 真因確定待ち）でも、現行コードの静的監査で 5xx 発生経路（P1-P8）と例外分類点を実測特定できれば、真因が H3/H4/H5 のどれでも価値が出る欠陥（F-1 fail-soft 不統一 / F-2 `UBM-5001` 分類不足 / F-3 契約テスト不在）へ問題を再定義し、same-cycle implementation へ昇格できる。実機 evidence 待ちで止めない。
- **L-I1190MX-002（一次データ classify / 二次データ fail-soft の分離）**: 同じ D1 例外でも、session / profile builder の一次データは `UBM-5001` + literal scope で classify+rethrow（500 は意図された status として維持）し、`pendingRequests` のような二次データは `photoUrl` / `editResponseUrl` の既存 fail-soft 前例に倣い `{}` へ degrade して 200 を保つ。status taxonomy は不変のまま、回避可能な全体 500 のみ根治する。
- **L-I1190MX-003（Miniflare D1 共有 fixture は直列実測で件数確定）**: contract spec の PASS 件数は「並列実行の偶然の緑」で記録しない。`vitest.d1.config.ts`（pool: forks / singleFork: true）で直列再実行し、issue-focused 6 PASS と full `/me` contract 34 PASS の両方を確認してから台帳へ記録する。本サイクルでは初回記録に `32` の stale 値が混入し、直列再実測で `34` に確定・全同期面を是正した。
- **L-I1190MX-004（PII 非露出 + stack 非捏造）**: error response / log context には literal scope 文字列（`me-session-guard` / `me-profile-builder` / `me-pending-requests`）と cause / stack のみを載せ、memberId / email は出さない。non-Error 例外では `err.stack` 未定義のため `log.stack` を付与しない（stack 捏造禁止）。各 contract test で response・log 双方に対し memberId / email 非包含を assert する。
- **L-I1190MX-005（擬似コード→実シグネチャ契約確認）**: SSOT の擬似コードは設計意図であり実シグネチャの正本ではない。`ApiError` は `{ code, log: { cause, context } }` であり擬似コードの `{ code, cause, context }` ではない。Phase 1/2 で実コードを Read して乖離を明示してから実装する。

anti-pattern:
- ❌ 静的監査で例外経路と deterministic local test が確定できるのに `deferred` のまま実装を先送りする。
- ❌ 二次データの D1 例外で `/me/profile` 全体を 500 にする（fail-soft 前例があるのに）。
- ❌ Miniflare D1 共有 fixture の並列実行で得た件数をそのまま台帳へ記録する。

## User-Gated

Commit, push, PR, Issue #1190 mutation, staging deploy, and staging tail verification remain user-gated.
