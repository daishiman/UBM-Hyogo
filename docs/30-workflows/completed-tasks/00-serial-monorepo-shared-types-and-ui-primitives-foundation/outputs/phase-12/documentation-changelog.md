# Phase 12 / documentation-changelog.md — ドキュメント変更ログ

## サマリ

Wave 0 タスクで作成・変更されたドキュメント・設定ファイルの一覧。

## 新規作成

### タスク仕様書

| パス | 内容 |
| --- | --- |
| `docs/02-application-implementation/00-serial-monorepo-shared-types-and-ui-primitives-foundation/index.md` | タスク概要・Wave マトリクス |
| `docs/02-application-implementation/00-serial-monorepo-shared-types-and-ui-primitives-foundation/phase-01.md` | 実現可能性検証 |
| `docs/02-application-implementation/00-serial-monorepo-shared-types-and-ui-primitives-foundation/phase-02.md` | 環境・依存定義 |
| `docs/02-application-implementation/00-serial-monorepo-shared-types-and-ui-primitives-foundation/phase-03.md` | 設計・代替案評価 |
| `docs/02-application-implementation/00-serial-monorepo-shared-types-and-ui-primitives-foundation/phase-04.md` | 実装準備 |
| `docs/02-application-implementation/00-serial-monorepo-shared-types-and-ui-primitives-foundation/phase-05.md` | コア実装 |
| `docs/02-application-implementation/00-serial-monorepo-shared-types-and-ui-primitives-foundation/phase-06.md` | 統合 |
| `docs/02-application-implementation/00-serial-monorepo-shared-types-and-ui-primitives-foundation/phase-07.md` | AC検証 |
| `docs/02-application-implementation/00-serial-monorepo-shared-types-and-ui-primitives-foundation/phase-08.md` | リファクタリング |
| `docs/02-application-implementation/00-serial-monorepo-shared-types-and-ui-primitives-foundation/phase-09.md` | セキュリティ・品質 |
| `docs/02-application-implementation/00-serial-monorepo-shared-types-and-ui-primitives-foundation/phase-10.md` | 最終レビュー |
| `docs/02-application-implementation/00-serial-monorepo-shared-types-and-ui-primitives-foundation/phase-11.md` | 手動 smoke テスト |
| `docs/02-application-implementation/00-serial-monorepo-shared-types-and-ui-primitives-foundation/phase-12.md` | ドキュメント更新（本ファイル） |
| `docs/02-application-implementation/00-serial-monorepo-shared-types-and-ui-primitives-foundation/phase-13.md` | PR 作成 |
| `docs/02-application-implementation/00-serial-monorepo-shared-types-and-ui-primitives-foundation/artifacts.json` | 成果物メタ情報 |

### 実装ファイル（タスク成果物）

| パス | 内容 |
| --- | --- |
| `packages/shared/package.json` | shared パッケージ定義 |
| `packages/shared/tsconfig.json` | shared TypeScript 設定 |
| `packages/shared/src/index.ts` | エントリポイント（runtimeFoundation 含む） |
| `packages/shared/src/types/ids.ts` | Branded type 定義 |
| `packages/shared/src/types/ids.test.ts` | ids 型のテスト |
| `packages/shared/src/types/schema/index.ts` | スキーマ型（Wave 01b で実装予定） |
| `packages/shared/src/types/response/index.ts` | レスポンス型（Wave 01b で実装予定） |
| `packages/shared/src/types/identity/index.ts` | アイデンティティ型（Wave 01b で実装予定） |
| `packages/shared/src/types/viewmodel/index.ts` | ビューモデル型（Wave 01b で実装予定） |
| `packages/integrations/package.json` | integrations パッケージ定義 |
| `packages/integrations/src/index.ts` | integrations エントリポイント |
| `packages/integrations/google/package.json` | google サブパッケージ定義 |
| `packages/integrations/google/src/forms-client.ts` | FormsClient インターフェース |
| `packages/integrations/google/src/index.ts` | google サブパッケージエントリポイント |
| `scripts/lint-boundaries.mjs` | アーキテクチャ境界チェック |
| `vitest.config.ts` | Vitest 設定 |

## 変更

| パス | 変更内容 |
| --- | --- |
| `apps/api/src/index.ts` | `@ubm-hyogo/shared` / `@ubm-hyogo/integrations` import 追加、healthz エンドポイント追加 |
| `apps/api/wrangler.toml` | D1 binding placeholder 追加 |
| `package.json` | vitest / testing-library / jsdom devDependencies 追加、lint-boundaries スクリプト追加 |
| `pnpm-workspace.yaml` | packages/* をワークスペースに追加 |
| `tsconfig.json` | paths で @ubm-hyogo/* を解決できるように設定 |
| `pnpm-lock.yaml` | 依存関係ロック更新 |

## 削除

| パス | 削除理由 |
| --- | --- |
| `apps/api/src/sync/mapper.ts` | Wave 0 は契約定義のみ。実装は UT-21（Sheets→D1 sync）で担当 |
| `apps/api/src/sync/sheets-client.ts` | 同上 |
| `apps/api/src/sync/types.ts` | 同上（型は packages/shared/src/types/ で一元管理） |
| `apps/api/src/sync/worker.ts` | 同上 |

## 完了条件

- [x] 全変更ファイルを列挙
- [x] 削除理由を明記
