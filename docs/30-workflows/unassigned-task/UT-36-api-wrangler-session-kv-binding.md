# UT-36: apps/api/wrangler.toml SESSION_KV バインディング適用

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-36 |
| タスク名 | apps/api/wrangler.toml SESSION_KV バインディング適用 |
| 優先度 | MEDIUM |
| 推奨Wave | Wave 2 |
| 状態 | unassigned |
| 種別 | infrastructure implementation |
| 作成日 | 2026-04-27 |
| 検出元 | UT-13 Phase 12 unassigned-task-detection |
| 既存タスク組み込み | なし |

## 目的

UT-13 の設計に従い `apps/api/wrangler.toml` に `SESSION_KV` バインディングを適用し、staging / production 環境で KV が利用可能な状態にする。DRY 化方針（`[vars]` での TTL 集中管理）を適用しながら、実 Namespace ID はリポジトリに含めない形で実装する。

## スコープ

### 含む

- `[[kv_namespaces]]` セクション（local preview 用）への `SESSION_KV` binding 追加
- `[[env.staging.kv_namespaces]]` セクションへの `SESSION_KV` binding 追加
- `[[env.production.kv_namespaces]]` セクションへの `SESSION_KV` binding 追加
- `[vars]` セクションへの TTL 設定追加（`SESSION_BLACKLIST_TTL_SECONDS` / `CONFIG_CACHE_TTL_SECONDS` / `RATE_LIMIT_WINDOW_SECONDS`）
- 実 Namespace ID は `<staging-kv-namespace-id>` 形式の placeholder とし、1Password から参照する手順をコメントに記載

### 含まない

- KV Namespace の実作成（UT-35 のスコープ）
- Worker 側 KV helper 実装（UT-32 のスコープ）
- CI/CD での ID 自動注入（別途 Secrets 管理タスクに委譲）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | UT-35 KV Namespace 実 ID 発行・1Password 登録 | wrangler.toml の `id` フィールドに設定する実 ID が UT-35 完了後に確定 |
| 上流 | UT-13 Cloudflare KV セッションキャッシュ設定 | バインディング設計・DRY 化方針・TTL 値が UT-13 で確定済み |
| 下流 | UT-32 Worker SESSION_KV helper 実装 | wrangler.toml のバインディングが有効になってから Workers ローカル動作確認が可能 |

## 参照

- `docs/30-workflows/ut-13-cloudflare-kv-session-cache/outputs/phase-08/dry-config-policy.md`（DRY 化 Before/After）
- `docs/30-workflows/ut-13-cloudflare-kv-session-cache/outputs/phase-05/kv-bootstrap-runbook.md`（Step 3 バインディング追記手順）
- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md`（wrangler.toml バインディング例）

## 苦戦箇所・知見

**実 ID をリポジトリに入れずに wrangler.toml を機能させる方法**:
wrangler.toml の `id` フィールドに実 Namespace ID を直書きせず、代わりに `<placeholder>` を残してコメントで 1Password からの参照手順を記載する。CI/CD では GitHub Secrets 経由で注入する方式（`sed` による ID 差し込みまたは wrangler の `--var` フラグ）を後続タスクで確立する。

**DRY 化の落とし穴**:
`[vars]` セクションに TTL を集中管理する場合、`[env.staging.vars]` 側でオーバーライドするとトップレベルの `[vars]` が無効化される wrangler の仕様がある。環境別に TTL を変える場合はオーバーライド不要なデフォルト値にとどめ、環境差分は `[env.*]` セクションに明示的に書く。

**`[[kv_namespaces]]` と `[[env.*.kv_namespaces]]` の書き方**:
TOML の `[[]]` 配列テーブル記法は追記すると前のエントリを上書きしない。wrangler 3.x では `[env.staging]` 配下で `[[env.staging.kv_namespaces]]` を使う。ローカル preview 用の `preview_id` は必須項目ではないが、`wrangler dev` での動作確認に使うため設定を推奨。
