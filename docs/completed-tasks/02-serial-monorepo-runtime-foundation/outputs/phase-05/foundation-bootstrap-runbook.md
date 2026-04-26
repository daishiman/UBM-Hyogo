# Foundation Bootstrap Runbook

> UBM-Hyogo monorepo-runtime-foundation の構築手順書。
> 後続 task（03 / 04 / 05b）が参照する。
> 本 task は `code_and_docs` として close-out するため、以下は **実装済み構成の再現手順と確認手順** である。

## 前提条件確認

### Step 1: runtime バージョン確認

```bash
node --version        # v24.x.x であること（LTS: Krypton、2028-04 まで）
pnpm --version        # 10.x.x であること（pnpm 9 は 2026-04-30 EOL）
wrangler --version    # 4.x.x であること（v3 は保守モード）
```

### Step 2: Node バージョン管理

```bash
# .nvmrc 作成（Node 24.x 固定）
echo "24" > .nvmrc
# または nodenv / fnm を使用
```

## workspace 構築手順

### Step 3: pnpm workspace 設定

```yaml
# pnpm-workspace.yaml（ルートに配置）
packages:
  - 'apps/*'
  - 'packages/*'
```

### Step 4: ルート package.json

```json
{
  "name": "ubm-hyogo",
  "private": true,
  "engines": {
    "node": ">=24.0.0",
    "pnpm": ">=10.0.0"
  },
  "scripts": {
    "dev": "pnpm --parallel -r dev",
    "build": "pnpm --parallel -r build",
    "typecheck": "pnpm --parallel -r typecheck",
    "lint": "pnpm --parallel -r lint",
    "test": "pnpm --parallel -r test"
  },
  "devDependencies": {
    "typescript": "^6.0.3"
  }
}
```

### Step 5: .npmrc 設定

```ini
node-linker=isolated
```

### Step 6: pnpm インストール

```bash
pnpm install          # エラーなし
pnpm typecheck        # TypeScript 6.x strict で通ること
pnpm lint             # lint エラーなし
```

## apps/web 構成

### Step 7: apps/web/package.json（期待値）

```json
{
  "name": "ubm-hyogo-web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "opennextjs-cloudflare",
    "start": "next start",
    "typecheck": "tsc --noEmit",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^16.2.4",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "@auth/core": "^0.34.0",
    "next-auth": "^5.0.0",
    "@repo/shared": "workspace:*"
  },
  "devDependencies": {
    "@opennextjs/cloudflare": "latest",
    "typescript": "^6.0.3",
    "@cloudflare/workers-types": "latest",
    "tailwindcss": "^4.2.4"
  }
}
```

### Step 8: apps/web/next.config.ts（@opennextjs/cloudflare 設定）

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    ppr: "incremental",
  },
};

export default nextConfig;
```

### Step 9: apps/web/wrangler.toml（OpenNext Workers）

```toml
name = "ubm-hyogo-web"
main = ".open-next/worker.js"
compatibility_date = "2026-04-26"
compatibility_flags = ["nodejs_compat"]

[assets]
directory = ".open-next/assets"
binding = "ASSETS"

[vars]
ENVIRONMENT = "production"

[env.staging]
name = "ubm-hyogo-web-staging"

[env.staging.vars]
ENVIRONMENT = "staging"
```

注記: この変更は本 task で実施済み。

## apps/api 構成

### Step 10: apps/api/package.json（期待値）

```json
{
  "name": "ubm-hyogo-api",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "wrangler dev",
    "build": "wrangler build",
    "deploy": "wrangler deploy",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src"
  },
  "dependencies": {
    "hono": "^4.12.0",
    "@repo/shared": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^6.0.3",
    "wrangler": "^4.85.0",
    "@cloudflare/workers-types": "latest"
  }
}
```

### Step 11: apps/api/src/index.ts（期待値）

```typescript
import { Hono } from "hono";

const app = new Hono<{ Bindings: { DB: D1Database } }>();

app.get("/health", (c) => c.json({ ok: true }));

export default app;
```

apps/api/wrangler.toml は既に適切な設定（Hono Workers + D1 binding）が存在するため、変更不要。

## packages 構成

### Step 12: packages/shared/package.json（期待値）

```json
{
  "name": "@repo/shared",
  "version": "0.0.1",
  "private": true,
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^6.0.3"
  }
}
```

### Step 13: packages/integrations/ 構成

```
packages/integrations/
└── google-forms/
    ├── package.json（name: "@repo/integrations-google-forms"）
    └── src/index.ts
```

## downstream 参照表（03/04/05b 向け）

| 下流 task | 参照するファイル | 内容 |
| --- | --- | --- |
| 03-serial-data-source-and-storage-contract | outputs/phase-02/runtime-topology.md | apps/api が D1 を保持する設計根拠 |
| 03-serial-data-source-and-storage-contract | outputs/phase-02/version-policy.md | TypeScript 6.x の型定義前提 |
| 04-serial-cicd-secrets-and-environment-sync | outputs/phase-02/version-policy.md | 環境変数設計（AUTH_* プレフィックス等） |
| 05b-parallel-smoke-readiness-and-handoff | outputs/phase-02/runtime-topology.md | runtime 構成確認 |
| 05b-parallel-smoke-readiness-and-handoff | outputs/phase-05/foundation-bootstrap-runbook.md | 構築手順・rollback 手順 |

## rollback 手順

| シナリオ | 手順 |
| --- | --- |
| pnpm workspace 設定ミス | pnpm-workspace.yaml を修正して `pnpm install` を再実行 |
| Next.js 16 互換性問題 | `outputs/phase-02/version-policy.md` を参照して version を戻す |
| @opennextjs/cloudflare バンドルサイズ超過（3MB） | `optimizePackageImports` オプションを追加。超過なら Pages Functions（25MB）への移行を検討 |
| Auth.js v5 JWT 暗号化エラー | `AUTH_SECRET` が設定されているか確認。v5 の既知バグを参照 |

## 実施後の sanity check

```bash
# scope 外のファイルが変更されていないか確認
git diff --stat -- doc/02-serial-monorepo-runtime-foundation

# 責務境界キーワードの確認
rg -n "apps/web|apps/api|packages/shared|packages/integrations" doc/02-serial-monorepo-runtime-foundation

# 主要キーワードの確認
rg -n "dev|main|D1|1Password" doc/02-serial-monorepo-runtime-foundation
```
