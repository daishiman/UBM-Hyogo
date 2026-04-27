# Phase 5: バインディング名 / Namespace 名 対応表

> **重要:** 本ファイルには Namespace ID（実値）を記載しない。実値は 1Password Environments で管理する。

## 対応表

| 環境 | バインディング名 | Namespace 名 | Namespace ID 管理場所 |
| --- | --- | --- | --- |
| local (`wrangler dev`) | `SESSION_KV` | （miniflare ローカル KV） | 不要（エミュレーション） |
| local (`wrangler dev --remote`) | `SESSION_KV` | `ubm-hyogo-kv-staging-preview` | 1Password: `UBM-Hyogo / Cloudflare / KV / staging-preview` |
| staging | `SESSION_KV` | `ubm-hyogo-kv-staging` | 1Password: `UBM-Hyogo / Cloudflare / KV / staging` |
| production | `SESSION_KV` | `ubm-hyogo-kv-prod` | 1Password: `UBM-Hyogo / Cloudflare / KV / production` |

## 不変条件

- バインディング名は全環境で `SESSION_KV` に統一する（下流タスクが環境差を意識せず参照可能にするため）
- Namespace ID は本ファイルにも `wrangler.toml` 以外のリポジトリ内ファイルにも記載しない
- 1Password Environments を実 ID の正本とし、`wrangler.toml` 編集時は 1Password から読み出す
- production / staging の取り違え防止のため、編集時は環境ごとにファイル diff を必ず確認する

## 下流タスクからの参照例

```ts
// apps/api 内のセッション関連コード（下流タスクで実装）
export async function isSessionBlacklisted(
  env: Env,
  jti: string,
): Promise<boolean> {
  // バインディング名 SESSION_KV で全環境共通アクセス
  const v = await env.SESSION_KV.get(`session:blacklist:${jti}`)
  return v !== null
}
```

## TypeScript 型定義（下流タスク向け）

下流の認証実装タスクは以下の `Env` 型に `SESSION_KV: KVNamespace` を追加する。

```ts
export interface Env {
  DB: D1Database          // 既存
  STORAGE: R2Bucket       // 既存
  SESSION_KV: KVNamespace // 本タスクで追加するバインディング
  // ... 他の env vars
}
```

## 完了条件

- [x] バインディング名と Namespace 名の対応表が記載されている
- [x] Namespace ID は本ファイルに含まれていない（1Password 管理）
- [x] 下流タスクからの参照例が示されている
