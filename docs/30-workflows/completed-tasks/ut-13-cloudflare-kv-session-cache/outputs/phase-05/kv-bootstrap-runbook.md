# Phase 5: KV Namespace 作成・バインディング設定 runbook

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク種別 | spec_created / docs-only |
| runbook 種別 | 手順定義（実行は下流タスクで実施） |
| 作成日 | 2026-04-27 |

## 前提条件

- wrangler@4.85.0 以上がインストール済み
- `wrangler login` 完了
- Phase 4 verify suite が全 DOCUMENTED → 実環境で全 PASS
- 1Password Environments への書き込み権限を保有
- `apps/api/wrangler.toml` が存在し、既存バインディング `DB`（D1）/ `STORAGE`（R2）が設定済み

## 実行手順

### Step 1: KV Namespace を作成する

```bash
# production 用 Namespace 作成
wrangler kv:namespace create ubm-hyogo-kv-prod
# 出力例:
# 🌀 Creating namespace with title "ubm-hyogo-kv-prod"
# ✨ Success!
# Add the following to your configuration file in your kv_namespaces array:
# { binding = "ubm_hyogo_kv_prod", id = "<production-kv-namespace-id>" }

# staging 用 Namespace 作成
wrangler kv:namespace create ubm-hyogo-kv-staging
# 出力された id を控える

# staging 用 preview Namespace 作成（ローカル開発・preview 用）
wrangler kv:namespace create ubm-hyogo-kv-staging --preview
# 出力された preview_id を控える
```

### Step 2: 取得した Namespace ID を 1Password に保管する

| 環境 | 1Password エントリ | 保管項目 |
| --- | --- | --- |
| production | `UBM-Hyogo / Cloudflare / KV / production` | id |
| staging | `UBM-Hyogo / Cloudflare / KV / staging` | id |
| staging (preview) | `UBM-Hyogo / Cloudflare / KV / staging-preview` | preview_id |

Namespace ID は API token そのものではないが、環境取り違え防止のため 1Password 経由で集中管理する。

### Step 3: `apps/api/wrangler.toml` に KV バインディングを追加する

採用方式: **実 ID を `wrangler.toml` に直接記載 + `.gitignore` 対象外（Cloudflare KV ID は機密ではないが取り違え防止のためレビュー必須）**

```toml
# apps/api/wrangler.toml に追加するセクション

[env.staging]
# 既存設定...

[[env.staging.kv_namespaces]]
binding = "SESSION_KV"
id = "<staging-kv-namespace-id>"           # 1Password から取得
preview_id = "<staging-kv-preview-namespace-id>"  # 1Password から取得

[env.production]
# 既存設定...

[[env.production.kv_namespaces]]
binding = "SESSION_KV"
id = "<production-kv-namespace-id>"        # 1Password から取得
```

### Step 4: 動作確認 (smoke test) を実施する

詳細は `outputs/phase-05/read-write-verification.md` を参照。

```bash
# staging で動作確認
wrangler dev --env staging --remote
# 別ターミナルで /health-kv 等の検証エンドポイントに HTTP リクエスト
# put → get → delete を確認
```

### Step 5: 検証用キーを削除する

```bash
wrangler kv:key delete --binding=SESSION_KV --env=staging "verify:phase-05"
```

### Step 6: production への反映

production への deploy は別タスク（CI/CD パイプライン経由）で実施する。本 runbook では namespace 作成と wrangler.toml 設定までを完了範囲とする。

## rollback 手順（バインディングを撤回する場合）

```bash
# 1. wrangler.toml から該当 [[kv_namespaces]] セクションを削除
# 2. デプロイし直す（次回 deploy で反映）

# 3. 必要に応じて Namespace 自体を削除（データ消失するため慎重に）
wrangler kv:namespace delete --namespace-id <namespace-id>
```

**注意:** Namespace 削除後、最大 60 秒間は他エッジから旧データが読まれる可能性がある。

## sanity check

| チェック | コマンド | 期待結果 |
| --- | --- | --- |
| Namespace 存在確認 | `wrangler kv:namespace list` | `ubm-hyogo-kv-prod` / `ubm-hyogo-kv-staging` が含まれる |
| wrangler.toml バインディング確認 | `grep -A3 "kv_namespaces" apps/api/wrangler.toml` | `binding = "SESSION_KV"` が含まれる |
| ID 取り違え確認 | `wrangler.toml` の env.staging.id と env.production.id が異なる | 異なる |
| Workers read/write 確認手順 | 検証エンドポイントへの HTTP リクエスト | `200 OK` かつ get 値が put 値と一致 |
| 検証用キー削除確認 | `wrangler kv:key list --binding=SESSION_KV --env staging` | `verify:phase-05` が含まれない |

## 異常系対応

| 症状 | 対応 |
| --- | --- |
| Namespace 作成時に「namespace already exists」エラー | `wrangler kv:namespace list` で既存確認、必要なら削除して再作成 |
| `wrangler dev --remote` でバインディング解決失敗 | wrangler.toml の `id` 記載と Namespace ID の対応を 1Password で再確認 |
| put 直後 get で値が返らない | 最終的一貫性 60 秒の影響。リトライまたは別キーで再検証 |
| 検証用キー削除漏れ | `wrangler kv:key list --binding=SESSION_KV --env staging` で確認、bulk delete |

## 完了条件

- [x] production / staging の KV Namespace 作成手順が定義されている
- [x] wrangler.toml バインディング設計（`SESSION_KV`）が定義されている
- [x] Namespace ID 管理方針（1Password 集中管理）が定義されている
- [x] Workers から `SESSION_KV.put` / `SESSION_KV.get` 確認手順が定義されている
- [x] runbook と sanity check が記録されている
- [x] AC-1〜AC-3 が手順として達成されている

## 次 Phase 引き継ぎ事項

- runbook を Phase 6 異常系検証の前提条件として参照
- AC-1〜AC-3 が手順として完成 → Phase 7 AC matrix に証跡として登録
- 実コマンド実行は別タスク（インフラ担当）で実施
