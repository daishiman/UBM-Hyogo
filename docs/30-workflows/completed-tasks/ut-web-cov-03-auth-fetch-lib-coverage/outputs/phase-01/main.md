# Phase 1 成果物 — ut-web-cov-03-auth-fetch-lib-coverage

[実装区分: 実装仕様書]

> ユーザー指定 `taskType=docs-only` に対し、目的達成に Vitest テストファイル新規作成が必須のため、CONST_004 実態優先原則に基づき実装仕様書として作成。

- status: pending（実装フェーズで実測 capture）
- purpose: 要件定義
- evidence: <TBD: 実装・実測時に capture。仕様書作成時点では placeholder>

## 要件サマリ

apps/web の auth / fetch / session lib 7 ファイルに対する Vitest unit test を新規作成し、coverage を Stmts/Lines/Funcs ≥85%, Branches ≥80% に到達させる。

## 起票根拠

- 2026-05-01 実測 `apps/web/coverage/coverage-summary.json` 全体: Lines = 39.39%
- 対象 7 ファイル現状: いずれも 0%

## 対象ファイル

| ファイル | 行数 | test 新規作成 |
| --- | --- | --- |
| `apps/web/src/lib/auth.ts` | 391 | `auth.test.ts` |
| `apps/web/src/lib/auth/magic-link-client.ts` | 55 | `magic-link-client.test.ts` |
| `apps/web/src/lib/auth/oauth-client.ts` | 19 | `oauth-client.test.ts` |
| `apps/web/src/lib/session.ts` | 25 | `session.test.ts` |
| `apps/web/src/lib/fetch/authed.ts` | 73 | `authed.test.ts` |
| `apps/web/src/lib/fetch/public.ts` | 102 | `public.test.ts` |
| `apps/web/src/lib/api/me-types.ts` | 39 | Phase 4 で除外 or `test-d.ts` |

## AC ↔ evidence path

| AC ID | 内容 | evidence |
| --- | --- | --- |
| AC-1 | 7 ファイル全 ≥85%/80% | `apps/web/coverage/coverage-summary.json` |
| AC-2 | auth client 4 ケース | `auth.test.ts` report |
| AC-3 | fetch wrapper 5 ケース | `authed.test.ts`, `public.test.ts` |
| AC-4 | me-types round-trip | `me-types.test-d.ts` or coverage exclude |
| AC-5 | regression なし | `pnpm --filter web test` 全 pass |
| AC-6 | typecheck / lint | `pnpm typecheck` / `pnpm lint` |

## 自走禁止 / approval gate

- 自走禁止: deploy / commit / push / PR 作成
- Phase 13 PR 作成のみ user approval 必須

## scope

- in: 上記 7 ファイル
- out: admin lib / UI / E2E / production load test / apps/api

## 次 Phase への引き継ぎ

AC 一覧、対象 7 ファイル、evidence path、approval gate、scope を Phase 2 へ。
