[実装区分: 実装仕様書]

# Phase 11 main.md — issue-385-web-build-global-error-prerender-fix

| 項目 | 値 |
| --- | --- |
| task name | issue-385-web-build-global-error-prerender-fix |
| phase | 11 / 13 |
| 改訂日 | 2026-05-03 |
| 採用方針 | Plan A — `getAuth()` lazy factory + `NODE_ENV=production` build scripts |
| visualEvidence | NON_VISUAL |
| evidence status | PASS |
| workflow_state | implemented-local |

## NON_VISUAL 宣言

- visualEvidence: NON_VISUAL
- 適用条件: 本タスクは `apps/web` の build prerender 失敗の恒久解消であり、既存の `error.tsx` / `not-found.tsx` / `global-error.tsx` fallback UI を変更しない。lazy factory 化と build script 明示は UI 表示差分を持たないため、スクリーンショットではなく build / prerender / lazy import 証跡で検証する
- 代替 evidence: build-smoke.md / build-cloudflare-smoke.md / prerender-output-check.md / lazy-import-check.md
- スクリーンショットを作らない理由: build 経路と route handler の lazy import 構造を構造的に確認する責務であり、UI 視覚要素の変化が責務対象ではないため
- 証跡の主ソース: 4 ゲート（typecheck / lint / test / build）+ cloudflare build + `ls` / `grep` / `rg` の静的構造確認

## Phase 11 合意 summary

Phase 5 で確定した Plan A（`apps/web/src/lib/auth.ts` の `getAuth()` lazy factory 化 + route handler / `apps/web/src/lib/auth/oauth-client.ts` / `apps/web/src/lib/session.ts` の dynamic auth access）に加え、`.mise.toml` 由来の `NODE_ENV=development` を build script で `NODE_ENV=production` に上書きする。9 段の実測手順を直列実行し、AC-1〜AC-9 を evidence で示す。

> 境界宣言: local code / docs / evidence は本サイクルで完了。deploy / commit / push / PR は user approval gate まで実行しない。

## 実測 9 段手順（順序固定）

| # | 段 | コマンド | 取得 evidence | 判定 |
| - | --- | -------- | ------------- | ---- |
| 1 | 依存整合 | lockfile / installed deps reused | build-smoke.md 前提 | no-op |
| 2 | typecheck | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | build-smoke.md 前提 | AC-4 PASS |
| 3 | lint | `mise exec -- pnpm --filter @ubm-hyogo/web lint` | build-smoke.md 前提 | AC-5 PASS |
| 4 | unit test | `mise exec -- pnpm --filter @ubm-hyogo/web test -- --run ...` | build-smoke.md 前提 | AC-9 PASS |
| 5 | next build | `mise exec -- pnpm --filter @ubm-hyogo/web build 2>&1 \| tee /tmp/issue-385-build.log` | build-smoke.md 本体 | AC-1 PASS |
| 6 | cloudflare build | `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare 2>&1 \| tee /tmp/issue-385-build-cf.log` | build-cloudflare-smoke.md 本体 | AC-2 PASS |
| 7 | worker.js 生成確認 | `test -f apps/web/.open-next/worker.js` | prerender-output-check.md | AC-2 PASS |
| 8 | useContext null grep | `grep -n "Cannot read properties of null" /tmp/issue-385-build*.log` | 各 smoke ファイル判定欄 | AC-3 PASS (0 件) |
| 9 | top-level next-auth import grep | `rg -n '^import.*from "next-auth' apps/web/src/lib/auth.ts` | lazy-import-check.md | AC-6 PASS |

> 段 1〜4 が FAIL した場合は段 5 以降を実走しない。段 5 / 6 が FAIL した場合は段 7 / 8 / 9 を実走するが PASS 判定しない。

## evidence ファイル構成と参照

| ファイル | 内容 | 主要 AC |
| --- | --- | --- |
| `outputs/phase-11/main.md`（本ファイル） | NON_VISUAL 宣言 / 代替 evidence 差分表 / 申し送り / rollback / 実測サマリ | — |
| `outputs/phase-11/build-smoke.md` | 段 1〜5 実測 | AC-1 / AC-3 / AC-4 / AC-5 / AC-9 |
| `outputs/phase-11/build-cloudflare-smoke.md` | 段 6 実測 | AC-2 / AC-3 |
| `outputs/phase-11/prerender-output-check.md` | 段 7 worker.js 生成確認 | AC-2 |
| `outputs/phase-11/lazy-import-check.md` | 段 9 構造確認 | AC-6 / AC-7 / AC-8 |

## 代替 evidence 差分表

