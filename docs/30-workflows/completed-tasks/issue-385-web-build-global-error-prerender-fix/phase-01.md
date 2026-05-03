[実装区分: 実装仕様書]

# Phase 1: 要件定義 — issue-385-web-build-global-error-prerender-fix

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-385-web-build-global-error-prerender-fix |
| phase | 1 / 13 |
| wave | issue-385 |
| mode | serial |
| 作成日 | 2026-05-02 |
| 改訂日 | 2026-05-03 |
| taskType | implementation-spec |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #385（CLOSED 状態のまま仕様化。再 open は user 承認後） |

## 目的

Next.js 16.2.4 + React 19.2.5 環境で `apps/web` の `pnpm build` / `pnpm build:cloudflare` が `/_global-error` および `/_not-found` の prerender 段階で `TypeError: Cannot read properties of null (reading 'useContext')` により失敗し、staging / production deploy が完全ブロックされている事象の真因を再評価し、要件・スコープ・AC を再定義する。本 Phase ではコード変更・deploy・commit / push / PR を行わない。実コード変更は **Phase 5 で実施** する。

## 真因 (root cause) — 2026-05-03 改訂

初版仕様書は「`apps/web/app/global-error.tsx` の `"use client"` 撤廃 + RSC 化」を first choice として真因を「Next 16 prerender × React 19 Dispatcher × `"use client"` global-error の構造的因果」と整理していたが、2026-05-02〜03 の実装試行により当該 first choice は **失敗** と確定した。以下 7 件の確認結果に基づき真因を更新する:

1. **Next 16 は `app/global-error.tsx` に `"use client"` を必須**としており、RSC 化は build 時の type / convention error で拒否される（Next.js 公式仕様）
2. `next` を `16.2.3` / `16.3.0-canary.8` へ変更しても再現
3. `react` / `react-dom` を `19.2.4` にダウングレードしても再現
4. Turbopack / webpack いずれの bundler でも再現
5. `app/global-error.tsx` を削除して Next 内蔵 default を使っても再現
6. `force-dynamic` / `dynamic = 'error'` 等の route segment config も無効
7. **`apps/web/package.json` から `next-auth` を完全除去すると `useContext` null エラーが build ログから完全消失**

→ **真因確定**: `apps/web/src/lib/auth.ts` の top-level `import NextAuth from "next-auth"`（および `next-auth/providers/google` / `next-auth/providers/credentials` / `next-auth/jwt` の type/value import）が、Next 16 + React 19 build 時の prerender worker で次の連鎖を引き起こす:

- next-auth 5.x の `lib/index.js` / `lib/actions.js` / `lib/env.js` が `next/headers` `next/server` `next/navigation` を CommonJS-like ESM として import
- `@auth/core` / `next-auth/react` 配下の module-init が `React.createContext(undefined)` を実行
- これが Next 16 内蔵 `_global-error` / `_not-found` の prerender 経路における React Dispatcher の解決順を破壊し、`useContext` が null を返す

GitHub `vercel/next.js` issue #86178 / #84994 / #85668 / #87719 および `nextauthjs/next-auth` #13302 で同症状が複数報告されており、コミュニティ confirm された汎用 workaround は存在しない。本タスクでは upstream 修正を待たず、本リポ側で恒久 workaround を実装する。

### 失敗 first-choice の記録

| 旧 first-choice 仮説 | 試行結果 | 評価マトリクス送付先 |
| --- | --- | --- |
| `app/global-error.tsx` の `"use client"` 撤廃 + RSC 化 | Next 16 仕様で type/convention error。再現解消せず | Phase 2 評価マトリクスに「不採用 (旧 d)」として記録 |
| `next` patch upgrade (16.2.5+) | 16.2.5 不存在、canary でも再現 | Phase 2「不採用 (a)」 |
| `react` / `react-dom` 19.2.4 ダウングレード | 再現解消せず | Phase 2「不採用 (b)」 |
| `next.config.ts` `experimental` flag | useContext null は変わらず | Phase 2「不採用 (c)」 |
| 候補 `next-auth` minor bump | 同 module-init で再発、根治不能 | Phase 2「不採用 (e)」 |
| `app/global-error.tsx` 削除（Next 内蔵 default 採用） | 同条件で再現（auth.ts 経由で next-auth が build 時 evaluation されるため） | Phase 2「不採用 (f)」 |
| Next.js 上流修正待ち | 修正版時期未定、deploy ブロック継続不可 | Phase 2「不採用 (g)」 |

