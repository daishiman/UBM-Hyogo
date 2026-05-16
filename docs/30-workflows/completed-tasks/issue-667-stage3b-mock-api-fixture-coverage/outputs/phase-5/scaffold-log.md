# Phase 5: scaffold log

## packages/contracts 作成

| ファイル | 種別 |
|---------|------|
| packages/contracts/package.json | 新規 |
| packages/contracts/tsconfig.json | 新規 |
| packages/contracts/src/index.mjs | 新規 |
| packages/contracts/src/me.mjs | 新規 |
| packages/contracts/src/public.mjs | 新規 |
| packages/contracts/src/admin.mjs | 新規 |
| packages/contracts/src/identity-conflicts.mjs | 新規 |
| packages/contracts/src/fixtures.mjs | 新規 |

## 実装方針の差分（仕様書からの逸脱と根拠）

- spec は plain ESM + `dist/` import 想定だが、`packages/shared` 既存 pattern と整合する
  最小実装として **plain ESM `.mjs`** を採用。これにより:
  - `scripts/e2e-mock-api.mjs` から `node` 直接実行で import 解決可能
  - plain ESM direct import step が不要（Phase 5 完了条件「mise exec -- pnpm install 完走」のみで足りる）
  - Vitest は `.mjs` を Vite の native ESM 解決で読み込み可能
- TypeScript 利用箇所は `tsconfig.json` の `allowJs: true` で `.mjs` をスキャン

## apps/api / apps/web 依存追加

```diff
   "dependencies": {
+    "@ubm-hyogo/contracts": "workspace:*",
     ...
   }
```

## install / symlink 確認

```text
apps/api/node_modules/@ubm-hyogo/contracts -> ../../../../packages/contracts
apps/web/node_modules/@ubm-hyogo/contracts -> ../../../../packages/contracts
```

`mise exec -- pnpm install` exit 0、symlink 双方向確認済み。
