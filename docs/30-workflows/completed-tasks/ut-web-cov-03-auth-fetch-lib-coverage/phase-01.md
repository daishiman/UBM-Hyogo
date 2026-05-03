# Phase 1: 要件定義 — ut-web-cov-03-auth-fetch-lib-coverage

[実装区分: 実装仕様書]

> 本仕様書は、ユーザー指定 `taskType=docs-only` に対し、目的達成（apps/web 7 ファイルの Vitest unit test coverage を Stmts/Lines/Funcs ≥85%, Branches ≥80% に引き上げ）には新規 `*.test.ts` ファイルの作成とコード実装が必須となる。
> よって CONST_004（実態優先原則）に従い、本タスクを **実装仕様書** として再定義する。旧 `taskType=docs-only` は誤りであり、本仕様書のメタ情報では `taskType=implementation` を正とする。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-web-cov-03-auth-fetch-lib-coverage |
| phase | 1 / 13 |
| wave | ut-coverage |
| mode | parallel |
| 作成日 | 2026-05-01 |
| 改訂日 | 2026-05-03 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

apps/web の auth / fetch / session lib 7 ファイルに対する Vitest unit test を新規作成し、coverage を Stmts/Lines/Funcs ≥85%, Branches ≥80% に到達させる。
本 Phase では、未完了の真因、scope、依存境界、AC、evidence path、approval gate を確定する。

## 起票根拠と現状

- 2026-05-01 実測 `apps/web/coverage/coverage-summary.json` 全体: Lines = 39.39%
- 対象 7 ファイルの現状値（Stmts / Lines / Funcs / Branches）はいずれも 0%（テスト未存在）。

| 対象ファイル | 行数 | 概要 |
| --- | --- | --- |
| `apps/web/src/lib/auth.ts` | 391 | Auth.js v5 設定、`fetchSessionResolve` / `buildAuthConfig` / signIn・jwt・session callbacks / providers / `getAuth` lazy loader |
| `apps/web/src/lib/auth/magic-link-client.ts` | 55 | `sendMagicLink(email, redirect)` POST `/api/auth/magic-link`、`MagicLinkRequestError` / `isLoginGateState` |
| `apps/web/src/lib/auth/oauth-client.ts` | 19 | `signInWithGoogle(redirect?)` next-auth/react dynamic import |
| `apps/web/src/lib/session.ts` | 25 | `getSession()` SessionUser を返す |
| `apps/web/src/lib/fetch/authed.ts` | 73 | `fetchAuthed<T>(path, init)` cookie 転送、401→AuthRequiredError、非2xx→FetchAuthedError |
| `apps/web/src/lib/fetch/public.ts` | 102 | `fetchPublic<T>` / `fetchPublicOrNotFound<T>` service-binding 経路 + 通常 fetch 経路 |
| `apps/web/src/lib/api/me-types.ts` | 39 | 型のみ（type-only file）。coverage 除外候補（Phase 4 で意思決定） |

## 実行タスク

1. 起票根拠と対象ファイル一覧を確認する。完了条件: 上表が確定する。
2. AC を箇条書きで再定義し、evidence path を対応付ける。完了条件: AC ↔ evidence path 表が完成する。
3. user approval / 自走禁止操作を分離する。完了条件: PR 作成のみが Phase 13 user approval 必須として明記される。
4. scope in/out を確定する。完了条件: out-of-scope（admin lib / UI / production load test）が明記される。

## AC（Acceptance Criteria）と evidence path

| AC ID | AC 内容 | evidence path |
| --- | --- | --- |
| AC-1 | 対象 7 ファイル（me-types.ts は除外判定後）すべてで Stmts/Lines/Funcs ≥85%, Branches ≥80% | `apps/web/coverage/coverage-summary.json` の `apps/web/src/lib/auth.ts` 等の各キー |
| AC-2 | `auth.ts` 配下の auth client が happy / token-missing / token-invalid / network-fail の 4 ケースを網羅 | `apps/web/src/lib/auth.test.ts` の test report |
| AC-3 | fetch wrapper（authed.ts / public.ts）が 200 / 401 / 403 / 5xx / network-fail を網羅 | `apps/web/src/lib/fetch/authed.test.ts`、`apps/web/src/lib/fetch/public.test.ts` |
| AC-4 | `me-types.ts` は zod or type predicate の round-trip を担保（または coverage 除外 + `*.test-d.ts` で型 round-trip） | Phase 4 decision log + `apps/web/src/lib/api/me-types.test-d.ts`（採用時） |
| AC-5 | 既存 web test に regression なし | `mise exec -- pnpm --filter web test` 全 pass |
| AC-6 | typecheck / lint pass | `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` |

