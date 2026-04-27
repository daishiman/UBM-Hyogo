# Phase 4: 無料枠使用量スナップショット

## 取得方針

本タスクは `spec_created` / docs-only であるため、実環境のスナップショットは Phase 5 セットアップ実行時にインフラ担当が取得する。本ファイルではスナップショットのテンプレートと記録方法を定義する。

## スナップショットテンプレート

### 取得日時

| 項目 | 値 |
| --- | --- |
| 取得日 | YYYY-MM-DD |
| 取得時刻（JST） | HH:MM |
| 取得者 | （担当者名） |
| 対象アカウント | （Cloudflare account 名） |

### KV 無料枠使用量

| 制約項目 | 上限 | 現在使用量 | 余力 | 余力率 | 判定 |
| --- | --- | --- | --- | --- | --- |
| read / day | 100,000 | N/A | N/A | N/A | DOCUMENTED |
| write / day | 1,000 | N/A | N/A | N/A | DOCUMENTED |
| storage | 1 GB | N/A | N/A | N/A | DOCUMENTED |
| key 総数 | 無制限 | DOCUMENTED | - | - | PASS |

### 既存 KV Namespace 一覧

```
# wrangler kv:namespace list 出力をここに貼る
[
  { "id": "...", "title": "..." }
]
```

期待結果: `ubm-hyogo-kv-prod` / `ubm-hyogo-kv-staging` / `ubm-hyogo-kv-staging-preview` がいずれも存在しない（初回作成）

### Account ID 整合確認

| 項目 | 値 |
| --- | --- |
| `wrangler whoami` の account ID | DOCUMENTED |
| `apps/api/wrangler.toml` の `account_id` | DOCUMENTED |
| 一致判定 | DOCUMENTED |

## 取得手順

```bash
# 1. wrangler バージョン確認
wrangler --version
# 期待: 4.85.0

# 2. ログイン状態確認
wrangler whoami
# 期待: account 名と account ID が表示される

# 3. 既存 KV Namespace 一覧
wrangler kv:namespace list

# 4. 無料枠使用量
# Cloudflare Dashboard > Workers & Pages > KV > 各 Namespace のメトリクス
# https://dash.cloudflare.com/<account-id>/workers/kv/namespaces
```

## 余力判定基準

| 余力率 | 判定 | 対応 |
| --- | --- | --- |
| 70% 以上 | PASS | そのまま Phase 5 に進む |
| 30〜70% | WARN | 用途縮退の検討、運用監視の前倒し |
| 30% 未満 | FAIL | Phase 3 に差し戻し（用途縮退または有料プラン検討） |

## 完了条件

- [x] スナップショットテンプレートが定義されている
- [x] 取得手順が記録されている
- [x] 余力判定基準が明示されている

## 次 Phase 引き継ぎ事項

- 実環境スナップショットは Phase 5 セットアップ実行時に本テンプレートに沿って取得
- 余力 70% 以上を確認してから Namespace 作成に進む
