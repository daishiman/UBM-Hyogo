# Phase 11 Summary — Manual OAuth Smoke

Status: `partial_runtime_execution` （2026-05-01 更新）

Phase 11 は部分的に実行され、Stage A の主要 smoke と F-09 staging を含む 4 件が PASS / EXPECTED FAIL で確定。Stage B / C は **build 失敗 (P11-PRD-002 [HIGHEST])** がブロッカーとなり進捗不可。残作業は全件未タスク化済。

## Execution State

| Stage | Required evidence | Current state |
| --- | --- | --- |
| Stage A: staging smoke | `outputs/phase-11/staging/` screenshots, curl/session JSON, `wrangler-dev.log` | **PARTIAL**: M-01 / M-02 / M-11 / F-09 PASS。M-03 BLOCKED/PARTIAL（unregistered redirect）、M-04..M-10 / F-15 / F-16 / B-01 は session 不発行で SKIPPED または TBD |
| Stage B: production verification | consent-screen.png, verification-submission.md, URL 200 checks | **BLOCKED**: build 失敗で deploy 不可。`/`, `/members` は 500 (P11-PRD-003)、`/privacy`, `/terms` は 404 (P11-PRD-004)。`/login`, `/register`, `/admin` redirect, `/api/auth/*` (GET) は 200 |
| Stage C: production login smoke | login-smoke.png, login smoke log, production secrets list | **BLOCKED**: Stage B 未達。`/wrangler-login-absence.txt` (production) のみ PASS |

## Discovered Issues / 未タスク化状況

詳細は `discovered-issues.md` 参照。HIGH 以上は全件未タスク化済み。

| ID | 優先度 | 未タスク |
| --- | --- | --- |
| P11-PRD-002 | **Highest** | `task-05a-build-prerender-failure-001.md` (Issue #385) |
| P11-PRD-003 | High | `task-05a-fetchpublic-service-binding-001.md` |
| P11-PRD-004 | High | `task-05a-privacy-terms-pages-001.md` |
| P11-STG-004 (M-08) | High | `task-05a-auth-ui-logout-button-001.md` (既存) |
| P11-PRD-005 | Medium | `task-05a-form-preview-503-001.md` |
| P11-OBS-001 | Low | `task-05a-runbook-curl-method-fix-001.md` |

## Gate

Phase 12 では本 `partial_runtime_execution` ステータスと未タスクへの委譲を記録するに留め、B-03 を released として扱ってはならない。Stage B / C 完了は `task-05a-build-prerender-failure-001` 解消後に再着手する。

## 完了済 Local 修正（deploy 待ち）

build 失敗で deploy できないが local には反映済の修正:

- `apps/web/wrangler.toml` の `PUBLIC_API_BASE_URL` / `INTERNAL_API_BASE_URL` 追加（staging / production vars）
- `apps/web/src/lib/fetch/public.ts` の service-binding 経路書き換え
- `apps/web/app/privacy/page.tsx` / `apps/web/app/terms/page.tsx` の暫定実装
- `apps/web/app/global-error.tsx` の minimal client component 追加（build 改善には未到達）

## Screenshot State

`outputs/phase-11/staging/` に M-11 関連 evidence あり。`outputs/phase-11/production/` は URL check と wrangler-login-absence のみ。consent-screen.png 等の Google OAuth verification 用 screenshot は Stage B 未実施のため未取得。
