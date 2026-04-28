# UT-35: Cloudflare KV Namespace 実 ID 発行・1Password 登録

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-35 |
| タスク名 | Cloudflare KV Namespace 実 ID 発行・1Password 登録 |
| 優先度 | MEDIUM |
| 推奨Wave | Wave 2 |
| 状態 | unassigned |
| 種別 | operations |
| 作成日 | 2026-04-27 |
| 検出元 | UT-13 Phase 12 unassigned-task-detection |
| 既存タスク組み込み | なし |

## 目的

UT-13 で確定した Namespace 名に従い、Cloudflare 上で production / staging / staging preview の KV Namespace を実作成し、出力された Namespace ID を 1Password Environments に登録する。これにより UT-36（wrangler.toml 実装）および UT-32（Worker 実装）が参照できる ID 管理体制を確立する。

## スコープ

### 含む

- `wrangler kv:namespace create ubm-hyogo-kv-prod` の実行
- `wrangler kv:namespace create ubm-hyogo-kv-staging` の実行
- `wrangler kv:namespace create ubm-hyogo-kv-staging --preview` の実行
- 出力された Namespace ID の 1Password Environments（`UBM-Hyogo / Cloudflare / KV / prod`、`/ staging`、`/ staging-preview`）への登録
- 実 ID をリポジトリのどのファイルにも記載しないことの確認

### 含まない

- `apps/api/wrangler.toml` へのバインディング追記（UT-36 のスコープ）
- Worker 側 KV helper 実装（UT-32 のスコープ）
- KV 使用量モニタリング設定（UT-33 のスコープ）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | UT-13 Cloudflare KV セッションキャッシュ設定 | Namespace 名・命名規約・バインディング名が UT-13 で確定済み |
| 下流 | UT-36 wrangler.toml SESSION_KV バインディング適用 | 実 ID が確定してから wrangler.toml の `id = ...` を設定できる |
| 下流 | UT-32 Worker SESSION_KV helper 実装 | ローカル動作確認に preview Namespace ID が必要 |

## 参照

- `docs/30-workflows/ut-13-cloudflare-kv-session-cache/outputs/phase-05/kv-bootstrap-runbook.md`（実行手順の正本）
- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md`（KV セッションキャッシュセクション）

## 苦戦箇所・知見

**実 Namespace ID の secret hygiene**:
Cloudflare Namespace ID は 32 桁の hex 文字列。wrangler.toml に直書きするとリポジトリ経由で漏洩するリスクがある。本タスクでは 1Password への登録と `<placeholder>` 方式でリポジトリに ID を残さないことを徹底する。UT-34（pre-commit guard）が整備されるまでは手動レビューで補完する。

**Preview Namespace と通常 Namespace の混在**:
`--preview` フラグを付けると preview 用 Namespace ID が別途発行される。通常 Namespace と preview Namespace の ID は別物。wrangler.toml の `preview_id` フィールドに preview 用 ID を設定する必要があるため、両方を 1Password に登録する。

**1Password Environments の項目設計**:
UT-13 の命名規約（`UBM-Hyogo / Cloudflare / KV / <env>`）に揃え、`prod` / `staging` / `staging-preview` の 3 エントリを作成する。チームで共有するため Vault は `UBM-Hyogo` 共有 Vault を使用。
