# issue-385-web-build-global-error-prerender-fix

## wave / mode / owner

| 項目 | 値 |
| --- | --- |
| wave | issue-385 |
| mode | serial |
| owner | - |
| 作成日 | 2026-05-02 |
| 改訂日 | 2026-05-03 |
| 状態 | implemented-local / implementation / NON_VISUAL |
| visualEvidence | NON_VISUAL |
| taskType | implementation |
| workflow_state | implemented-local |
| GitHub Issue | #385（CLOSED 状態のまま扱う。Issue reopen / PR 作成は user 承認後） |

## 実装区分

`[実装区分: 実装仕様書]`

本タスクは **コード実装を必ず実施する実装仕様書**。CONST_004 デフォルトに従う。本タスクのスコープ内で `apps/web` 配下のコード変更・build 実測 evidence 取得まで完結させる（CONST_007 単一サイクル原則）。deploy / commit / push / PR は **user 指示後** に行う。

## purpose

`apps/web` の `pnpm build` / `pnpm build:cloudflare` が Next.js 16.2.4 + React 19.2.5 環境で `/_global-error` および `/_not-found` の prerender 段階で `TypeError: Cannot read properties of null (reading 'useContext')` により失敗し、staging / production への新規 deploy が完全ブロックされている事象を恒久解消する。

## 真因（2026-05-03 改訂・実装試行で確定）

初版仕様書は「`apps/web/app/global-error.tsx` の `"use client"` 撤廃 + RSC 化」を first choice としていたが、以下を 2026-05-02〜03 の実装試行で確認:

1. Next 16 は `app/global-error.tsx` に `"use client"` を **必須** としており、RSC 化は build 時 type/convention error で拒否される（Next 公式仕様）
2. `next` を `16.2.3` / `16.3.0-canary.8` へ変更しても再現
3. `react` / `react-dom` を `19.2.4` にダウングレードしても再現
4. Turbopack / webpack いずれの bundler でも再現
5. `app/global-error.tsx` を削除して Next 内蔵 default を使っても再現
6. `force-dynamic` / `dynamic = 'error'` 等の route segment config も無効
7. **`apps/web/package.json` から `next-auth` を完全除去すると `useContext` null エラーが build ログから完全消失**

→ **真因確定**: `apps/web/src/lib/auth.ts` での `import NextAuth from "next-auth"` 等 top-level import が、Next 16 + React 19 build 時の prerender worker で次の連鎖を引き起こす:

- next-auth 5.x の `lib/index.js` / `lib/actions.js` / `lib/env.js` が `next/headers` `next/server` `next/navigation` を CommonJS-like ESM で import
- `@auth/core` / `next-auth/react` 配下が module-init 時に `React.createContext(undefined)` を実行
- これが Next 16 内蔵 `_global-error` / `_not-found` の prerender 時に React Dispatcher の解決順を破壊し `useContext` が null を返す

GitHub `vercel/next.js` issue #86178 / #84994 / #85668 / #87719 で同症状が複数報告されており、**コミュニティ confirm された汎用 workaround は存在しない**。本タスクでは upstream 修正を待たず、本リポ側で恒久 workaround を実装する。

## 解決方針（Plan A — lazy factory パターン）

`next-auth` モジュールを **build 時 prerender 経路から完全に隔離** し、各 route handler 実行時にのみ動的 import で読み込ませる。

| 対象 | 変更方針 |
| --- | --- |
| `apps/web/src/lib/auth.ts` | top-level の `import NextAuth, GoogleProvider, CredentialsProvider, JWT type` を削除。`getAuth()` lazy factory を export し、内部で `await import("next-auth")` 等を行う。`buildAuthConfig` / `fetchSessionResolve` 等の純粋関数は据え置き |
| `apps/web/src/lib/auth/oauth-client.ts` | top-level `import { signIn } from "next-auth/react"` を関数内 dynamic import に置換（PoC 動作確認済） |
| `apps/web/app/api/auth/[...nextauth]/route.ts` | `export { GET, POST }` 直接再 export を `async function GET(req) { const { handlers } = await getAuth(); return handlers.GET(req); }` 形式に置換 |
| `apps/web/app/api/auth/callback/email/route.ts` | `signIn` 呼び出し直前に `const { signIn } = await getAuth();` |
| `apps/web/app/api/admin/[...path]/route.ts` | `auth()` 呼び出し直前に `const { auth } = await getAuth();` |
| `apps/web/app/api/me/[...path]/route.ts` | 同上 |
| `apps/web/middleware.ts` | 変更不要（next-auth 直接 import なし、`decodeAuthSessionJwt` のみ使用） |
| `apps/web/next.config.ts` | 変更不要（`serverExternalPackages` は ESM 解決問題を新たに招くため不採用） |
| `apps/web/package.json` | 変更不要（next / react / next-auth 全て据え置き） |

