# Phase 7: 下流タスク handoff

## バインディング名・制約一覧

| 項目 | 値 / 内容 |
| --- | --- |
| バインディング名 | `SESSION_KV` |
| Namespace 名（production） | `ubm-hyogo-kv-prod` |
| Namespace 名（staging） | `ubm-hyogo-kv-staging` |
| Namespace 名（staging preview） | `ubm-hyogo-kv-staging-preview` |
| Namespace ID 取得元 | 1Password Environments（`UBM-Hyogo / Cloudflare / KV / <env>`） |
| 適用対象 wrangler.toml | `apps/api/wrangler.toml` のみ（apps/web からは KV 直接利用禁止） |
| TTL 方針参照 | docs/30-workflows/ut-13-cloudflare-kv-session-cache/outputs/phase-02/ttl-policy.md |
| 無料枠運用方針参照 | docs/30-workflows/ut-13-cloudflare-kv-session-cache/outputs/phase-02/free-tier-policy.md |
| 最終的一貫性指針 | docs/30-workflows/ut-13-cloudflare-kv-session-cache/outputs/phase-02/eventual-consistency-guideline.md |
| failure cases | docs/30-workflows/ut-13-cloudflare-kv-session-cache/outputs/phase-06/failure-cases.md |
| runbook | docs/30-workflows/ut-13-cloudflare-kv-session-cache/outputs/phase-05/kv-bootstrap-runbook.md |

## 下流タスク（認証実装）が遵守すべき制約

### 1. セッション本体を KV に保管しない

- セッション ID は JWT に格納する
- KV はブラックリスト（失効済み jti）のみに使用する
- 理由: 書き込み枠 1k/日 を消費しないため

### 2. put 直後の read を前提にしない

- 同一キーへの put → get を即時に行う設計を禁止
- 即時反映が必要な操作（ログアウト無効化・権限変更）は D1 / Durable Objects を使用

### 3. 全 read 箇所で null チェック

- TTL 失効後の get は null を返す
- null 時は D1 から再構築するフォールバックを実装

### 4. バインディング名は `SESSION_KV` で固定

- 環境差を意識せず、全環境で `env.SESSION_KV` で参照する

### 5. Namespace ID をリポジトリにコミットしない

- 実 ID は 1Password 経由で取得し、`apps/api/wrangler.toml` 編集時のみ参照

## 推奨実装パターン（下流タスク向け）

### Env 型定義

```ts
export interface Env {
  DB: D1Database          // 既存
  STORAGE: R2Bucket       // 既存
  SESSION_KV: KVNamespace // UT-13 で追加
  // ...
}
```

### セッションブラックリスト確認

```ts
export async function isSessionBlacklisted(
  env: Env,
  jti: string,
): Promise<boolean> {
  const v = await env.SESSION_KV.get(`session:blacklist:${jti}`)
  return v !== null
}

export async function blacklistSession(
  env: Env,
  jti: string,
  expSeconds: number,
): Promise<void> {
  await env.SESSION_KV.put(`session:blacklist:${jti}`, "1", {
    expirationTtl: expSeconds,
  })
}
```

### 設定キャッシュ（読み取り中心）

```ts
export async function getCachedConfig<T>(
  env: Env,
  key: string,
): Promise<T | null> {
  const raw = await env.SESSION_KV.get(`config:${key}`)
  return raw ? (JSON.parse(raw) as T) : null
}
```

## 禁止事項

- セッションごと write（FC-06）
- read-after-write 前提の実装（FC-01）
- Namespace ID のコード直書き（FC-05）
- production への書き込み smoke test（影響範囲が大きいため staging で完結）

## 完了条件

- [x] バインディング名・制約一覧が記載されている
- [x] 下流タスクが遵守すべき制約が列挙されている
- [x] 推奨実装パターンが提示されている
- [x] 禁止事項が明示されている
