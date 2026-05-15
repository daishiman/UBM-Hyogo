# Phase 8: リファクタ

[実装区分: 実装仕様書]

> Phase: 8 / 13

---

## リファクタ方針

本タスクの本質は「regression 防止のための環境ガード追加」であり、過剰なリファクタは行わない。Phase 5 / 6 実装後、以下の最小限のクリーンアップのみ実施する。

## チェック項目

| 項目 | チェック方法 |
|------|-------------|
| `isTestOrPlaywright()` 以外で `process.env.NODE_ENV` / `process.env.PLAYWRIGHT_TEST` を直参照していない | `grep -nE "process\.env\.(NODE_ENV\|PLAYWRIGHT_TEST)" apps/web/src/lib/fetch/public.ts` で `isTestOrPlaywright()` 関数内 1 箇所のみ hit すること |
| ファイル冒頭コメントが新ロジックと整合 | Phase 5 Step 1 のコメントが反映されていること |
| 未使用 import がない | `mise exec -- pnpm --filter @ubm-hyogo/web lint` exit 0 |
| dead-code がない | `getServiceBinding()` 内の全 branch が `isTestOrPlaywright()` の戻り値に応じて到達可能 |
| `interface ServiceBinding` / `PublicEnv` / `FetchPublicOptions` 不変 | `git diff` で interface 行に変更がないこと |

## 命名一貫性

- `isTestOrPlaywright` という名前は「Vitest または Playwright runtime」を表す。`isCI` のような短い名前は GitHub Actions build/deploy でも真になるため避ける。
- 別名候補(`isTestRuntime` / `isNonProductionRuntime`)は将来 Cypress / WebdriverIO 拡張時に再評価。本タスクでは `isTestOrPlaywright` 採用で確定。

## 抽出禁止リファクタ

- `isTestOrPlaywright()` を `apps/web/src/lib/env.ts` に移動しない(`getEnv()` zod schema との混線を避けるため、`apps/web/src/lib/fetch/public.ts` 内 module-local に閉じる)。
- 別ファイル `apps/web/src/lib/runtime.ts` 等への新規切り出しはしない(再利用が確定するまでは module-local が望ましい / YAGNI)。

## 完了条件(Phase 8)

1. grep チェック PASS
2. `mise exec -- pnpm --filter @ubm-hyogo/web lint` exit 0
3. `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` exit 0
4. `git diff` で interface 行・他関数シグネチャに変更なし
