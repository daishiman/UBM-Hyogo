# Phase 5: データモデル

## 目的

本タスクは **D1 schema / DTO / API payload を一切変更しない**。Phase 5 ではデータモデル変更が無いことを宣言し、間接的に依存する artifact（Worker bundle / ビルド成果物）の構造のみを記録する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 5 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | implemented-local |

## データモデル不変宣言

| 層 | 変更有無 | 根拠 |
| --- | --- | --- |
| D1 schema (`apps/api/migrations/*.sql`) | 無 | ビルダ切替はソース層に触れない |
| API DTO (`apps/api/src/routes/**`) | 無 | 同上 |
| `packages/shared` zod schema | 無 | 同上 |
| Auth.js session / JWT 形式 | 無 | 同上 |
| `apps/web/wrangler.toml` `[vars]` / service binding | 無 | NFR-2 |

## ビルド成果物の構造（参考）

| artifact | 形式 | 配置 |
| --- | --- | --- |
| Next standalone bundle | webpack output（`require`/`__webpack_require__` ベース） | `apps/web/.next/standalone/` |
| OpenNext worker bundle | ESM, single file | `apps/web/.open-next/worker.js` |
| OpenNext assets | static files | `apps/web/.open-next/assets/` |

> Turbopack 経路では `.next/server/app/.../*.js` 内に `[project]/...` virtual specifier が混入していた。webpack 経路ではこれが実体パス（`node_modules/next/dist/...`）に解決される。

## 完了条件

- [x] D1 / API / shared schema の不変を宣言
- [x] ビルド成果物の構造を記録

## 出力

- `phase-05.md`

## 参照資料

- `phase-04.md`
- `apps/web/open-next.config.ts`
