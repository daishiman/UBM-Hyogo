# UT-38: Vitest テストインフラ整備（apps/api エラーハンドラー coverage）

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-38 |
| タスク名 | Vitest テストインフラ整備（apps/api エラーハンドラー coverage） |
| 優先度 | MEDIUM |
| 推奨Wave | Wave 2 |
| 状態 | unassigned |
| 作成日 | 2026-04-27 |
| 既存タスク組み込み | あり |
| 組み込み先 | UT-10 (エラーハンドリング標準化) Phase 11 既知制限 L-9 由来 |

## 目的

UT-10 で実装した `apps/api/src/middleware/error-handler.ts` および `packages/shared/src/errors/` のユニットテストを vitest で実装し、line/branch カバレッジを計測する。UT-10 の Phase 11 既知制限 L-9 で「vitest 未導入のため手動確認のみ」とした部分を補い、CI でカバレッジが自動検証される状態にする。あわせて開発環境用のデバッグエンドポイント（`/__debug/throw`）も追加する。

## スコープ

### 含む
- `apps/api` に `vitest` / `@vitest/coverage-v8` を devDependency として追加
- `pnpm --filter apps/api test` でテストが実行される `vitest.config.ts` の作成
- `apps/api/src/middleware/error-handler.ts` のユニットテスト実装
  - `errorHandler` の正常系・異常系・development 環境での debug フィールド付与
  - `notFoundHandler` の正常系
  - `ApiError.fromUnknown` 経由の未知エラー変換
- `packages/shared/src/errors/` の主要ユニットテスト（`ApiError` / `isApiError` / エラーコード体系）
- line カバレッジ目標: 変更ファイル（`error-handler.ts`）で 80% 以上
- 開発環境用デバッグエンドポイント `/__debug/throw` の追加（`ENVIRONMENT === "development"` 限定）
- CI（`backend-ci.yml`）の lint/test ステップでカバレッジレポートを出力する設定

### 含まない
- `apps/web` 側のテスト環境整備（別タスク）
- e2e テスト（UT-29 のスコープ）
- Sheets / D1 統合テスト（UT-09 のスコープ）
- 100% カバレッジ要求（MVP では主要パスのみ）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | UT-10 (エラーハンドリング標準化) | `error-handler.ts` と `packages/shared/src/errors/` の実装が完了していること |
| 上流 | UT-05 (CI/CD パイプライン実装) | `backend-ci.yml` の test ステップに vitest を追加するため |
| 関連 | UT-09 (Sheets→D1 sync 実装) | sync worker のテストを同時に追加する場合は UT-09 と調整 |

## 苦戦箇所・知見（UT-10 由来）

**Cloudflare Workers 環境でのテスト**: `apps/api` は Cloudflare Workers ランタイムで動作するが、vitest 自体は Node.js 環境で実行される。`Hono` のテストは `@hono/testing` ユーティリティまたは `hono/testing` の `testClient` を使い、Workers API（`crypto.randomUUID` 等）は `vi.stubGlobal` でモックする方法が一般的。Miniflare を使うと Workers ランタイム相当の環境が得られるが、セットアップコストが高いため MVP では vitest + 軽量モックで対応する。

**`ENVIRONMENT` env のモック**: `errorHandler` が `c.env?.ENVIRONMENT` を参照するため、テストでは `Hono` の context に環境変数をバインドする必要がある。`createExecutionContext` と `env` バインディングを型付けして渡す方法を事前に確認すること。

**`vitest.config.ts` と `tsconfig.json` の整合**: `apps/api` の TypeScript 設定が Worker 向けになっているため、vitest の `environment: "node"` または `"edge-runtime"` の選択と `tsconfig.json` の `types` フィールドが衝突しないか確認すること。`vitest.config.ts` の `resolve.alias` で `@ubm-hyogo/*` パスを正しく解決することも必要。

**`/__debug/throw` の security**: 開発環境限定エンドポイントは `ENVIRONMENT !== "development"` で早期リターンし、本番ビルドに混入しないよう確認すること。Cloudflare Workers では `wrangler.toml` の `[vars]` で `ENVIRONMENT = "development"` を設定するローカル開発パターンを使う。

**`vitest` と `pnpm workspace` の相性**: monorepo 内の `packages/shared` への型参照は `pnpm --filter apps/api build` の前に `packages/shared` のビルドが必要になる場合がある。UT-10 の `packages/shared/src/errors/` を direct import する場合、`tsconfig.json` の `paths` で `@ubm-hyogo/shared` を解決できるか確認すること。

## 実行概要

1. `apps/api/package.json` に `vitest` / `@vitest/coverage-v8` を追加する
2. `apps/api/vitest.config.ts` を作成し、テスト対象・カバレッジ設定を記述する
3. `apps/api/src/middleware/error-handler.test.ts` を作成する（RED → GREEN サイクル）
4. `packages/shared/src/errors/*.test.ts` の主要テストを作成する
5. `apps/api/src/index.ts` に `/__debug/throw` エンドポイントを追加する（development のみ）
6. `backend-ci.yml` の lint ステップに `pnpm --filter apps/api test --coverage` を追加する
7. `pnpm --filter apps/api test` でローカル実行を確認する

## 完了条件

- [ ] `pnpm --filter apps/api test` が CI / ローカル両方で PASS する
- [ ] `error-handler.ts` の line カバレッジが 80% 以上
- [ ] `packages/shared/src/errors/` の主要クラスにユニットテストが存在する
- [ ] `/__debug/throw` が `development` 環境でのみ有効化される
- [ ] `backend-ci.yml` の test ステップが vitest カバレッジを出力する
- [ ] `pnpm typecheck` が通過する（型整合性の維持）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | apps/api/src/middleware/error-handler.ts | テスト対象の実装 |
| 必須 | packages/shared/src/errors/ | テスト対象の共有エラーモジュール |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/outputs/phase-12/implementation-guide.md | UT-10 実装ガイド（Part 2 技術詳細）|
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/outputs/phase-04/ | UT-10 テスト設計成果物（参考） |
| 参考 | .github/workflows/backend-ci.yml | CI ステップへの追加箇所 |
| 参考 | .claude/skills/aiworkflow-requirements/references/error-handling.md | エラーハンドリング正本仕様 |
