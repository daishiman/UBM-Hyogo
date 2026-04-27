# UT-32: Worker SESSION_KV helper 実装

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-32 |
| タスク名 | Worker SESSION_KV helper 実装 |
| 優先度 | MEDIUM |
| 推奨Wave | Wave 2 |
| 状態 | unassigned |
| 種別 | backend implementation |
| 作成日 | 2026-04-27 |
| 検出元 | UT-13 Phase 12 unassigned-task-detection |
| 既存タスク組み込み | なし |

## 目的

`apps/api/src` 内に `SESSION_KV` helper を実装し、セッションブラックリスト（JWT jti ブラックリスト）・設定キャッシュ・レートリミットの 3 用途を UT-13 の禁止パターン（put 直後 get 禁止・セッション本体 KV 保存禁止）に従って扱えるようにする。D1 との多層防御設計も実装し、ログアウト時の即時無効化を保証する。

## スコープ

### 含む

- `apps/api/src/lib/kv/` 配下への helper 実装
  - `isSessionBlacklisted(env, jti)` — セッション jti がブラックリストに存在するかを確認
  - `blacklistSession(env, jti, ttlSec)` — jti をブラックリストに登録（ログアウト時）
  - `getCachedConfig(env, key)` / `setCachedConfig(env, key, value, ttlSec)` — 設定キャッシュ helper
- D1 `sessions` テーブルの `revoked_at` との多層防御実装（KV ミス時も D1 で拒否できる設計）
- `put` 直後 `get` パターンと「セッション本体 KV 保存」を禁止するユニットテスト
- `Env` インターフェースへの `SESSION_KV: KVNamespace` / TTL 型の追加

### 含まない

- wrangler.toml のバインディング設定（UT-36 のスコープ）
- KV Namespace 実 ID 管理（UT-35 のスコープ）
- レートリミットの完全実装（本タスクは基本 helper のみ。Durable Objects 移行は UT-33 で検討）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | UT-36 wrangler.toml SESSION_KV バインディング適用 | `wrangler dev` で KV binding が有効でないとローカル動作確認できない |
| 上流 | UT-13 Cloudflare KV セッションキャッシュ設定 | helper の実装パターン・禁止事項・TTL 値が UT-13 で確定済み |
| 関連 | UT-22 D1 migration SQL 実体記述・本番適用 | D1 `sessions` テーブルの `revoked_at` カラムが必要 |
| 下流 | 認証実装タスク（ログアウト API 実装） | blacklistSession を呼び出す上位タスク |

## 参照

- `docs/30-workflows/ut-13-cloudflare-kv-session-cache/outputs/phase-12/implementation-guide.md`（Part 2 技術実装詳細）
- `docs/30-workflows/ut-13-cloudflare-kv-session-cache/outputs/phase-02/eventual-consistency-guideline.md`（禁止パターン）
- `docs/30-workflows/ut-13-cloudflare-kv-session-cache/outputs/phase-07/handoff.md`（下流向け実装指針）

## 苦戦箇所・知見

**put 直後 get の誤用防止**:
Cloudflare KV の最終的一貫性（最大 60 秒伝搬遅延）により、`put` した直後に同じキーを `get` しても古い値が返る可能性がある。「ブラックリスト登録の即時確認」を同一リクエスト内でやらない設計が必要。helper の実装では `put` の戻り値を使って結果を確認するのではなく、D1 の `revoked_at` との多層防御で対処する。

**セッション本体保存禁止の意図**:
KV は無料枠 1k write/day しかない。セッション作成のたびに KV write するとユーザー規模が数百人でも枯渇する。セッション本体は JWT で完結させ、KV はブラックリスト（ログアウト済み jti）のみを管理する設計を守ること。helper に「セッション本体オブジェクトを value に保存する」APIを作らない。

**`Env` インターフェースの型安全性**:
`SESSION_KV: KVNamespace` を `Env` に加えると、既存の `DB: D1Database` / `STORAGE: R2Bucket` との型整合が必要。Hono の `createFactory()` や `createMiddleware()` で利用している `HonoEnv` 型定義と同期する。TTL は `string` 型として `SESSION_BLACKLIST_TTL_SECONDS` を受け取り、helper 内で `parseInt` する。

**D1 多層防御の優先順位**:
認証 middleware では (1) D1 で `revoked_at` 確認（即時反映） → (2) KV でブラックリスト確認（補完・高速化）の順序が推奨。KV は補助的な高速化層であり、KV ヒット時は即拒否・KV ミス時は D1 で再確認が正しいパターン。KV のみに依存した実装は 60 秒の窓でログアウトが無効化されるリスクがある。
