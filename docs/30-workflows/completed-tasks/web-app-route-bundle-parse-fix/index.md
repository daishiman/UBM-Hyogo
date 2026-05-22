# Workflow: web-app-route-bundle-parse-fix

## 概要

`apps/web` (Next.js 16.2.4 + `@opennextjs/cloudflare` 1.19.4) で、App Route Handler 系エンドポイント（`/api/auth/error` 等）が staging / production の Cloudflare Workers 上で 500 を返している不具合を解消する。原因はビルダ Turbopack（Next 16 デフォルト）が App Route handler 内部の `app-router-context.js` を `[project]/...` 仮想プレースホルダパスで出力し、OpenNext の Worker bundle が実体に解決できずランタイムで `Could not parse module` を発生させること。

## ステータス

| 項目 | 値 |
|------|------|
| ブランチ | `fix/web-app-route-bundle-parse-fix` |
| 起点 | `origin/dev` (5913a3cc) |
| 種別 | bugfix / runtime regression recovery |
| visualEvidence | NON_VISUAL（ステータスコード + tail ログで判定） |
| 想定 PR base | `dev` |

## ワークフロー構成

| Phase | ファイル | 役割 |
|-------|---------|------|
| 1 | `phase-01.md` | 不具合の事実関係・要件 |
| 2 | `phase-02.md` | 影響範囲・スコープ境界・参照仕様 |
| 3 | `phase-03.md` | モジュール俯瞰・修正方針・代替案比較 |
| 4 | `phase-04.md` + `outputs/phase-04/task-01-switch-next-build-to-webpack.md` | I/O 契約 + 実装仕様書本体 |
| 5 | `phase-05.md` | データモデル不変宣言 |
| 6 | `phase-06.md` | 唯一の変更 diff + ビルドパイプライン擬似コード |
| 7 | `phase-07.md` | CLAUDE.md 不変条件 / SSOT 整合性検証 |
| 8 | `phase-08.md` | エラーパターンと fail-fast / rollback 起点 |
| 9 | `phase-09.md` | テスト計画（type/lint/build + runtime smoke + tail grep） |
| 10 | `phase-10.md` | デプロイ手順 + rollback target version |
| 11 | `phase-11.md` | 実行 evidence 計画（実装サイクルで生成） |
| 12 | `phase-12.md` | 実装ガイド・SSOT 同期・skill feedback 計画 |
| 13 | `phase-13.md` | PR 作成（多段ゲート、`dev` base） |

`artifacts.json` と `outputs/artifacts.json` は `phases[].status` / `metadata.workflow_state` を保持する正本。2026-05-09 の改善サイクルで `apps/web/package.json` の実コード変更、Phase 11 local evidence、Phase 12 strict 7 outputs、aiworkflow 正本同期を同一 wave で反映した。staging / production deploy と PR 作成は G2-G4 の user gate 後にのみ実行する。

## 不変条件

- CLAUDE.md `apps/web` env アクセス不変条件（`getEnv()` / `getPublicEnv()` 経路維持）
- `D1` 直接アクセスは `apps/api` に閉じる（不変条件 #5）
- service binding `API_SERVICE` は変更しない（既に staging / production deploy で配線済み）

## 既知のスコープ外（本ワークフローでは扱わない）

| 事象 | 対応先 |
|------|------|
| Sentry browser-extension 警告（`checkAndWarnIfIsEmbeddedBrowserExtension`） | 自社外、対応不可 |
| `127.0.0.1:8888 ERR_CONNECTION_REFUSED`（1Password 拡張 → ローカル app） | 自社外 |
| `Permissions-Policy: browsing-topics` 警告 | Chromium 標準警告、無害 |
| `core.js:297 reading 'payload'` / `timeUtils-...js: window is not defined` | ブラウザ拡張バンドル由来、自社外 |
| `favicon.ico 404` | 影響軽微・別ワークフローで対応可。本件には含めない |