採用しない案（理由付き）:

| 案 | 不採用理由 |
| --- | --- |
| `next` patch upgrade | 16.2.5 不存在。canary でも未修正 |
| `react` downgrade | 19.2.4 でも再現。19.x major bump は依存破壊 |
| `serverExternalPackages: ["next-auth", "@auth/core"]` | useContext は解消するが、next-auth/lib が `next/server` を `.js` 拡張子なし ESM import するため `ERR_MODULE_NOT_FOUND` を新たに招く。pnpm patch で extension 追加すれば動くが、依存メンテ負荷が大きい |
| `pnpm patch next-auth@5.0.0-beta.25` で extension 追加 | 上の方策と組み合わせれば動作するが、next-auth bump 時に毎回 patch 再生成が必要。lazy factory より保守性が劣る |
| `app/global-error.tsx` 削除 | Next 内蔵 default でも同じ useContext null 再現するため無効 |
| Next.js 上流修正待ち | 修正版リリース時期未定。staging/production deploy ブロック継続不可 |

## scope in / out

### Scope In

- `apps/web/src/lib/auth.ts` の lazy factory 化（`getAuth()` export、top-level next-auth import 撤廃）
- `apps/web/src/lib/auth/oauth-client.ts` の `next-auth/react` 動的 import 化
- `apps/web/app/api/auth/[...nextauth]/route.ts` の handlers 取得経路を lazy factory 経由へ
- `apps/web/app/api/auth/callback/email/route.ts` の signIn 呼び出しを lazy factory 経由へ
- `apps/web/app/api/admin/[...path]/route.ts` の auth() 呼び出しを lazy factory 経由へ
- `apps/web/app/api/me/[...path]/route.ts` の auth() 呼び出しを lazy factory 経由へ
- 関連テスト (`route.test.ts` 等) の mock / import path 整合
- `pnpm typecheck` / `pnpm lint` / `pnpm build` / `pnpm build:cloudflare` の全 PASS
- build ログから `useContext` null エラーが消失することの evidence 取得（outputs/phase-11/）
- `apps/web/.open-next/worker.js` の生成確認

### Scope Out

- ブロック対象タスク本体（P11-PRD-003 fetchPublic 経路書き換え, P11-PRD-004 `/privacy` `/terms` ページ実装, `wrangler.toml` の API URL 追加 deploy）の実装
- staging / production への deploy 実行
- `next` / `react` / `react-dom` の version bump
- `next-auth` の major / minor / patch upgrade（5.0.0-beta.25 維持）
- `next.config.ts` 設定変更（`serverExternalPackages` 等）
- `pnpm patch` 適用
- D1 / API 側の変更
- error / not-found UI の意匠改善（Phase 6 F-01 / F-02 / F-03 / F-09〜F-14 の機能拡張）
- 本タスク内での commit / push / PR（user 承認後に別経路で実施）

## dependencies

### Depends On

- `apps/web/app/error.tsx` / `apps/web/app/global-error.tsx` / `apps/web/app/not-found.tsx` / `apps/web/app/layout.tsx` の現行構造（変更しないことを前提）
- `apps/web/src/lib/auth.ts` の現行 export shape（`handlers`, `auth`, `signIn`, `signOut`, `GET`, `POST`, `fetchSessionResolve`, `buildAuthConfig`, `AuthEnv`）
- `apps/web/src/lib/auth/verify-magic-link.ts`（変更なし）
- `apps/web/middleware.ts`（変更なし、`decodeAuthSessionJwt` 経由）
- 試行履歴 (2026-05-02〜03):
  - 5 種の failed first-choice (`"use client"` 撤廃 等) は Phase 2 評価マトリクスへ記録
  - next-auth 切り分け実験 ✓ → 真因確定

### Blocks

- P11-PRD-003 `fetchPublic` service-binding 経路書き換え
- P11-PRD-004 `/privacy` `/terms` ページ実装
- `apps/web/wrangler.toml` の `PUBLIC_API_BASE_URL` / `INTERNAL_API_BASE_URL` 追加に伴う deploy
- 09a-A-staging-deploy-smoke-execution
- 09c-A-production-deploy-execution

## refs