| シナリオ | 元前提 | 代替手段 | カバー範囲 | 申し送り先 |
| --- | --- | --- | --- | --- |
| S-1 build smoke | 画面再現 | build-smoke.md の stdout + `useContext` null grep | AC-1 / AC-3 / AC-4 / AC-5 / AC-9 | 09a / 09c deploy 経路 |
| S-2 cloudflare build smoke | 画面再現 | build-cloudflare-smoke.md の stdout | AC-2 / AC-3 | 09a / 09c deploy 経路 |
| S-3 worker.js 生成確認 | 画面再現 | prerender-output-check.md の `ls -la` 結果 | AC-2 | 09c production deploy |
| S-4 lazy factory 構造確認 | 画面再現 | 段 9 `rg` 結果 | AC-6 / AC-7 / AC-8 | 将来の next-auth bump 時の regression 監視 |

## dev サーバ smoke（任意・推奨）

build PASS 後の追加保険として、`pnpm dev` 起動下で route handler の cold start 動作を 1 回だけ確認する。本 Phase の AC 判定には含めない。

```bash
mise exec -- pnpm --filter @ubm-hyogo/web dev
# 別ターミナルで
curl -i http://localhost:3000/api/auth/session
curl -i http://localhost:3000/api/admin/health
curl -i http://localhost:3000/api/me/profile
```

期待: 各 endpoint が 5xx で落ちず HTTP ステータス（200 / 401 / 403 / 404 等）を返す。500 with `useContext` 系 stack trace が出た場合は Plan A の lazy factory 移行漏れを疑う。

## 保証範囲と保証外

- 保証する: 9 段 evidence による AC-1〜AC-9 の構造的証明、`useContext` null 非出現、worker.js 生成、`auth.ts` の top-level next-auth import 撤廃、dependency 据置
- 保証しない（下流委譲）: 実 deploy 成否 / runtime ユーザー体験 / Auth.js OAuth callback 実走 / Magic Link メール送信実走

## 申し送り（FU-1 〜 FU-5）

| follow-up ID | 内容 | 関連 |
| --- | --- | --- |
| FU-1 | P11-PRD-003 fetchPublic service-binding 経路書き換え | 本 build 緑化が前提 |
| FU-2 | P11-PRD-004 `/privacy` `/terms` ページ実装 | 本 build 緑化が前提 |
| FU-3 | `apps/web/wrangler.toml` の `PUBLIC_API_BASE_URL` / `INTERNAL_API_BASE_URL` 反映 | 本 build 緑化が前提 |
| FU-4 | （条件付き）段 6 のみ FAIL 時の `@opennextjs/cloudflare` bundling 調査 | 段 6 失敗時 |
| FU-5 | （監視）vercel/next.js #86178 / #84994 / #85668 / #87719 / nextauthjs/next-auth #13302 上流 fix 追跡と lazy factory revert 評価 | 長期 |

## rollback 判断ポイント

| 失敗段 | 観測 | 判断 |
| - | --- | --- |
| 段 2 typecheck FAIL | `getAuth()` 戻り値型不整合 / handler 側型エラー | Plan A の auth.ts 型公開シグネチャを Phase 5 と突き合わせ最小差分で修正。3 回失敗で実装中断・user 報告 |
| 段 5 next build FAIL & `useContext` null 残存 | 4 handler のいずれかで top-level next-auth import 残存 | 段 9 を先行実走して漏れ箇所を特定し当該 handler を lazy factory 経由へ修正 |
| 段 5 next build FAIL & `useContext` null 非出現 | 別系統の build error | エラー種別を分離して個別対応。Plan A 自体の rollback 不要 |
| 段 6 cloudflare build FAIL のみ | `@opennextjs/cloudflare` 側の bundling 問題 | ログ保存し Phase 12 unassigned-task に follow-up 登録。Plan A の rollback はしない |
| 段 9 lazy-import-check FAIL | 4 handler のいずれかで lazy 化漏れ | Phase 5 ランブックに従い修正。3 回繰り返し失敗で Plan A 撤回・branch 破棄を user に提案 |

## 実測サマリ（実装着手後に記入）

- evidence: PASS
- AC-1 (build exit 0): PASS
- AC-2 (build:cloudflare exit 0 + worker.js 生成): PASS
- AC-3 (`useContext` null 非出現): PASS
- AC-4 (typecheck exit 0): PASS
- AC-5 (lint exit 0): PASS
- AC-6 (auth.ts top-level next-auth value import 0 件): PASS
- AC-7 (route/session helper が lazy factory 経由 + typecheck PASS): PASS
- AC-8 (next / react / react-dom / next-auth version 不変): PASS
- AC-9 (`pnpm test` exit 0): PASS
- 採用方針確定: Plan A (lazy factory) + build script `NODE_ENV=production`

## スコープ外（user 指示後）

- commit / push / PR / deploy は本 Phase で実施しない
- secret 文字列を build ログ抜粋に転記しない（含まれていた場合は redact）

## 参照

- `phase-11.md`（本仕様書本体）
- `phase-05.md`（実装ランブック / `getAuth()` シグネチャ詳細）
- `phase-09.md`（4 ゲート手順）
