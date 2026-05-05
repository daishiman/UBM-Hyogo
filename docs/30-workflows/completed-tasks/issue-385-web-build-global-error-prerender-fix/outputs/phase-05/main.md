[実装区分: 実装仕様書]

# Phase 5 合意 — 実装ランブック（Step 1-15）

| 項目 | 値 |
| --- | --- |
| task | issue-385-web-build-global-error-prerender-fix |
| phase | 5 / 13 |
| 改訂日 | 2026-05-03 |
| 実装区分 | 実装仕様書 |
| 状態 | pending（runbook 確定・実コード変更は user 指示後) |

## 合意 summary

Plan A を Step 1-15 の step-by-step runbook として確定。各 step に「対象ファイル」「Before / After」「実行コマンド」「期待出力」「想定はまり所」「失敗時 fallback」「DoD」「rollback」を付与した。

> 本タスクは `[実装区分: 実装仕様書]` であり、CONST_004 デフォルト「コード実装まで実施」の通り Phase 5 内で apps/web 配下の改修を実施する想定だが、**本 main.md 時点では仕様改訂段階のため実コード変更は未実施**。実装着手は user 指示後に行う。commit / push / PR は別途 Phase 13 / diff-to-pr で user 承認後に実施。

## Phase deliverables（Step 1-15 概要）

| Step | 内容 | 主要 DoD |
| --- | --- | --- |
| 1 | 着手前 baseline 確認（`git status` / 既存 import の rg） | 利用側ファイル一覧確定 |
| 2 | `apps/web/src/lib/auth.ts` lazy factory 化 | top-level next-auth value import 0 hit / `getAuth` / `AuthHandle` / `buildAuthConfig` (async) export |
| 3 | `apps/web/src/lib/auth/oauth-client.ts` 関数内 dynamic import 化 | top-level `next-auth/react` import 0 hit |
| 4 | `app/api/auth/[...nextauth]/route.ts` を `await getAuth()` 経由 | `await getAuth()` 2 hit (GET/POST) |
| 5 | `app/api/auth/callback/email/route.ts` 同上 | `await getAuth()` 1 hit |
| 6 | `app/api/admin/[...path]/route.ts` 同上 | `await getAuth()` 1 hit / 401/403 fail-closed 維持 |
| 7 | `app/api/me/[...path]/route.ts` 同上 | 同上 |
| 8 | 既存 test (`me` / `callback/email` route.test.ts) を `getAuth` 戻り値 mock 形式へ | 既存 vitest 全 PASS |
| 9 | `mise exec -- pnpm install --force` | exit 0 / lockfile 差分 0 |
| 10 | `pnpm typecheck` | exit 0 (AC-4) |
| 11 | `pnpm lint` | exit 0 (AC-5) |
| 12 | `pnpm test` | exit 0 (AC-9) |
| 13 | `pnpm build` | exit 0 + `useContext` null 0 hit (AC-1 / AC-3) |
| 14 | `pnpm build:cloudflare` | exit 0 + `worker.js` 生成 (AC-2 / AC-3) |
| 15 | source guard 手動確認 | `rg` で value import 0 hit (AC-6) |

> 詳細コード差分・想定はまり所・fallback は `phase-05.md` 本体に記載済み。本合意書ではコード長文ブロックを再掲しない。

## 委譲方針

| 区分 | 本タスク | 委譲先 |
| --- | --- | --- |
| 仕様書改訂 | 本タスクで完結 | — |
| Plan A 実装（auth.ts / oauth-client / 4 routes / test） | 本 Phase 5 で実施（user 指示後） | — |
| build smoke 実測 evidence 永続化 | Phase 11 | — |
| L3 source guard CI 組み込み | 委譲 | 別タスク CI guard 追加 |
| staging / production deploy | 委譲 | 09a / 09c |
| commit / push / PR | 委譲（user 承認後） | Phase 13 / diff-to-pr |

## approval gate（自走禁止 7 項目）

1. `bash scripts/cf.sh deploy` の staging / production 実行
2. dependency major / minor / patch bump（next / react / react-dom / next-auth）
3. `apps/web` 以外のコード変更
4. `apps/web/next.config.ts` への `serverExternalPackages` / `experimental.*` 追加
5. `pnpm patch next-auth` 適用
6. commit / push / PR 操作（Phase 13 / user 指示後の diff-to-pr に委ねる）
7. `apps/web/package.json` / `pnpm-lock.yaml` の編集

## 状態

- **pending**: runbook 仕様は確定済み。実コード変更（Step 2-8）と品質 gate 実走（Step 9-15）は **未実施**
- 着手は user 指示後

## 次 Phase への引き渡し

Phase 6（異常系検証）へ次を渡す:

- Step 1-15 runbook（特に Step 13-14 の build smoke と想定はまり所）
- approval gate 7 項目
- 委譲方針（CI guard / deploy / commit-push-PR）
- Plan A 適用後の `auth.ts` 新 export shape (`getAuth` / `AuthHandle` / `buildAuthConfig` async)
- Step 13/14 失敗時の fallback 評価方針
