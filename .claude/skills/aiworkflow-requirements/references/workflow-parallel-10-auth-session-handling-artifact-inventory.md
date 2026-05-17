# parallel-10 Auth Session Handling Artifact Inventory

## Metadata

| Item | Value |
| --- | --- |
| Task ID | parallel-10-auth-session-handling |
| Workflow | `docs/30-workflows/parallel-10-auth-session-handling/` |
| Origin spec | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-10-auth-session-handling/spec.md` |
| Status | `implemented_local_evidence_captured / implementation / NON_VISUAL / Phase 11 evidence captured / Phase 13 blocked_pending_user_approval` |
| Sync date | 2026-05-15 |
| Phase 13 | `pending_user_approval`（commit / push / PR が user gate） |
| Parent workflow | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/`（UI prototype alignment MVP recovery 全体） |

## Current Facts

| Layer | Artifact |
| --- | --- |
| Client hook（新規） | `apps/web/src/features/admin/hooks/useAdminMutation.ts`（401/403 統一処理 + DI 境界 + `{trigger, isLoading, error, reset}` 返却） |
| Client hook index | `apps/web/src/features/admin/hooks/index.ts`（公開 re-export） |
| Toast primitive | `apps/web/src/components/ui/Toast.tsx`（`toast(message, variant?: "alert" \| "status")` 後方互換拡張 / `role="alert"` 出し分け） |
| Redirect util | `apps/web/src/lib/url/safe-redirect.ts`（`normalizeRedirectPath` の `/login` self-redirect fallback 強化） |
| Login redirect builder | `apps/web/src/lib/url/login-redirect.ts`（既存、本タスクで仕様再検証） |
| Auth API contract | `apps/web/src/lib/fetch/authed.ts`（既存 `AuthRequiredError` / `FetchAuthedError` を仕様化） |
| Auth.js session | `apps/web/src/lib/auth.ts`（既存、silent refresh 不採用判断のみ） |
| Hook unit tests | `apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts`（401 redirect / 403 alert toast / その他 error state / `{trigger,isLoading,error,reset}` の 4 経路） |
| Toast unit tests | `apps/web/src/components/ui/Toast.spec.tsx`（`role="alert"` / `role="status"` variant 描画と既存 API 後方互換） |
| Redirect unit tests | `apps/web/src/lib/url/login-redirect.spec.ts`（`/admin` / `//evil.com` / `http://evil.com` / 連続 backslash / `%2F` decode の 5 ケース） |
| System spec | `docs/00-getting-started-manual/specs/02-auth.md`（§Client 401 / 403 ハンドリング 新設、本 hook を正本参照） |
| Phase outputs | `docs/30-workflows/parallel-10-auth-session-handling/outputs/phase-{01..13}/` |
| Phase 12 strict 7 | `outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md` |
| Phase 11 evidence | `outputs/phase-11/evidence/{typecheck,lint,test,build}.txt`, `outputs/phase-11/visual-verification-skip.md`（NON_VISUAL） |

## Contract

- `useAdminMutation(endpoint, method, options?)` は client hook（`"use client"` 必須）。`options.redirector` / `options.toaster` / `options.currentPath` を optional DI とし、test では mock 注入。
- 戻り値: `{ trigger: (body?) => Promise<TResp \| undefined>, isLoading: boolean, error: Error \| null, reset: () => void }`。
- catch 順序: `AuthRequiredError` → `FetchAuthedError(status === 403)` → 汎用 `Error`。
- 401 経路: `toLoginRedirect(currentPath)` で `/login?redirect=<encoded>` を生成し `redirector(url)` 経由で navigation。`normalizeRedirectPath` で open redirect 防止（`//evil.com` / `http://...` / `/login...` self-redirect は fallback）。
- 403 経路: `toaster("権限がありません", "alert")` + `setError(err)`。`ToastProvider` 未配置時は logger warning のみ throw しない。
- `Toast` variant: `"alert"` → `aria-live="assertive"` + `role="alert"`、`"status"` → 既存 `aria-live="polite"` + `role="status"`。default は `"status"`（後方互換）。
- SSR では `isBrowser()` guard で navigation を no-op 化。`window` 直接参照は hook 本体禁止（`no-restricted-globals: window` lint rule 遵守）。
- silent refresh は MVP 不採用。Auth.js JWT 24h TTL 範囲内の expiry は 401 catch → redirect で吸収。

