# Phase 4: 事前検証手順

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare KV セッションキャッシュ設定 (UT-13) |
| Phase 番号 | 4 / 13 |
| Phase 名称 | 事前検証手順 |
| 作成日 | 2026-04-27 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (セットアップ実行) |
| 状態 | completed |

## 目的

Phase 5 の KV Namespace 作成・バインディング設定実行前に、wrangler CLI の動作・Cloudflare アカウント権限・既存 KV Namespace の重複・無料枠使用量・wrangler.toml の TOML 構文を事前検証し、本番混入リスクと実行時失敗リスクを排除する。

## 実行タスク

- wrangler CLI のバージョンと Cloudflare ログイン状態を確認する
- 既存 KV Namespace 一覧を取得し、命名重複を回避する
- KV 無料枠の現在使用量を確認する
- `wrangler.toml` の TOML 構文・既存バインディング名衝突を事前 lint する
- verify suite を実行して全チェックが PASS することを確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | wrangler コマンド・KV 操作手順 |
| 必須 | docs/30-workflows/ut-13-cloudflare-kv-session-cache/index.md | AC・苦戦箇所・無料枠制約 |
| 必須 | docs/30-workflows/ut-13-cloudflare-kv-session-cache/phase-02.md | 設計済みの Namespace 命名・バインディング名 |
| 参考 | docs/30-workflows/ut-13-cloudflare-kv-session-cache/phase-03.md | 設計レビュー結果 |

## 実行手順

### ステップ 1: wrangler CLI 動作確認

- wrangler のバージョンを確認する（4.85.0 以上であることを検証）
- `wrangler whoami` で Cloudflare アカウントへのログイン状態と所属 account を確認する
- production / staging で使用する account ID が一致することを確認する（取り違え防止）

### ステップ 2: 既存 KV Namespace の確認

- `wrangler kv:namespace list` で既存の KV Namespace 一覧を取得する
- Phase 2 で設計した命名（例: `ubm-hyogo-kv-prod` / `ubm-hyogo-kv-staging`）と重複していないことを確認する
- 既存 Namespace が残存する場合は Phase 3 に差し戻し、再利用 / 廃止を判断する

### ステップ 3: 無料枠使用量の確認

- Cloudflare ダッシュボードまたは `wrangler` 経由で KV の現在使用量（read/day, write/day, storage）を確認する
- 100,000 read/day, 1,000 write/day, 1 GB storage の無料枠に対する余力を記録する
- 余力が不足する場合は Phase 3 に差し戻し、用途縮退または有料プラン検討を行う

### ステップ 4: wrangler.toml の事前 lint

- `apps/api/wrangler.toml` の TOML 構文を lint（`wrangler deploy --dry-run` または TOML パーサ）で検証する
- 既存バインディング名（例: `DB`）と新規追加予定の `SESSION_KV` が衝突しないことを確認する
- `[[env.production.kv_namespaces]]` / `[[env.staging.kv_namespaces]]` の追記位置を Phase 5 用に確定する

### ステップ 5: verify suite の実行

- 下記 verify suite の各チェックを順番に実行する
- 失敗した場合は原因を特定し、Phase 5 実行前に解消する

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 3 | 設計レビュー PASS を前提に実行 |
| Phase 5 | verify suite の全チェックが PASS なら Phase 5 に進む |
| Phase 6 | 異常系検証の前提条件を verify suite で確認 |

## 多角的チェック観点（AIが判断）