## 解決方針 (Plan A — lazy factory パターン)

`next-auth` モジュールを **build 時 prerender 経路から完全に隔離** する。`apps/web/src/lib/auth.ts` を lazy factory `getAuth()` 化し、内部で `await import("next-auth")` 等を実行することで、route handler の実行時にのみ next-auth を読み込ませる。

設計詳細は Phase 2、実コード差分は Phase 5 に委ねる。本 Phase では方針確定とスコープ確定のみ行う。

## 影響範囲

| 種別 | パス / 対象 | 想定変更 |
| --- | --- | --- |
| 実装 | `apps/web/src/lib/auth.ts` | top-level `next-auth` / `next-auth/providers/*` / `next-auth/jwt` import を撤廃。`getAuth()` lazy factory を export し内部で `await import("next-auth")`。`buildAuthConfig` / `fetchSessionResolve` / 型定義などの純粋部分は据え置き |
| 実装 | `apps/web/src/lib/auth/oauth-client.ts` | top-level `import { signIn } from "next-auth/react"` を関数内 dynamic import に置換 |
| 実装 | `apps/web/app/api/auth/[...nextauth]/route.ts` | `export { GET, POST }` 直接再 export を `async function GET/POST(req) { const { handlers } = await getAuth(); return handlers.GET/POST(req); }` 形式に置換 |
| 実装 | `apps/web/app/api/auth/callback/email/route.ts` | `signIn` 呼び出し直前に `const { signIn } = await getAuth();` を挿入 |
| 実装 | `apps/web/app/api/admin/[...path]/route.ts` | `auth()` 呼び出し直前に `const { auth } = await getAuth();` を挿入 |
| 実装 | `apps/web/app/api/me/[...path]/route.ts` | 同上 |
| テスト | `apps/web/app/api/auth/callback/email/route.test.ts` | `getAuth()` lazy factory 形式の mock に追従 |
| テスト | `apps/web/app/api/me/[...path]/route.test.ts` | 同上 |
| 実装 | `apps/web/app/global-error.tsx` | **変更なし**（"use client" 維持。Next 16 仕様遵守） |
| 実装 | `apps/web/app/error.tsx` / `app/not-found.tsx` / `app/layout.tsx` | 変更なし |
| 設定 | `apps/web/middleware.ts` | 変更なし（next-auth 直接 import なし、`decodeAuthSessionJwt` 経由のみ） |
| 設定 | `apps/web/next.config.ts` | 変更なし（`serverExternalPackages` は ESM 解決問題を新たに招くため不採用） |
| 設定 | `apps/web/package.json` | build script に `NODE_ENV=production` を明示（`next` / `react` / `react-dom` / `next-auth` version は全て据え置き） |
| 設定 | `apps/web/wrangler.toml` | 本 issue と独立、変更なし |
| 仕様書 | `docs/30-workflows/issue-385-web-build-global-error-prerender-fix/` | 仕様化対象（本改訂） |

## scope と境界

### Scope In

- `apps/web/src/lib/auth.ts` の lazy factory 化（`getAuth()` export、top-level next-auth import 撤廃）
- `apps/web/src/lib/auth/oauth-client.ts` の `next-auth/react` 動的 import 化
- 4 route handler の handlers / signIn / auth 経路を `await getAuth()` 経由へ書き換え
- 関連テスト（`route.test.ts` 群）の mock / import path 整合
- `pnpm typecheck` / `pnpm lint` / `pnpm build` / `pnpm build:cloudflare` の全 PASS
- build ログから `useContext` null エラー消失の evidence 取得（Phase 11）
- `apps/web/.open-next/worker.js` の生成確認

### Scope Out

