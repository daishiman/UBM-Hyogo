# Dependency Boundary Rules

> AC-3 の根拠ドキュメント。apps/web / apps/api / packages/shared / packages/integrations の dependency rule を一意に説明する。
> 正本仕様: `architecture-overview-core.md`, `architecture-monorepo.md`

## 基本原則

| 原則 | 内容 |
| --- | --- |
| 内側から外側への依存禁止 | packages/shared/core/ は外部依存ゼロを維持 |
| 機能の独立性 | apps/web/features/ 各機能は相互依存禁止 |
| 共通コードの活用 | UI, ビジネスロジック, 型定義を packages/shared/ で共有 |
| インテグレーション分離 | 外部サービス連携は packages/integrations/ に閉じ、相互依存を禁止 |

## 依存関係マトリクス

| 依存元 | 依存先 | 許可 | 根拠 |
| --- | --- | --- | --- |
| apps/web | apps/api | **禁止** | 直接通信は fetch 経由（CORS Policy 適用） |
| apps/web | packages/shared/* | 許可 | 共有コード再利用 |
| apps/web | packages/integrations/* | 許可 | 外部サービス連携 |
| apps/api | packages/shared/* | 許可 | 共有コード再利用 |
| apps/api | packages/integrations/* | 許可 | 外部サービス連携 |
| apps/api | Cloudflare D1 | 許可（唯一） | D1 binding は apps/api に閉じる |
| apps/web | Cloudflare D1 | **禁止** | CLAUDE.md 不変条件 5 |
| packages/integrations/{service} | packages/shared/core/ | 許可 | ドメイン型参照 |
| packages/integrations/{service} | packages/integrations/{other} | **禁止** | integrations 間の相互依存禁止 |
| packages/shared/infrastructure/ | packages/shared/core/ | 許可 | ドメイン型参照 |
| packages/shared/infrastructure/ | packages/shared/src/types/ | 許可 | 型定義参照 |
| packages/shared/ui/ | packages/shared/core/ | 許可 | UIコンポーネントのドメイン依存 |
| packages/shared/src/services/ | packages/shared/src/types/ | 許可（types/ のみ） | ドメインロジック |
| packages/shared/core/ | 任意 | **禁止（外部依存ゼロ）** | ドメイン純粋性の保証 |
| packages/shared/src/types/ | 任意 | **禁止（外部依存ゼロ）** | 型純粋性の保証 |

## pnpm workspace 依存宣言ルール

| ルール | 内容 |
| --- | --- |
| 明示的依存のみ許可 | package.json に宣言された依存関係のみアクセス可能（幽霊依存禁止） |
| workspace:* プロトコル | 内部パッケージ参照には `workspace:*` を使用 |
| 外部パッケージ | npm registry からは明示的バージョン指定で宣言 |
| 消費側と提供側 | 消費側が依存を宣言していても、提供側でも宣言が必要 |

## 依存違反の検出

| 方法 | 実装 |
| --- | --- |
| ESLint | eslint-plugin-boundaries を使用して CI でブロック |
| pnpm strict mode | `.npmrc` に `node-linker=isolated` を設定し幽霊依存を防止 |
| TypeScript | moduleResolution: bundler で型解決を厳密化 |

## @repo/shared サブパス解決（3層整合運用）

| 層 | 正本ファイル | 役割 |
| --- | --- | --- |
| npm 公開境界 | packages/shared/package.json（exports, typesVersions） | サブパスの公開契約 |
| TypeScript 型解決 | apps/web/tsconfig.json（compilerOptions.paths） | tsc --noEmit の解決 |
| テスト時解決 | apps/web/vitest.config.ts（vite-tsconfig-paths） | Vitest 実行時に tsconfig.paths を自動解決 |

**重要**: 3層の定義が常に同期している必要がある。`exports` にサブパスを追加した場合、同一 PR で `paths` を更新する。

## D1 アクセス制御（不変条件）

| 制約 | 内容 | 根拠 |
| --- | --- | --- |
| D1 直アクセス | apps/api のみ許可 | CLAUDE.md 不変条件 5 |
| apps/web → D1 | 禁止（fetch 経由で apps/api にリクエスト） | D1 binding は Workers binding 経由のみ |

## ブランチ × 環境 × D1 の対応

| ブランチ | 環境 | D1 データベース |
| --- | --- | --- |
| feature/* | local | wrangler dev（ローカル D1） |
| dev | staging | ubm-hyogo-db-staging（990e5d6c-...） |
| main | production | ubm-hyogo-db-prod（24963f0a-...） |

## 参照ファイル

| 種別 | パス |
| --- | --- |
| 正本 | .claude/skills/aiworkflow-requirements/references/architecture-overview-core.md |
| 正本 | .claude/skills/aiworkflow-requirements/references/architecture-monorepo.md |
| runtime topology | outputs/phase-02/runtime-topology.md |
| version policy | outputs/phase-02/version-policy.md |
