[実装区分: 実装仕様書]

# Phase 2 合意 — 設計（lazy factory アーキテクチャ）

| 項目 | 値 |
| --- | --- |
| task | issue-385-web-build-global-error-prerender-fix |
| phase | 2 / 13 |
| 改訂日 | 2026-05-03 |
| 実装区分 | 実装仕様書 |
| 状態 | completed（Plan A 実装済み・deploy / PR は user approval gate) |

## 合意 summary

Phase 1 で再確定した真因に対し、**Plan A: lazy factory `getAuth()` パターン** を first choice として採択する。`apps/web/src/lib/auth.ts` を top-level next-auth value import フリーに改修し、内部で `await import("next-auth")` / `import("next-auth/providers/google")` / `import("next-auth/providers/credentials")` を遅延評価する。`buildAuthConfig` は同期関数のまま維持し、provider 取得だけを `getAuth()` 内の dynamic import に閉じ込める。

## Phase deliverables

- 採用方針評価マトリクス（Plan A + 不採用 8 件: 旧 d / a / b / c / e / f / g / h）
- lazy factory アーキテクチャ詳細
  - `getAuth()` signature: `() => Promise<ReturnType<typeof NextAuth>>`
  - module-level Promise cache（`let authRuntimePromise: Promise<AuthRuntime> | undefined` を `authRuntimePromise ??= (async () => {...})()` で memoize）
  - 型 export 戦略: `NextAuthConfig` / `JWT` 等は `import type` のみ許容、value import は禁止
  - dynamic import 戦略: `getAuth()` 内で `await Promise.all([import("next-auth"), import("next-auth/providers/google"), import("next-auth/providers/credentials")])`
- 4 route handler の before/after 概念図
  - `[...nextauth]/route.ts`: `export { GET, POST }` → `async function GET/POST(req) { const { handlers } = await getAuth(); return handlers.GET/POST(req); }`
  - `callback/email/route.ts`: `import { signIn }` → `const { signIn } = await getAuth();`
  - `admin/[...path]/route.ts` / `me/[...path]/route.ts`: `import { auth }` → `const { auth } = await getAuth();`
- middleware / `next.config.ts` / `package.json` が変更不要な根拠
- 副作用とリスク 6 件（await 漏れ / 初回 latency / mock 不整合 / bundle 影響 / Workers 互換 / 将来 ESM 変更）

## Plan A 採用根拠

1. 真因「top-level import → prerender 経路で `@auth/core` createContext 発火 → Dispatcher 破壊」に対し、top-level import 撤廃で構造的に隔離可能
2. dependency 副作用ゼロ（AC-8 整合）
3. export shape を `getAuth()` 経由に集約することで route handlers + session helper への波及を明示化し、middleware は据え置く
4. next-auth upstream 修正待ちに依存しない恒久 workaround
5. Cloudflare Workers の dynamic import は OpenNext 1.19.4 で transparent サポート

## 不採用 8 件（要点）

| # | 案 | 不採用理由 |
| --- | --- | --- |
| 旧 d | global-error.tsx の `"use client"` 撤廃 + RSC 化 | Next 16 仕様で `"use client"` 必須。build 拒否 |
| a | next 16.2.5+ patch upgrade | 16.2.5 不存在、canary 未修正 |
| b | react / react-dom 19.2.4 downgrade | 19.2.4 でも再現 |
| c | `next.config.ts` `serverExternalPackages` 採用 | useContext 解消するが ERR_MODULE_NOT_FOUND を新たに招く |
| e | next-auth `5.0.0-beta.30` minor bump | module-init 構造同一で再発 |
| f | `app/global-error.tsx` 削除 | auth.ts 経由で再現 |
| g | Next.js 上流修正待ち | 修正版時期未定、deploy ブロック継続不可 |
| h | `pnpm patch next-auth` + serverExternalPackages 併用 | next-auth bump 時に毎回 patch 再生成、保守性が劣る |

## 依存パッケージのバージョン

| パッケージ | 現行 | Plan A 後 |
| --- | --- | --- |
| next | 16.2.4 | 16.2.4（無変更） |
| react / react-dom | 19.2.5 | 19.2.5（無変更） |
| @opennextjs/cloudflare | 1.19.4 | 1.19.4（無変更） |
| next-auth | 5.0.0-beta.25 | 5.0.0-beta.25（無変更） |

AC-8 整合。

## 状態

- **completed**: 設計確定済み。Plan A 実装と local NON_VISUAL evidence は本サイクルで実施。deploy / commit / push / PR・dependency 更新は実施しない

## 次 Phase への引き渡し

Phase 3（設計レビュー）へ次を渡す:

- Plan A 中核設計（getAuth signature / cache 戦略 / 型 export 戦略 / 4 routes 書き換えパターン）
- 不採用 8 件の根拠
- middleware / next.config / package.json 不変根拠
- 副作用とリスク 6 件
- AC-1〜AC-9 整合（特に AC-6 / AC-7 / AC-8 / AC-9）
