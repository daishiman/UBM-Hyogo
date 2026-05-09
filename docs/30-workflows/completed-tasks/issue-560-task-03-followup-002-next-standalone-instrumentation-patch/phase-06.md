# Phase 6: 本実装（GREEN）— patch script 改修 + open-next.config 経路維持

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 6 / 13 |
| Source | `outputs/phase-6/phase-6.md` |
| 状態 | completed |

## 目的

既存 `scripts/patch-next-standalone-instrumentation.mjs` を Phase 3 で凍結した API に合わせて改修し、`apps/web/open-next.config.ts` の `buildCommand` 経路を維持したまま Phase 5 の RED テストを GREEN に転換する。

## 実行タスク

### 6.1 patch script 改修

現行方式を維持する:

- 入力: `apps/web/.next/server/instrumentation.js`
- 入力: `apps/web/.next/server/instrumentation.js.map`
- 入力: `apps/web/.next/server/instrumentation.js.nft.json`
- trace copy: `.nft.json` の `files[]` を `server/` 起点で `.next/standalone/apps/web/.next/` へ copy
- 出力: `apps/web/.next/standalone/apps/web/.next/server/instrumentation.js`

追加する仕様:

- `cwd` guard: `process.cwd()` が `apps/web` 以外なら exit 1
- `--verify-only`: copy せず出力 artifact の存在と `register` / `Sentry` token を検証
- structured log: `event=... source=... target=...` 形式
- secret 非接触: env / DSN / token 値を読まない

### 6.2 `apps/web/open-next.config.ts` 経路維持

`buildCommand` は current state の `pnpm build && node ../../scripts/patch-next-standalone-instrumentation.mjs` を維持する。変更が必要な場合は Phase 10 で drift 理由を記録する。

### 6.3 GREEN 確認

- `node --test scripts/__tests__/patch-next-standalone-instrumentation.test.mjs` 全 PASS
- `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` PASS
- `cd apps/web && node ../../scripts/patch-next-standalone-instrumentation.mjs --verify-only` PASS

## 参照資料

- `outputs/phase-3/phase-3.md`
- `outputs/phase-5/red-evidence.log`

## 成果物

- `scripts/patch-next-standalone-instrumentation.mjs`
- `apps/web/open-next.config.ts`（必要時のみ編集）
- `outputs/phase-6/phase-6.md`
- `outputs/phase-6/green-evidence.log`

## 完了条件

- TC-01〜TC-07 が全 PASS（GREEN）
- `build:cloudflare` → patch 起動 → `--verify-only` の一連経路は OpenNext/esbuild mismatch で patch 到達前に blocked。local regression は PASS、CI-side artifact verification は push 後に確認
