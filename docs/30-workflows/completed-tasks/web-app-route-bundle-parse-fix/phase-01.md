# Phase 1: 要件定義

## 1.1 不具合の事実関係

### 観測事象（2026-05-08 時点）

| URL | HTTP status | 種別 |
|-----|------------|------|
| `https://ubm-hyogo-web-staging.daishimanju.workers.dev/api/auth/error` | 500 | App Route Handler |
| `https://ubm-hyogo-web-staging.daishimanju.workers.dev/login` | 200 | Server Component (page) |
| `https://ubm-hyogo-web-staging.daishimanju.workers.dev/` | 200（再デプロイ後） | Server Component (page) |
| `https://ubm-hyogo-web-staging.daishimanju.workers.dev/members` | 200（再デプロイ後） | Server Component (page) |

production 側 (`ubm-hyogo-web-production.daishimanju.workers.dev`) も再デプロイ後の Server Component pages は 200 だが、`/api/auth/error` は staging と同様に 500 になることが構造的に確実視される（同一 build/bundle 経路）。

### Worker tail (`scripts/cf.sh tail --config apps/web/wrangler.toml --env staging --format json`) で取得した例外

```
{
  "level": "error",
  "message": [
    "Error: Could not parse module '[project]/node_modules/next/dist/server/route-modules/app-route/vendored/contexts/app-router-context.js', file not found"
  ]
}
```

`[project]/...` は Turbopack が出力する仮想モジュールパスのプレフィクス。Cloudflare Workers ランタイムでは実体ファイルへの解決手段が無く parse fail する。

### Build environment

| 項目 | 値 |
|------|------|
| Node | 24.15.0（mise） |
| pnpm | 10.33.2 |
| `next` | 16.2.4 |
| `@opennextjs/cloudflare` | 1.19.4 |
| `next-auth` | 5.0.0-beta.30 |
| ビルドコマンド | `apps/web/package.json` の `"build": "NODE_ENV=production next build"`（Next 16 では **Turbopack がデフォルト**） |
| Worker bundling | `opennextjs-cloudflare build` が `.next` を読み Worker bundle (`.open-next/worker.js`) を生成 |

## 1.2 真因の確定（Why）

| 階層 | 内容 |
|------|------|
| 観測 | App Route Handler が Worker 上で起動時に `Could not parse module` を投げ 500 を返す |
| 直接原因 | Worker bundle に `[project]/node_modules/next/dist/server/route-modules/app-route/vendored/contexts/app-router-context.js` という未解決な仮想パス参照が残存している |
| 一段上 | Next.js 16 のデフォルトビルダである **Turbopack** が App Route module を出力する際、`vendored/contexts/app-router-context.js` を `[project]/...` 仮想 prefix で書き出す |
| 根本 | OpenNext (`@opennextjs/cloudflare` 1.19.4) は webpack 出力前提の bundling pipeline を持ち、Turbopack の virtual module path を実体に解決する経路を持たない |

> Server Component (page) routes が 200 を返すのは、`render` 経路では問題の virtual path を踏まないため。App Route Handler のみが問題 path を import する。

## 1.3 機能要件

| ID | 要件 |
|----|------|
| FR-1 | staging deploy 後に `/api/auth/error` が 5xx を返さないこと（404 / 200 / 302 のいずれか想定） |
| FR-2 | staging deploy 後に `/` `/members` `/login` `/register` が引き続き 200 を返すこと（既存 Server Component 経路の回帰なし） |
| FR-3 | production deploy 後に同様の状態であること |

## 1.4 非機能要件

| ID | 要件 |
|----|------|
| NFR-1 | 修正による build 時間の悪化は実測 +60s 以内（webpack 経路は実績あり） |
| NFR-2 | `wrangler.toml` の service binding `API_SERVICE` 構成を変更しない |
| NFR-3 | 1Password / `scripts/cf.sh` 経路を変更しない（既存 secret 注入経路維持） |
| NFR-4 | `getEnv()` / `getPublicEnv()` 経路の不変条件を維持（`process.env` 直接参照禁止） |

## 1.5 完了条件 (DoD)

| ID | 条件 | 検証方法 |
|----|------|---------|
| DoD-1 | `apps/web/package.json` の build script が webpack 強制になり、既存 post-build patch が webpack 出力でも fail しない | `git diff` で `--webpack` 追加と instrumentation patch の skip guard を確認 |
| DoD-2 | staging worker tail に `Could not parse module` が出ない | `scripts/cf.sh tail` を 5 分間維持しつつ `/api/auth/error` 等を叩く |
| DoD-3 | FR-1 〜 FR-3 の URL 群がそれぞれ期待 status を返す | `curl -o /dev/null -w "%{http_code}\n" <URL>` |
| DoD-4 | `pnpm typecheck` / `pnpm lint` が PASS | `mise exec -- pnpm typecheck && mise exec -- pnpm lint` |