- ブロック対象タスク本体（P11-PRD-003 fetchPublic 経路書き換え, P11-PRD-004 `/privacy` `/terms` ページ実装, `wrangler.toml` 追記後の deploy）の実装
- staging / production への deploy 実行
- `next` / `react` / `react-dom` の version bump
- `next-auth` の major / minor / patch upgrade（`5.0.0-beta.25` 維持）
- `next.config.ts` 設定変更（`serverExternalPackages` 等）
- `pnpm patch` 適用
- `apps/web/app/global-error.tsx` / `error.tsx` / `not-found.tsx` の編集
- D1 / `apps/api` 側の変更
- error / not-found UI の意匠改善
- 本タスク内での commit / push / PR（user 承認後に別経路で実施）

## 自走禁止操作 (approval gate)

1. dependency 変更（`next` / `react` / `react-dom` / `next-auth` の version bump 一切）
2. `bash scripts/cf.sh deploy` の staging / production 実行
3. user 承認なしの commit / push / PR
4. `apps/web` 以外のコード変更（`apps/api` / `packages/shared` / D1 migrations 等）
5. `next.config.ts` の `experimental` / `serverExternalPackages` 追加（不採用根拠は Phase 2 に明記）
6. `pnpm patch next-auth` 適用
7. `apps/web/app/global-error.tsx` から `"use client"` を撤廃する旧 first-choice の再試行

## AC ↔ evidence 対応表

