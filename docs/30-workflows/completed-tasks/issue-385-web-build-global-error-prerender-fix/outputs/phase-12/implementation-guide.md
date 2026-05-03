[実装区分: 実装仕様書]

# Implementation Guide: web build /_global-error prerender 修正（Plan A lazy factory）

| 項目 | 値 |
| --- | --- |
| task | issue-385-web-build-global-error-prerender-fix |
| 採用方針 | Plan A — `getAuth()` lazy factory |
| 改訂日 | 2026-05-03 |
| 関連 Issue | #385（CLOSED） |
| visualEvidence | NON_VISUAL |

> Plan A の実コード変更は本サイクルで実施する。deploy・commit・push・PR は Phase 13 approval gate まで実行しない。

## Part 1: 中学生レベル

**テーマ**: 「お店の倉庫から、開店準備のときに使えない道具を全部出しておく話」

### 例え話

- Web サイトを build する = お店を開ける前にまとめて看板や案内を**先に印刷しておく**作業。
- 今までは「カギ屋さん（ログイン部品 = next-auth）」が、開店準備の場所にいきなり来てしまっていて、印刷工場が「カギ屋さんの道具がここでは動かない」と毎回叫んで止まっていた。
- 修正は、カギ屋さんを**「お客さんが来た瞬間にだけ呼び出す」**ようにする（`getAuth()` lazy factory）。開店準備の場所にはカギ屋さんが居ない状態にしてあげる。
- カギ屋さん本人 (next-auth のバージョン) は変えない。呼び方を変えるだけ。

### なぜ → どうやって

1. なぜ deploy が止まっていたか → ビルドが途中でエラーで止まり、お店に出す商品 (`worker.js`) が作れなかったから
2. なぜビルドが止まったか → ログイン部品が「開店準備のところ」にまで顔を出してしまい、印刷工場で動こうとして null で転んでいたから
3. どうやって直すか → ログイン部品を「お客さんが来てから呼ぶ」ようにし、開店準備にはいない状態にする
4. 直すと何ができるようになるか → ビルドが緑になり、staging / production への deploy が再開できる

### 専門用語セルフチェック表（5 用語以上）

| 専門用語 | 日常語への言い換え |
| --- | --- |
| ビルド (build) | お店を開ける前にあらかじめ商品をまとめて作っておく作業 |
| プリレンダー (prerender) | お客さんが来る前に画面の絵をあらかじめ描いておくこと |
| next-auth | お客さんがちゃんとした人かどうかを見分けるカギ屋さん |
| `getAuth()` | カギ屋さんを「呼ばれたときだけ呼び出す」予約電話 |
| top-level import | 開店準備の場所に部品を置きっぱなしにする置き方 |
| dynamic import | 必要になった瞬間に取りに行く取り出し方 |
| `useContext` | 部品同士で同じ情報を共有するための仕組み（今回それが null だった） |
| Cloudflare Workers | サイトを動かす場所（インターネットの上の小さな箱） |

## Part 2: 技術者レベル（PR 本文ベース）

### 1. 真因

- Next.js 16.2.4 build 時の prerender worker において、`apps/web/src/lib/auth.ts` の top-level `import NextAuth from "next-auth"` 等が `@auth/core` / `next-auth/react` を module-init 時にロードし `React.createContext(undefined)` を実行する
- 結果、React 19.2.5 の Dispatcher 解決順が破壊され、Next 16 内蔵 `_global-error` / `_not-found` の prerender 中に `useContext` が null を返す
- vercel/next.js #86178 / #84994 / #85668 / #87719 / nextauthjs/next-auth #13302 の同症状報告と一致

### 2. 採用方針: Plan A（lazy factory）

- `apps/web/src/lib/auth.ts` を `export async function getAuth()` lazy factory 化し、内部で `await import("next-auth")` 等を行う。provider factories は lazy load するが、provider options は request ごとの env override を反映して config callback 内で再構成する
- 4 route handler / `oauth-client.ts` を `getAuth()` 経由 / `await import("next-auth/react")` 経由に書き換え
- next / react / react-dom / next-auth の version、middleware、next.config は **変更なし**。`apps/web/package.json` は `.mise.toml` 由来の `NODE_ENV=development` を build 時に上書きするため build script のみ変更

### 3. 不採用案（理由付き）

| 案 | 不採用理由 |
| --- | --- |
| next patch upgrade | 16.2.5 不存在、canary でも未修正 |
| react downgrade | 19.2.4 でも再現、major bump は依存破壊 |
| `serverExternalPackages: ["next-auth", "@auth/core"]` | useContext は解消するが next-auth/lib の `next/server` ESM 拡張子問題を新たに招く |
| `pnpm patch next-auth` | fallback 調査では動作可能だが、next-auth bump 毎に patch 再生成必要・保守性低。Plan A の正規完了条件には含めない |
| `app/global-error.tsx` の `"use client"` 撤廃 | Next 16 の必須 convention 違反、内蔵 default でも再現 |
| Next.js 上流修正待ち | 修正版リリース時期未定、deploy ブロック継続不可 |

