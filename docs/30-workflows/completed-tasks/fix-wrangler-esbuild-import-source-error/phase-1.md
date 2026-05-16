# Phase 1: 要件定義・前提確認

## 1.1 真の論点

> 「monorepo 全体に効く `pnpm.overrides.esbuild` の固定バージョンと、wrangler 4.85.0 が要求する esbuild feature flag (`import-source`) の整合をどう取るか」

副次論点ではない:
- wrangler のバージョン変更（後退・前進）はスコープ外。
- OpenNext / Next.js のメジャー変更はスコープ外。

## 1.2 P50 チェック

| 確認項目 | 結果 | 対応 |
|---------|------|------|
| current branch に修正済みコードがあるか | No | `implementation_mode: new` で進める |
| upstream(`dev` / `main`) に修正済みか | No | 同上 |
| 前提タスク完了 | N/A | 単独 hotfix |

## 1.3 現状 inventory

| ファイル / 設定 | 現値 | 影響 |
|----------------|------|------|
| `package.json#pnpm.overrides.esbuild` | `"0.25.4"` | monorepo 全 esbuild を 0.25.4 に固定 |
| `package.json#devDependencies.wrangler` | `"4.85.0"` | wrangler が `import-source` を esbuild に渡す |
| `apps/web/package.json#devDependencies.wrangler` | `"4.85.0"` | 同上 |
| `apps/api/package.json#devDependencies.wrangler` | `"4.85.0"` | 同上 |
| `apps/web/package.json#devDependencies.@opennextjs/cloudflare` | `"1.19.4"` | OpenNext build path も esbuild に依存 |
| `pnpm-lock.yaml` esbuild entries | 全て `@esbuild/<platform>@0.25.4` | overrides 効力下 |
| `scripts/cf.sh` コメント | "pnpm.overrides.esbuild は @opennextjs/aws が使用する esbuild version に合わせる" | 更新方針が明示済み |

## 1.4 実測 dependency facts

| Command | Result | 判断 |
| --- | --- | --- |
| `pnpm view wrangler@4.85.0 dependencies.esbuild` | `0.27.3` | wrangler 側 exact version として採用する |
| `pnpm view @opennextjs/cloudflare@1.19.4 dependencies.esbuild` | empty | 直接依存なし |
| `pnpm view @opennextjs/aws@3.10.4 dependencies.esbuild` | `0.25.4` | OpenNext 側は実 build で互換性を検証する |
| `npx -y esbuild@0.27.3 --supported:import-source=false --version` | `0.27.3` | `import-source` feature flag を認識する |

## 1.5 既存命名規則

- `pnpm.overrides` は root `package.json` 1 箇所のみで管理する慣習。
- バージョン pin は patch まで明示（例: `"0.25.4"`）。

## 1.6 受入条件

1. `wrangler 4.85.0` 配下の esbuild ビルドで `import-source` feature flag を有効に評価できる esbuild バージョンに揃える。
2. `apps/web` の `build:cloudflare`（`@opennextjs/cloudflare` 経由）が成功する。
3. `apps/api` の `wrangler deploy --dry-run --env staging` が成功する。
4. CI workflow ファイルは無変更。
5. `pnpm-lock.yaml` の差分は esbuild 関連のみに限定される。

## 1.7 carry-over 確認

直近 5 コミット:
```
f07f0abf docs(ui-prototype-alignment): add MVP recovery improvement specs
56c56993 feat(ut-17-followup-004): Cloudflare notification policy IaC and drift workflow
03e8df1f docs(ut-17-followup-003): alert relay weekly healthcheck cron spec
e7bab988 feat(issue-655): cf-audit-log D+7 recovery 2nd cycle
f9438996 chore(workflows): dev sync — task-18-FU visual regression suite
```
本タスクとは独立。carry-over なし。