- GitHub Issue #385（CLOSED）
- vercel/next.js issue #86178 / #84994 / #85668 / #87719
- nextauthjs/next-auth issue #13302
- apps/web/src/lib/auth.ts
- apps/web/src/lib/auth/oauth-client.ts
- apps/web/app/api/auth/[...nextauth]/route.ts
- apps/web/app/api/auth/callback/email/route.ts
- apps/web/app/api/admin/[...path]/route.ts
- apps/web/app/api/me/[...path]/route.ts
- apps/web/app/api/me/[...path]/route.test.ts
- apps/web/app/api/auth/callback/email/route.test.ts
- apps/web/middleware.ts
- apps/web/next.config.ts
- apps/web/package.json
- Next.js 16 App Router docs (`global-error.js` の `"use client"` 必須要件)
- React 19 Server Components docs（Provider / Dispatcher 初期化）

## AC

- AC-1: `mise exec -- pnpm --filter @ubm-hyogo/web build` が exit code 0 で完了する
- AC-2: `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` が exit code 0 で完了し `apps/web/.open-next/worker.js` が生成される
- AC-3: AC-1 / AC-2 の build ログに `Cannot read properties of null (reading 'useContext')` が含まれない
- AC-4: `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` が exit code 0 で完了する
- AC-5: `mise exec -- pnpm --filter @ubm-hyogo/web lint` が exit code 0 で完了する
- AC-6: `apps/web/src/lib/auth.ts` が top-level で `next-auth` / `next-auth/providers/*` / `next-auth/jwt` を import していない（`rg -n '^import.*from "next-auth' apps/web/src/lib/auth.ts` が type-only import 以外で 0 hit）
- AC-7: `apps/web/src/lib/auth.ts` の export 互換性が維持され、4 つの route handler および middleware が変更後も同等の機能を提供する（typecheck PASS で担保）
- AC-8: `next` / `react` / `react-dom` / `next-auth` のバージョン変更を伴わない（package.json diff で担保）
- AC-9: `apps/web/app/api/auth/callback/email/route.test.ts` および `apps/web/app/api/me/[...path]/route.test.ts` 等の既存テストが PASS する（あるいは lazy factory mock 形式に修正されて PASS する）

## 13 phases

- [phase-01.md](phase-01.md) — 要件定義（真因再評価済み）
- [phase-02.md](phase-02.md) — 設計（lazy factory アーキテクチャ）
- [phase-03.md](phase-03.md) — 設計レビュー
- [phase-04.md](phase-04.md) — テスト戦略
- [phase-05.md](phase-05.md) — 実装ランブック（コード差分含む）
- [phase-06.md](phase-06.md) — 異常系検証
- [phase-07.md](phase-07.md) — AC マトリクス
- [phase-08.md](phase-08.md) — DRY 化
- [phase-09.md](phase-09.md) — 品質保証
- [phase-10.md](phase-10.md) — 最終レビュー
- [phase-11.md](phase-11.md) — 手動 smoke / 実測 evidence
- [phase-12.md](phase-12.md) — ドキュメント更新
- [phase-13.md](phase-13.md) — PR 作成

## outputs

- outputs/phase-01/main.md
- outputs/phase-02/main.md
- outputs/phase-03/main.md
- outputs/phase-04/main.md
- outputs/phase-05/main.md
- outputs/phase-06/main.md
- outputs/phase-07/main.md
- outputs/phase-08/main.md
- outputs/phase-09/main.md
- outputs/phase-10/main.md
- outputs/phase-11/main.md
- outputs/phase-11/build-smoke.md
- outputs/phase-11/build-cloudflare-smoke.md
- outputs/phase-11/prerender-output-check.md
- outputs/phase-11/lazy-import-check.md
- outputs/phase-12/main.md
- outputs/phase-12/implementation-guide.md
- outputs/phase-12/system-spec-update-summary.md
- outputs/phase-12/documentation-changelog.md
- outputs/phase-12/unassigned-task-detection.md
- outputs/phase-12/skill-feedback-report.md
- outputs/phase-12/phase12-task-spec-compliance-check.md
- outputs/phase-13/main.md
- outputs/artifacts.json

## invariants touched

- #5 D1 access boundary（影響なし、本タスクは web 側のみ）
- #14 Cloudflare free-tier（build 成果物のみ。新規 binding 追加なし）
- #16 secret values never documented（影響なし）

## completion definition

Phase 1-13 の仕様書（本改訂版）と evidence contract が揃い、Plan A 実装（auth.ts lazy factory + 4 routes refactor + oauth-client dynamic import）が `apps/web` に適用され、AC-1〜AC-9 がローカル実測で PASS していること。本タスクではコード変更まで実施するが、**commit / push / PR は user 指示後に別経路で実施**する。Phase 11 completed は実測完了を意味する。
