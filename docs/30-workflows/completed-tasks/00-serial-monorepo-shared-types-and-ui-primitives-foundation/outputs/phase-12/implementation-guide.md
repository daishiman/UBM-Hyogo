# Phase 12 / implementation-guide.md — 実装ガイド

## Part 1: 中学生レベル概念説明（例え話）

### なぜ必要か

サイトを作る時、「部品を共通にする」という考え方があります。例えば、学校の文房具置き場みたいに、みんなが使うハサミや定規を一か所にまとめておくと、それぞれのクラスが別々に同じものを買わなくていい。

このタスクでは、UBM 兵庫支部会のウェブサイトで使う「型」（データの形の定義）と「土台」（Node.js のバージョン、使うライブラリのセット）を一か所（`packages/shared`・`packages/integrations`）にまとめました。

### 何を作ったか

| 作ったもの | 役割 |
| --- | --- |
| `packages/shared` | 全アプリが共通で使う TypeScript 型の置き場所 |
| `packages/integrations` | Google Forms など外部サービスとつなぐ部品の置き場所 |
| `apps/api` の骨格 | Hono フレームワークで動く API サーバーの基本形 |
| `vitest` 設定 | テストを自動で実行する仕組み |
| `lint-boundaries` | 「web からは api の中身を直接見てはいけない」というルールを機械が確認する仕組み |

### 何が決まったか・何が未決か

| 決まったこと | 未決なこと（後続 Wave で実装） |
| --- | --- |
| 型の置き場所と名前空間 | 各型の中身（Wave 01b で実装） |
| FormsClient のインターフェース | FormsClient の実装（Wave 03a/03b で実装） |
| モノレポのパッケージ構成 | 各 API エンドポイントの実装（Wave 04a-04c） |
| lint-boundaries ルール | 認証実装（Wave 05a/05b） |

---

## Part 2: 技術者レベル詳細

### 後続 Wave への引き渡し

| 後続 Wave | 確認・実装項目 |
| --- | --- |
| 01a | `apps/api/wrangler.toml` の `[[d1_databases]]` placeholder を本番 database_id で更新する |
| 01b | `packages/shared/src/types/{schema,response,identity,viewmodel}/index.ts` の空 module を Zod スキーマと型で実装する |
| 02a/b/c | `apps/api/src/repository/` 配下にリポジトリ実装を追加。`apps/web` からの直接 import が ESLint で禁止されていることを再確認 |
| 03a/b | `packages/integrations/google/src/forms-client.ts` の `NotImplementedFormsClient` を本実装に差し替える |
| 04a/b/c | `apps/api/src/index.ts` の Hono に各エンドポイントを追加。`/healthz` は維持 |
| 05a/b | Auth.js 設定は `apps/web/src/app/api/auth/[...nextauth]/route.ts` に配置 |
| 06a/b/c | `apps/web/src/components/ui/` の UI primitives を再利用。新規 layout/member/admin 系は別ディレクトリ |
| 07a/b/c | repository 経由でのみデータアクセス。`apps/web` からの直接呼び出し禁止 |
| 08a/b | typecheck / lint / test / scaffold-smoke を全パス確認してから PR 作成 |
| 09a/b/c | Wave 0 の `wrangler.toml` placeholder を本番値（D1 database_id 等）に更新 |

### 重要ファイル・パス

| パス | 内容 |
| --- | --- |
| `packages/shared/src/index.ts` | 共通型のエントリポイント（runtimeFoundation 定数含む） |
| `packages/shared/src/types/ids.ts` | Branded type 定義（MemberId, ResponseId 等） |
| `packages/integrations/google/src/forms-client.ts` | FormsClient インターフェース |
| `apps/api/src/index.ts` | Hono アプリ骨格（`/healthz`, `/health` エンドポイント済） |
| `apps/api/wrangler.toml` | Workers 設定（D1 binding placeholder あり） |
| `scripts/lint-boundaries.mjs` | アーキテクチャ境界チェックスクリプト |
| `vitest.config.ts` | Vitest 設定（ルートレベル） |

### TypeScript インターフェース

```typescript
// packages/shared/src/types/ids.ts
export type MemberId = Brand<string, "MemberId">;
export type ResponseId = Brand<string, "ResponseId">;
export type ResponseEmail = Brand<string, "ResponseEmail">;
export type StableKey = Brand<string, "StableKey">;

// packages/integrations/google/src/forms-client.ts
export interface FormsClient {
  getForm(formId: string): Promise<unknown>;
  listResponses(formId: string): Promise<unknown[]>;
}

// packages/shared/src/index.ts
export const runtimeFoundation = {
  node: "24.x",
  pnpm: "10.x",
  next: "16.x",
  react: "19.2.x",
  typescript: "6.x",
  webRuntime: "@opennextjs/cloudflare",
  apiRuntime: "hono-workers",
} as const;
```

### 実行・検証コマンド

```bash
mise exec -- pnpm install           # 依存インストール
mise exec -- pnpm typecheck         # 型チェック（全パッケージ）
mise exec -- pnpm lint              # lint-boundaries + eslint
mise exec -- pnpm test              # vitest
```

### 不変条件チェック

| 不変条件 | 対応状況 |
| --- | --- |
| #1 実フォームの schema をコードに固定しすぎない | schema/index.ts は空実装（Wave 01b で段階的に実装） |
| #5 D1 へのアクセスは apps/api に閉じる | lint-boundaries でアーキテクチャ境界を強制 |
