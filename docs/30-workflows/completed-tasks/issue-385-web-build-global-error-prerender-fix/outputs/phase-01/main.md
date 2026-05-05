[実装区分: 実装仕様書]

# Phase 1 合意 — 要件定義（Plan A: lazy factory 方針確定）

| 項目 | 値 |
| --- | --- |
| task | issue-385-web-build-global-error-prerender-fix |
| phase | 1 / 13 |
| 改訂日 | 2026-05-03 |
| 実装区分 | 実装仕様書 |
| 状態 | pending（仕様確定済み・実装着手は user 指示後） |
| visualEvidence | NON_VISUAL |

## 合意 summary

旧仕様（`apps/web/app/global-error.tsx` の `"use client"` 撤廃 / RSC 化）は、2026-05-02〜03 の実装試行で **全 7 経路 disprove** された（Next 16 仕様で `"use client"` 必須 / next bump / react downgrade / bundler 切替 / global-error 削除 / route segment config 不可 / next-auth 除去で再現消失）。

本 Phase 1 では真因を再確定する:

- **真因**: `apps/web/src/lib/auth.ts` の top-level `import NextAuth from "next-auth"`（および providers / jwt の value import）が、Next 16 + React 19 build 時の prerender worker で `@auth/core` / `next-auth/react` の `React.createContext(undefined)` を eager 評価し、React Dispatcher 解決順を破壊して `useContext` null を引き起こす
- **解決方針 (Plan A)**: top-level import を完全撤廃し、`getAuth()` lazy factory を export。内部で `await import("next-auth")` を実行することで、build 時 prerender 経路から next-auth を物理的に隔離する

## Phase deliverables

- 真因の再構造化（next-auth top-level import × Next 16 prerender × `@auth/core` createContext 連鎖）
- 失敗 first-choice 7 件 + 派生不採用 1 件 の Phase 2 評価マトリクス送付分の明文化
- Plan A スコープの確定（auth.ts / oauth-client.ts / 4 routes / 関連 test の 8 ファイル集約）
- approval gate 7 件の明記（dependency 据置 / global-error 編集禁止 / `pnpm patch` 不可 / commit-push-PR 不可 等）
- AC-1〜AC-9 ↔ evidence path 対応表

## scope と境界

### Scope In

- `apps/web/src/lib/auth.ts` を lazy factory 化（`getAuth()` export）
- `apps/web/src/lib/auth/oauth-client.ts` を関数内 dynamic import 化
- 4 route handler (`api/auth/[...nextauth]` / `api/auth/callback/email` / `api/admin/[...path]` / `api/me/[...path]`) を `await getAuth()` 経由化
- 関連 test (`route.test.ts` 群) の mock 形式統一
- AC-1〜AC-9 のローカル実測

### Scope Out（user 指示後に別経路）

- commit / push / PR
- staging / production deploy
- dependency version bump (`next` / `react` / `react-dom` / `next-auth`)
- `next.config.ts` の `serverExternalPackages` / `experimental` 追加
- `pnpm patch next-auth` 適用
- `apps/web/app/global-error.tsx` 編集（旧 first-choice の再試行禁止）
- `apps/api` / D1 / `packages/*` への変更

## AC ↔ evidence 対応（要約）

| AC | 内容 | evidence path |
| --- | --- | --- |
| AC-1 | `pnpm --filter @ubm-hyogo/web build` exit 0 | `outputs/phase-11/build-smoke.md` |
| AC-2 | `build:cloudflare` exit 0 + `worker.js` 生成 | `outputs/phase-11/build-cloudflare-smoke.md` |
| AC-3 | build ログに `useContext` null 文字列が含まれない | `outputs/phase-11/prerender-output-check.md` |
| AC-4 | typecheck exit 0 | `outputs/phase-09/main.md` |
| AC-5 | lint exit 0 | `outputs/phase-09/main.md` |
| AC-6 | `auth.ts` の top-level next-auth value import 撤廃 | `outputs/phase-11/main.md` |
| AC-7 | export shape 互換維持（4 routes / middleware 機能等価） | `outputs/phase-09/main.md` / `outputs/phase-10/main.md` |
| AC-8 | dependency バージョン据置 | `outputs/phase-10/main.md` |
| AC-9 | 既存テスト PASS（mock 切替後を含む） | `outputs/phase-09/main.md` |

## 状態

- **pending**: 本 Phase は仕様改訂のみ完了。実コード変更（Phase 5 ランブック実走）と build 実測（Phase 11）は **未実施**
- 実装着手は **user 指示後**

## 次 Phase への引き渡し

Phase 2（設計）へ次を渡す:

- 真因確定文（next-auth top-level import → `@auth/core` createContext → Dispatcher 破壊）
- first choice = Plan A: lazy factory `getAuth()` パターン
- 失敗 first-choice 7 件（旧 d: RSC 化 / a: next bump / b: react downgrade / c: experimental flag / e: next-auth bump / f: global-error.tsx 削除 / g: 上流修正待ち）+ 派生不採用 1 件（h: pnpm patch + serverExternalPackages）
- middleware / next.config / package.json 不変根拠
- AC-1〜AC-9 と evidence path
- approval gate 7 件