## AC to Runtime Path

| AC | Runtime path | Evidence kind |
| --- | --- | --- |
| AC-1 401/403/200/500/network throw 仕様 | `apps/web/src/lib/fetch/authed.ts` → vitest unit | unit test report |
| AC-2 401 redirect / 403 toast / その他 error | `useAdminMutation` → mock redirector/toaster | hook unit test |
| AC-3 `{trigger, isLoading, error, reset}` 公開 API | `useAdminMutation` 戻り値 | hook unit test |
| AC-4 open redirect 5 ケース | `normalizeRedirectPath` / `toLoginRedirect` | redirect spec |
| AC-5 silent refresh 採否判断 | `outputs/phase-02/auth-session-policy.md` | docs |
| AC-6 `role="alert"` variant | `Toast.tsx` + `Toast.spec.tsx` | toast unit test |
| AC-7 設計レビュー GO/NO-GO | `outputs/phase-03/design-review.md` | docs |
| AC-8 typecheck/lint/test/build 0 | `outputs/phase-11/evidence/*.txt` | local evidence log |
| AC-9 Phase 12 strict 7 | `outputs/phase-12/*.md` | docs |

## Phase 12 Required Files

| File | Status |
| --- | --- |
| `outputs/phase-12/main.md` | present |
| `outputs/phase-12/implementation-guide.md` | present |
| `outputs/phase-12/system-spec-update-summary.md` | present |
| `outputs/phase-12/documentation-changelog.md` | present |
| `outputs/phase-12/unassigned-task-detection.md` | present（新規未タスク 0 件、3 件のスコープ外決定根拠を残置） |
| `outputs/phase-12/skill-feedback-report.md` | present |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | present |

## Same-wave Sync Targets

- `indexes/resource-map.md`（parallel-10 行に lessons-learned / inventory / 02-auth § リンクを反映）
- `indexes/quick-reference.md`（§parallel-10 Auth Session Handling 早見表）
- `references/task-workflow-active.md`（§parallel-10-auth-session-handling に inventory / lessons リンク行追加）
- `references/lessons-learned-parallel-10-auth-session-handling-2026-05.md`（同 wave 新規）
- `docs/00-getting-started-manual/specs/02-auth.md`（§Client 401 / 403 ハンドリング 新設）

## Out of Scope / Deferred

- API 側（`apps/api`）の 401/403 応答仕様変更 → 既存 contract 維持
- D1 schema / Google Form 仕様変更 / 新規 API endpoint 追加 → 不変条件 #4 / #5 遵守
- Auth.js silent refresh / token renew endpoint 新設 → Workers Paid 移行 + refresh token 整備時に再検討（unassigned-task 起票なし、本 inventory と `02-auth.md` で根拠保持）
- Storybook 追加 → 既存運用なし
- e2e（Playwright）新規シナリオ → 既存 e2e の 401 redirect 観測のみ
- 既存 `apps/web` 個別 mutation の `useAdminMutation` 置換 → 後続 follow-up task として個別計画

## Related Lessons / References

- `references/lessons-learned-parallel-10-auth-session-handling-2026-05.md`（L-PARA10-001〜006）
- `references/lessons-learned-06b-a-me-api-authjs-session-resolver-2026-05.md`（隣接: `/me` session resolver）
- `references/architecture-implementation-patterns-core.md`（client hook side-effect DI / SSR client 境界）
- `references/api-endpoints.md`（admin mutation 401/403 cross-link）
- `docs/00-getting-started-manual/specs/02-auth.md` §Client 401 / 403 ハンドリング
- `docs/00-getting-started-manual/specs/13-mvp-auth.md`（MVP silent refresh 不採用根拠）
