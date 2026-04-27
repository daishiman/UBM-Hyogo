# Phase 4: verify suite 実行結果

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク種別 | spec_created / docs-only |
| 実行種別 | verify suite **手順定義**（実コマンド実行は別タスク） |
| 作成日 | 2026-04-27 |

## 実行種別の説明

本タスクは `spec_created` / docs-only であるため、verify suite は「実行手順の文書化」と「期待結果の定義」を成果物とする。実コマンド実行は Phase 5 runbook に従い、インフラ担当が実環境で実施する。

## verify suite チェックリスト

| # | チェック項目 | コマンド | 期待結果 | 状態 |
| --- | --- | --- | --- | --- |
| 1 | wrangler バージョン確認 | `wrangler --version` | `4.85.0` 以上 | DOCUMENTED |
| 2 | Cloudflare ログイン確認 | `wrangler whoami` | アカウント情報・account ID が表示される | DOCUMENTED |
| 3 | 既存 KV Namespace 一覧 | `wrangler kv:namespace list` | 設計命名（`ubm-hyogo-kv-prod` / `ubm-hyogo-kv-staging`）と重複しない | DOCUMENTED |
| 4 | 無料枠使用量確認（read） | Cloudflare ダッシュボード KV メトリクス参照 | 100,000 read/day に対する余力を記録 | DOCUMENTED |
| 5 | 無料枠使用量確認（write） | Cloudflare ダッシュボード KV メトリクス参照 | 1,000 write/day に対する余力を記録 | DOCUMENTED |
| 6 | 無料枠使用量確認（storage） | Cloudflare ダッシュボード KV メトリクス参照 | 1 GB に対する余力を記録 | DOCUMENTED |
| 7 | wrangler.toml TOML 構文確認 | `wrangler deploy --dry-run --env staging` | TOML パースエラーが出ない | DOCUMENTED |
| 8 | バインディング名衝突確認 | `grep -E "binding\s*=" apps/api/wrangler.toml` | `SESSION_KV` が未使用（既存は `DB`, `STORAGE`） | DOCUMENTED |
| 9 | account ID 一致確認 | wrangler.toml の `account_id` と `wrangler whoami` の比較 | 一致する | DOCUMENTED |
| 10 | KV 操作 dry-run | `wrangler kv:namespace create ubm-hyogo-kv-staging --preview` の事前確認（実行はしない） | コマンド構文に誤りがない | DOCUMENTED |

**状態凡例:**

- DOCUMENTED: 手順文書化済み（spec_created タスクの完了状態）
- PASS: 実環境で実行し成功（実行は Phase 5 で実施）
- FAIL: 実行失敗（差し戻し）

## 実行前提条件

- wrangler CLI 4.85.0 以上がインストール済み
- `wrangler login` 完了
- Phase 2 / Phase 3 の設計が確定済み（Phase 3 PASS 判定済み）
- `apps/api/wrangler.toml` が存在

## verify suite 失敗時の対応フロー

```
チェック失敗
  ├── チェック 1-2 失敗: wrangler 再インストール / 再ログイン
  ├── チェック 3 失敗: 既存 Namespace と命名衝突 → Phase 3 に差し戻し
  ├── チェック 4-6 失敗: 無料枠枯渇リスク → Phase 3 に差し戻し（用途縮退検討）
  ├── チェック 7-8 失敗: wrangler.toml 構文・命名修正 → Phase 2 に差し戻し
  ├── チェック 9 失敗: account 取り違え → 即停止し Phase 3 で再確認
  └── チェック 10 失敗: コマンド誤り → Phase 2 設計の再確認
```

## バインディング名衝突確認（机上）

`apps/api/wrangler.toml` の既存バインディング:

| 既存バインディング | 種別 | 衝突可能性 |
| --- | --- | --- |
| `DB` | D1 | なし |
| `STORAGE` | R2 | なし |
| `SESSION_KV`（新規追加予定） | KV | **未使用 → 追加可能** |

## 完了条件

- [x] verify suite チェックリストが文書化されている
- [x] 実行前提条件が記録されている
- [x] 失敗時の対応フローが定義されている
- [x] バインディング名衝突確認が机上で完了している

## 次 Phase 引き継ぎ事項

- verify suite チェックリストを Phase 5 runbook の前提条件として参照
- 実環境での実行コマンド（`wrangler kv:namespace list` 等）は Phase 5 セットアップ実行時にインフラ担当が実施
- `free-tier-usage-snapshot.md` に「実環境スナップショットは別途取得」と明記済み