## 自走禁止 / approval gate

- 自走禁止: deploy（`scripts/cf.sh deploy ...`）、`git commit`、`git push`、PR 作成。
- Phase 13 PR 作成のみ user approval 必須。実装着手（Phase 5 以降）は user approval 不要。

## scope

- in-scope: 上記 7 ファイル（apps/web/src/lib 配下の auth / auth/* / fetch/* / session / api/me-types）。
- out-of-scope: apps/web 配下の admin lib、UI コンポーネント、E2E、production load test、apps/api。

## 変更対象ファイル一覧（CONST_005）

- 新規作成（test）:
  - `apps/web/src/lib/auth.test.ts`
  - `apps/web/src/lib/auth/magic-link-client.test.ts`
  - `apps/web/src/lib/auth/oauth-client.test.ts`
  - `apps/web/src/lib/session.test.ts`
  - `apps/web/src/lib/fetch/authed.test.ts`
  - `apps/web/src/lib/fetch/public.test.ts`
  - （AC-4 採用ルートにより）`apps/web/src/lib/api/me-types.test-d.ts`
- 新規作成（test helper）:
  - `apps/web/src/test-utils/fetch-mock.ts`
- 設定変更（候補・Phase 4 で確定）:
  - root `vitest.config.ts` の `coverage.exclude` に `apps/web/src/lib/api/me-types.ts` を追記
- 既存 lib の変更: 原則なし。`auth.ts` は既に `fetchImpl` / `providerFactories` の DI 受け口を備えており追加変更不要。

## 参照資料

- 起票根拠: 2026-05-01 実測 apps/web coverage（lines=39.39%）
- `docs/00-getting-started-manual/specs/02-auth.md`
- `docs/00-getting-started-manual/specs/13-mvp-auth.md`
- root `vitest.config.ts`（既存 coverage 設定）

## 実行手順

- 対象 directory: `docs/30-workflows/ut-web-cov-03-auth-fetch-lib-coverage/`
- 本仕様書作成ではアプリケーションコード、deploy、commit、push、PR 作成を行わない。
- 実装・実測時は Phase 5 / Phase 11 の runbook と evidence path に従う。
- ローカル実行コマンド: `mise exec -- pnpm --filter web test:coverage`

## 統合テスト連携

- 上流: 05a-authjs-google-oauth-admin-gate, 05b-B-magic-link-callback-credentials-provider
- 関連 quality gate: 06b-A-me-api-authjs-session-resolver; release readiness handoff: 09b-A-observability-sentry-slack-runtime-smoke

## 多角的チェック観点

- #2 responseId/memberId separation
- #5 public/member/admin boundary
- #6 apps/web D1 direct access forbidden（fetch wrapper 経由のみ／test 内でも遵守）
- 未実装/未実測を PASS と扱わない。
- placeholder と実測 evidence を分離する。
- 不変条件 #5（D1 への直接アクセスは apps/api に閉じる）を test mock 内でも侵さない。

## サブタスク管理

- [ ] 起票根拠 / 対象 7 ファイル現状値を確認する
- [ ] AC ↔ evidence path 表を確定する
- [ ] 自走禁止 / approval gate を明記する
- [ ] scope in/out を確定する
- [ ] outputs/phase-01/main.md を作成する

## 成果物

- `outputs/phase-01/main.md`

## 完了条件

- 全対象 Stmts/Lines/Funcs ≥85% / Branches ≥80%（最終 Phase での達成目標）
- auth client は happy / token-missing / token-invalid / network-fail の 4 ケース
- fetch wrapper は 200 / 401 / 403 / 5xx / network-fail を網羅
- me-types は zod or type predicate の round-trip（除外採用時は test-d.ts で代替）
- 既存 web test に regression なし
- 本 Phase では上記 AC・evidence path・自走禁止が文書化されていれば DoD を満たす。

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 2 へ以下を渡す: AC ID 一覧、対象 7 ファイル、evidence path、approval gate（Phase 13 PR 作成）、自走禁止操作、scope in/out。