| # | AC | 達成条件 | evidence path（実測時） |
| --- | --- | --- | --- |
| AC-1 | `mise exec -- pnpm --filter @ubm-hyogo/web build` exit 0 | build 成功ログ末尾に "Compiled successfully" 系メッセージ | `outputs/phase-11/build-smoke.md` |
| AC-2 | `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` exit 0 | `apps/web/.open-next/worker.js` 生成確認 | `outputs/phase-11/build-cloudflare-smoke.md` |
| AC-3 | `useContext` null エラー非出現 | AC-1 / AC-2 build ログ全文から `Cannot read properties of null (reading 'useContext')` が grep 0 hit | `outputs/phase-11/prerender-output-check.md` |
| AC-4 | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` exit 0 | `tsc --noEmit` 0 件 | `outputs/phase-09/main.md` |
| AC-5 | `mise exec -- pnpm --filter @ubm-hyogo/web lint` exit 0 | lint 全 PASS | `outputs/phase-09/main.md` |
| AC-6 | `apps/web/src/lib/auth.ts` の top-level `next-auth` import 撤廃 | `rg -n '^import.*from "next-auth' apps/web/src/lib/auth.ts` が type-only import 以外で 0 hit | `outputs/phase-11/main.md` / `outputs/phase-10/main.md` |
| AC-7 | `auth.ts` export shape 互換維持 | 4 route handler / middleware が変更後も同等機能を提供（typecheck PASS で担保） | `outputs/phase-09/main.md` / `outputs/phase-10/main.md` |
| AC-8 | dependency バージョン据置 | `next` / `react` / `react-dom` / `next-auth` の `package.json` diff 0 | `outputs/phase-10/main.md` |
| AC-9 | 既存テスト PASS | `route.test.ts` 群が PASS（あるいは lazy factory mock に修正の上 PASS） | `outputs/phase-09/main.md` |

## 実行タスク

1. 真因（next-auth top-level import × Next 16 + React 19 build prerender × `@auth/core` createContext 連鎖）を再構造化する。完了条件: 上記「真因」セクションが固定される。
2. 失敗 first-choice 7 件を Phase 2 評価マトリクス送付分として明文化する。完了条件: 失敗 first-choice 表が記録される。
3. Plan A スコープ（auth.ts / oauth-client.ts / 4 routes / 関連 test）を確定する。完了条件: 影響範囲表のすべての行に「想定変更」が記載される。
4. approval gate を更新する（dependency 据置・global-error 編集禁止 等）。完了条件: 7 件の禁止操作が明記される。
5. AC-1〜AC-9 ↔ evidence path 対応表を確定する。完了条件: 9 件すべてに evidence 出力先が割り当てられる。

## 参照資料

- index.md（task 本仕様 root）
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
- vercel/next.js issue #86178 / #84994 / #85668 / #87719
- nextauthjs/next-auth issue #13302
- Next.js 16 App Router docs（`global-error.js` の "use client" 必須要件）
- React 19 Server Components docs（Provider / Dispatcher 初期化）

## 実行手順

- 対象 directory: `docs/30-workflows/issue-385-web-build-global-error-prerender-fix/`
- 本仕様書作成ではアプリケーションコード変更、deploy、commit / push / PR、dependency 更新を行わない
- 実コード変更は **Phase 5 で実施**、実測 evidence は **Phase 11 で取得**
- commit / push / PR は **user 指示後** に別経路で実施

## 統合テスト連携

- 上流: 本 issue の試行履歴 (2026-05-02〜03)、Next.js / next-auth GitHub issue 群、Phase 0 task spec 改訂
- 下流:
  - P11-PRD-003 fetchPublic service-binding 経路書き換え
  - P11-PRD-004 `/privacy` `/terms` ページ実装
  - `apps/web/wrangler.toml` 追記タスク
  - 09a-A-staging-deploy-smoke-execution / 09c-A-production-deploy-execution

## 多角的チェック観点

- 不変条件 #14 (Cloudflare free-tier): 新規 binding を作らない。`.open-next/worker.js` のサイズが無料枠を逸脱しないことを Phase 11 で確認
- 不変条件 #5 (D1 access boundary): 本タスクは `apps/web` のみ。D1 / `apps/api` への変更を含めない
- 不変条件 #16 (secret values never documented): build ログから secret 文字列を evidence に転記しない
- 未実装 / 未実測を PASS と扱わない: spec 化のみで build 成功と扱わない
- 旧 first-choice (`global-error.tsx` "use client" 撤廃) の失敗履歴を必ず後続 Phase に伝達し、再試行を防ぐ
- pre-existing バグであることを根拠に放置しない（恒久 workaround を本リポ側に実装する責務）

## サブタスク管理

- [ ] 真因（next-auth top-level import 連鎖）を構造化した
- [ ] 失敗 first-choice 7 件を Phase 2 送付分として明文化した
- [ ] Plan A スコープと影響範囲を確定した
- [ ] approval gate（dependency 据置 / global-error 編集禁止 等 7 件）を明記した
- [ ] AC-1〜AC-9 ↔ evidence path を対応付けた
- [ ] outputs/phase-01/main.md に転記した

## 成果物

- outputs/phase-01/main.md（本 Phase で確定した真因・失敗 first-choice 履歴・Plan A スコープ・影響範囲・AC マッピング・approval gate）

## 完了条件

- 真因が「next-auth top-level import が Next 16 + React 19 build 時 prerender で `@auth/core` `next-auth/react` の `React.createContext` を発火させ Dispatcher を破壊する」構造として明文化されている
- 失敗 first-choice 7 件が記録され、Phase 2 評価マトリクスへの送付が宣言されている
- 影響範囲表が web 側に閉じており、Plan A の 4 routes / 2 lib / 2 test に集約されている
- AC-1〜AC-9 すべてに evidence path が割り当てられている
- approval gate（dependency 据置 / global-error 編集禁止 / `pnpm patch` 不可 / commit-push-PR 不可 等）が明記されている

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 失敗 first-choice の再試行を許容する記述がない
- [ ] 実装、deploy、commit、push、PR を実行していない
- [ ] dependency 更新を実行していない

## 次 Phase への引き渡し

Phase 2（設計）へ次を渡す:

- 真因: `apps/web/src/lib/auth.ts` の top-level `next-auth` import が build 時 prerender で `@auth/core` の `React.createContext` を発火させ Dispatcher を破壊
- first choice: lazy factory `getAuth()` パターン（auth.ts / oauth-client.ts / 4 routes 改修）
- 失敗 first-choice 7 件（旧 d: RSC 化 / a: next bump / b: react downgrade / c: experimental flag / e: next-auth bump / f: global-error.tsx 削除 / g: 上流修正待ち）と各不採用理由の根拠
- middleware / next.config / package.json は変更不要根拠
- AC-1〜AC-9 と evidence path
- approval gate 7 件
