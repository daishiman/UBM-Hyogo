# Phase 4: I/O 契約

## 目的

本タスクはビルダ切替（Turbopack → webpack）のみで、ソースコード関数のシグネチャを変更しない。Phase 4 では **ビルド入出力 / ランタイム HTTP 契約 / Worker bundle 配置** の I/O 契約を確定する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 4 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | implemented-local |

## 1. ビルド I/O 契約

| ステージ | 入力 | 出力 | exit |
| --- | --- | --- | --- |
| `pnpm --filter @ubm-hyogo/web build` | `apps/web/**/*.{ts,tsx}` / `apps/web/next.config.ts` / 環境変数 `NODE_ENV=production` | `apps/web/.next/`（webpack 経路、`[project]/...` 仮想 prefix を含まない） | 0 success / 1 build fail |
| `opennextjs-cloudflare build` | `apps/web/.next/` / `apps/web/open-next.config.ts` | `apps/web/.open-next/worker.js`、`assets/`、`worker.js.map` | 0 / 1 |
| `node ../../scripts/patch-open-next-worker.mjs` | `apps/web/.open-next/worker.js` | 同ファイルに `buildAuthEnv` / `withAuthHeaders` 注入済み版 | 0 |

## 2. App Route Handler ランタイム HTTP 契約（修正後の期待）

| エンドポイント | 修正前 | 修正後 |
| --- | --- | --- |
| `GET /api/auth/error` | 500 (`Could not parse module ...app-router-context.js`) | 200 / 302（Auth.js 仕様の正常応答） |
| `POST /api/auth/[...nextauth]` 系 | 500（同上、構造的に同じ parse fail） | Auth.js 既定の正常応答（200 / 302 / 400 系） |
| `GET/POST /api/admin/[...path]` | 500（構造的） | 既存 service binding 経由の API レスポンス |
| `GET/POST /api/me/[...path]` | 500（構造的） | 同上 |

## 3. Server Component ランタイム HTTP 契約（不変）

| エンドポイント | 期待 status |
| --- | --- |
| `GET /` | 200（変化なし） |
| `GET /members` | 200（変化なし） |
| `GET /login` | 200（変化なし） |
| `GET /register` | 200（変化なし） |

## 4. Worker bundle 不変条件

| 観点 | 期待 |
| --- | --- |
| `[project]/` prefix | `.open-next/worker.js` 内に出現しない（webpack 経路では発生しない） |
| service binding `API_SERVICE` | `wrangler.toml` 構成と同一（変更なし） |
| 注入済み auth env bridge | `patch-open-next-worker.mjs` の post-build patch がそのまま機能 |

## 完了条件

- [x] ビルド I/O 契約を表で確定
- [x] App Route / Server Component の HTTP 契約期待値を確定
- [x] Worker bundle の不変条件を確定

## 出力

- `phase-04.md`
- `outputs/phase-04/task-01-switch-next-build-to-webpack.md`（実装仕様書本体）

## 参照資料

- `phase-01.md`（観測事象 / 真因）
- `phase-03.md`（修正方針）
- `apps/web/open-next.config.ts`
- `scripts/patch-open-next-worker.mjs`

## 統合テスト連携

Phase 9 の test 計画で本契約を runtime smoke / tail grep に落とし込む。
