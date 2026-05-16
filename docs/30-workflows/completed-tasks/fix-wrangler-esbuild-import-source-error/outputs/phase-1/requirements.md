# Phase 1 成果物: 要件定義・前提確認

## 真の論点
monorepo 全体に効く `pnpm.overrides.esbuild` の固定バージョンと、wrangler 4.85.0 が要求する esbuild feature flag (`import-source`) の整合をどう取るか。

## 現状 inventory（実装前スナップショット）
- `package.json#pnpm.overrides.esbuild`: `"0.25.4"`
- `package.json#devDependencies.wrangler`: `"4.85.0"`
- `apps/web/package.json#devDependencies.wrangler`: `"4.85.0"`
- `apps/api/package.json#devDependencies.wrangler`: `"4.85.0"`
- `apps/web/package.json#devDependencies.@opennextjs/cloudflare`: `"1.19.4"`
- `pnpm-lock.yaml` の esbuild parent: 全て `@esbuild/<platform>@0.25.4`
- `scripts/cf.sh` 冒頭コメント: pnpm.overrides.esbuild は `@opennextjs/aws` 版に合わせる旨を記載

## 実測 dependency facts
| Command | Result |
|---------|--------|
| `pnpm view wrangler@4.85.0 dependencies.esbuild` | `0.27.3` |
| `pnpm view @opennextjs/cloudflare@1.19.4 dependencies.esbuild` | empty |
| `pnpm view @opennextjs/aws@3.10.4 dependencies.esbuild` | `0.25.4` |
| `npx -y esbuild@0.27.3 --version` | `0.27.3`（`import-source` feature を認識）|

## 受入条件 (DoD への mapping)
1. wrangler 4.85.0 が要求する esbuild 版に揃える
2. `apps/web` の `build:cloudflare` 成功
3. `apps/api` の `wrangler deploy --dry-run --env staging` 成功
4. CI workflow ファイル無変更
5. lockfile 差分は esbuild 関連のみ

## carry-over
直近 5 コミットは本タスクと独立。carry-over なし。