### 4. 変更対象ファイルと diff 概要

| 対象 | Plan A 適用 |
| --- | --- |
| `apps/web/src/lib/auth.ts` | top-level next-auth value import 撤廃、`getAuth()` lazy factory export、request ごとの env override を保持する provider factory 構成、`fetchSessionResolve` 等の純粋関数は据置 |
| `apps/web/src/lib/auth/oauth-client.ts` | top-level `import { signIn } from "next-auth/react"` を関数内 `await import("next-auth/react")` に置換 |
| `apps/web/app/api/auth/[...nextauth]/route.ts` | `export { GET, POST }` 直接再 export を `async function GET/POST(req) { const { handlers } = await getAuth(); return handlers.GET/POST(req); }` に置換 |
| `apps/web/app/api/auth/callback/email/route.ts` | `signIn` 呼び出し直前に `const { signIn } = await getAuth();` |
| `apps/web/app/api/admin/[...path]/route.ts` | `auth()` 呼び出し直前に `const { auth } = await getAuth();` |
| `apps/web/app/api/me/[...path]/route.ts` | 同上 |
| `apps/web/middleware.ts` | 変更なし |
| `apps/web/next.config.ts` | 変更なし |
| `apps/web/package.json` | `build` / `build:cloudflare` に `NODE_ENV=production` を明示 |

> 各ファイルの完全な diff コードブロックは `phase-05.md` の実装ランブックを参照。

### 5. テスト mock 修正方針

- `apps/web/app/api/auth/callback/email/route.test.ts`: 既存の `vi.mock("@/src/lib/auth", () => ({ signIn: ... }))` を `vi.mock("@/src/lib/auth", () => ({ getAuth: vi.fn(async () => ({ signIn: ... })) }))` 形式に置換
- `apps/web/app/api/me/[...path]/route.test.ts`: 同様に `auth` を `getAuth` 経由に変更
- 既存 mock がある全 route handler テストで lazy factory mock 形式へ統一する
- mock 整合 PASS が AC-9 の評価対象

### 6. 検証コマンド（Phase 11 9 段）

```bash
mise exec -- pnpm install --force
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint
mise exec -- pnpm --filter @ubm-hyogo/web test
mise exec -- pnpm --filter @ubm-hyogo/web build 2>&1 | tee /tmp/web-build.log
mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare 2>&1 | tee /tmp/web-build-cf.log
ls -la apps/web/.open-next/worker.js
grep -c "Cannot read properties of null" /tmp/web-build.log /tmp/web-build-cf.log   # expect 0
rg -n '^import.*from "next-auth' apps/web/src/lib/auth.ts                            # expect 0 value import
```

### 7. AC（DoD）

| AC | 内容 |
| --- | --- |
| AC-1 | `pnpm --filter @ubm-hyogo/web build` exit 0 |
| AC-2 | `pnpm --filter @ubm-hyogo/web build:cloudflare` exit 0 + `apps/web/.open-next/worker.js` 生成 |
| AC-3 | build ログに `Cannot read properties of null (reading 'useContext')` 0 件 |
| AC-4 | `pnpm --filter @ubm-hyogo/web typecheck` exit 0 |
| AC-5 | `pnpm --filter @ubm-hyogo/web lint` exit 0 |
| AC-6 | `apps/web/src/lib/auth.ts` top-level next-auth value import 0 件（type-only 可） |
| AC-7 | 4 route handler が lazy factory 経由 + 既存 export 互換 (typecheck PASS) |
| AC-8 | next / react / react-dom / next-auth version 不変 |
| AC-9 | `pnpm --filter @ubm-hyogo/web test` exit 0 |

### 8. 後続 follow-up

- P11-PRD-003 fetchPublic service-binding 経路書き換え
- P11-PRD-004 `/privacy` `/terms` ページ実装
- `apps/web/wrangler.toml` `*_API_BASE_URL` service-binding deploy 反映
- 09a-A staging deploy smoke / 09c-A production deploy
- LL-1: lazy factory パターンを `.claude/skills/aiworkflow-requirements/references/` に lessons-learned 追加（user 承認後）

### 9. 境界宣言

- 本ドキュメントは PR 本文ベース。PR 作成は Phase 13 で user 明示指示後に実行
- staging / production の実 deploy 実行は本 PR 範囲外（下流 09a / 09c の責務）
- error / not-found UI の機能拡張は対象外