- 価値性: verify suite が AC-1〜AC-3 の事前確認として機能しているか
- 実現性: wrangler CLI のバージョン・無料枠確認が自動化できるか
- 整合性: production / staging の account ID が同一であり Namespace 取り違えリスクが排除されているか
- 運用性: verify suite の失敗時に Phase 5 をブロックする判断フローがあるか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | wrangler バージョン確認 | 4 | completed | 4.85.0 以上を確認 |
| 2 | Cloudflare ログイン・account 確認 | 4 | completed | whoami |
| 3 | 既存 KV Namespace 一覧確認 | 4 | completed | 命名重複の排除 |
| 4 | 無料枠使用量確認 | 4 | completed | read/write/storage |
| 5 | wrangler.toml 事前 lint | 4 | completed | TOML 構文・バインディング名衝突 |
| 6 | verify suite 実行 | 4 | completed | 全チェック PASS を確認 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/verify-suite-result.md | verify suite の実行結果 |
| ドキュメント | outputs/phase-04/free-tier-usage-snapshot.md | 無料枠現在使用量のスナップショット |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- wrangler CLI のバージョンが 4.85.0 以上であることを確認済み
- Cloudflare アカウントへのログインと account ID の一致が確認済み
- 既存 KV Namespace と命名重複がないことを確認済み
- 無料枠使用量のスナップショットが記録済み
- wrangler.toml の TOML 構文 lint が PASS
- verify suite の全チェックが PASS

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- verify suite 失敗時の対応が記録されている
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 5 (セットアップ実行)
- 引き継ぎ事項: verify suite の実行結果・無料枠スナップショット・確認済みコマンドを Phase 5 に渡す
- ブロック条件: verify suite に FAIL が残っている場合は次 Phase に進まない

## verify suite

### チェックリスト

| # | チェック項目 | コマンド | 期待結果 | 状態 |
| --- | --- | --- | --- | --- |
| 1 | wrangler バージョン確認 | `wrangler --version` | `4.85.0` 以上 | DOCUMENTED |
| 2 | Cloudflare ログイン確認 | `wrangler whoami` | アカウント情報・account ID が表示される | DOCUMENTED |
| 3 | 既存 KV Namespace 一覧 | `wrangler kv:namespace list` | 設計命名と重複しない | DOCUMENTED |
| 4 | 無料枠使用量確認（read） | Cloudflare ダッシュボード KV メトリクス参照 | 100,000 read/day に対する余力を記録 | DOCUMENTED |
| 5 | 無料枠使用量確認（write） | Cloudflare ダッシュボード KV メトリクス参照 | 1,000 write/day に対する余力を記録 | DOCUMENTED |
| 6 | 無料枠使用量確認（storage） | Cloudflare ダッシュボード KV メトリクス参照 | 1 GB に対する余力を記録 | DOCUMENTED |
| 7 | wrangler.toml TOML 構文確認 | `wrangler deploy --dry-run --env staging` | TOML パースエラーが出ない | DOCUMENTED |
| 8 | バインディング名衝突確認 | `grep -E "binding\\s*=" apps/api/wrangler.toml` | `SESSION_KV` が未使用 | DOCUMENTED |
| 9 | account ID 一致確認 | wrangler.toml の `account_id` と `wrangler whoami` の比較 | 一致する | DOCUMENTED |
| 10 | KV 操作 dry-run | `wrangler kv:namespace create ubm-hyogo-kv-staging --preview` の事前確認（実行はしない） | コマンド構文に誤りがない | DOCUMENTED |

### 実行前提条件

- wrangler CLI がインストール済みであること
- `wrangler login` が完了していること
- Phase 2 / Phase 3 の設計が確定していること
- `apps/api/wrangler.toml` が存在すること

### verify suite 失敗時の対応フロー

```
チェック失敗
  ├── チェック 1-2 失敗: wrangler 再インストール / 再ログイン
  ├── チェック 3 失敗: 既存 Namespace と命名衝突 → Phase 3 に差し戻し
  ├── チェック 4-6 失敗: 無料枠枯渇リスク → Phase 3 に差し戻し（用途縮退検討）
  ├── チェック 7-8 失敗: wrangler.toml 構文・命名修正 → Phase 2 に差し戻し
  ├── チェック 9 失敗: account 取り違え → 即停止し Phase 3 で再確認
  └── チェック 10 失敗: コマンド誤り → Phase 2 設計の再確認
```
