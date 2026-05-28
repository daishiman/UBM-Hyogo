# Phase 10: 最終レビュー

## 10.1 Acceptance Criteria 突合

| AC ID | 状態 | 確認方法 |
| --- | --- | --- |
| AC-01 | runtime_pending | Phase 11 staging `/profile` 200 確認は user-gated |
| AC-02 | PASS | `authed.ts` の `process.env[` 撤去を focused spec source guard で固定 |
| AC-03 | PASS | `FALLBACK_INTERNAL_API` / 127.0.0.1 リテラル削除を focused spec source guard で固定 |
| AC-04 | PASS | `getApiBaseEnv()` 経由 + fail-fast throw を `authed.spec.ts` で固定 |
| AC-05 | PASS | `profile/page.tsx` 初回 `/me` の `safeServerFetch` 化を実装 |
| AC-06 | PASS | `authed.spec.ts` regression 追加済み |
| AC-07 | PASS | `profile/page.spec.tsx` regression 追加済み |
| AC-08 | PASS | grep gate（`process.env[` 0 / `127.0.0.1` 0）を source guard で固定 |
| AC-09 | runtime_pending | broader `typecheck` / `lint` / build / verify-pr-ready は Phase 13 gate |

## 10.2 ブロッカー判定

| 項目 | 判定 |
| --- | --- |
| local focused scope | PASS（実装済み・focused Vitest 43 PASS + web typecheck PASS） |
| runtime staging evidence | user-gated |
| commit / push / PR | user-gated |

## 10.3 MINOR 指摘

- `apps/web/src/lib/fetch/public.ts` は `getPublicFetchEnv()` 経由で env.ts に集約済みであり、本タスクの漏れではない。
- Sentry profile scope alert は既存運用範囲で扱い、新規未タスク化しない。
