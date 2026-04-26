# Phase 5: セットアップ実行

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | D1 WAL mode 設定 (UT-02) |
| Phase 番号 | 5 / 6 |
| Phase 名称 | セットアップ実行 |
| 作成日 | 2026-04-26 |
| 前 Phase | 4 (事前検証手順) |
| 次 Phase | 6 (異常系検証) |
| 状態 | pending |

## 目的

`wrangler.toml` への D1 バインディング追記と `wrangler d1 execute` による WAL mode PRAGMA 実行を行い、AC-1〜AC-5 を達成する。実行手順を runbook に記録する。

## 実行タスク

- `apps/api/wrangler.toml` に D1 バインディングを追記する（コメント含む）
- staging D1 に対して `PRAGMA journal_mode=WAL` を実行する
- production D1 に対して `PRAGMA journal_mode=WAL` を実行する
- WAL mode 適用を確認する
- 実行手順を runbook として記録する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | D1 binding 設定例・wrangler コマンド |
| 必須 | docs/01-infrastructure-setup/ut-02-d1-wal-mode/phase-04.md | verify suite 結果・確認済みコマンド |
| 必須 | docs/01-infrastructure-setup/ut-02-d1-wal-mode/phase-02.md | 設計済みの wrangler.toml・手順 |
| 参考 | docs/01-infrastructure-setup/02-serial-monorepo-runtime-foundation/phase-05.md | 組み込み先 Phase（存在する場合） |

## 実行手順

### ステップ 1: wrangler.toml への D1 バインディング追記

`apps/api/wrangler.toml` の `[[d1_databases]]` セクションに以下を追記する。
WAL mode 設定根拠コメントを必ず含めること（AC-1 の要件）。

```toml
# D1 データベースバインディング
# WAL (Write-Ahead Logging) mode を使用することで、
# Sheets→D1 同期ジョブと API 読み取りの同時実行時における
# 読み書き競合（writer lock）を最小化する。
# PRAGMA journal_mode=WAL は wrangler d1 execute で設定する（下記 runbook 参照）。
[[d1_databases]]
binding = "DB"
database_name = "ubm-hyogo-db"
database_id = "<staging-d1-database-id>"  # staging

[env.production]
[[env.production.d1_databases]]
binding = "DB"
database_name = "ubm-hyogo-db"
database_id = "<production-d1-database-id>"  # production
```

### ステップ 2: staging D1 への WAL mode 設定

```bash
# staging D1 に WAL mode を設定
wrangler d1 execute ubm-hyogo-db \
  --env staging \
  --command "PRAGMA journal_mode=WAL;"

# 設定確認
wrangler d1 execute ubm-hyogo-db \
  --env staging \
  --command "PRAGMA journal_mode;"
# 期待結果: wal
```

### ステップ 3: production D1 への WAL mode 設定

```bash
# production D1 に WAL mode を設定
wrangler d1 execute ubm-hyogo-db \
  --env production \
  --command "PRAGMA journal_mode=WAL;"

# 設定確認
wrangler d1 execute ubm-hyogo-db \
  --env production \
  --command "PRAGMA journal_mode;"
# 期待結果: wal
```

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | verify suite の PASS を前提に実行 |
| Phase 6 | 本 Phase の実行結果を異常系検証の前提とする |

## 多角的チェック観点（AIが判断）

- 価値性: AC-1〜AC-5 が全て達成されているか
- 実現性: wrangler.toml の追記と PRAGMA 実行が実際に完了しているか
- 整合性: staging と production 両環境で WAL mode が適用されているか
- 運用性: runbook が次の担当者でも再現できる粒度で記録されているか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | wrangler.toml D1 バインディング追記 | 5 | pending | コメント含む・AC-1 |
| 2 | staging WAL mode 設定実行 | 5 | pending | PRAGMA + 確認・AC-2 |
| 3 | production WAL mode 設定実行 | 5 | pending | PRAGMA + 確認・AC-2 |
| 4 | runbook 記録 | 5 | pending | AC-3 |
| 5 | local 差異の文書化 | 5 | pending | AC-4 |
| 6 | 02-serial との AC 整合確認 | 5 | pending | AC-5 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/foundation-bootstrap-runbook-wal-section.md | runbook の WAL mode セクション |
| ドキュメント | outputs/phase-05/wal-mode-apply-result.md | WAL mode 適用確認結果 |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- wrangler.toml に D1 バインディングが追記されている（コメント含む）
- staging D1 で `PRAGMA journal_mode;` が `wal` を返す
- production D1 で `PRAGMA journal_mode;` が `wal` を返す
- runbook が outputs/phase-05/ に記録されている
- local との WAL 差異が文書化されている
- AC-1〜AC-5 が全て達成されている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- PRAGMA 実行結果（`wal` の確認）がスクリーンショットまたはログで記録されている
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 6 (異常系検証)
- 引き継ぎ事項: WAL mode 適用済みの staging / production D1 を異常系検証の対象として渡す
- ブロック条件: staging / production の両方で WAL mode が確認できていない場合は次 Phase に進まない

## runbook

### WAL mode 設定 runbook

**前提条件:**
- wrangler@3.x 以上がインストール済み
- `wrangler login` が完了している
- D1 インスタンス（ubm-hyogo-db）が作成済み

**実行手順:**

1. wrangler.toml に D1 バインディングと WAL mode 設定根拠コメントを追記する
2. staging 環境に WAL mode を設定する:
   ```bash
   wrangler d1 execute ubm-hyogo-db --env staging --command "PRAGMA journal_mode=WAL;"
   ```
3. staging の設定を確認する:
   ```bash
   wrangler d1 execute ubm-hyogo-db --env staging --command "PRAGMA journal_mode;"
   # → wal が返ることを確認
   ```
4. production 環境に WAL mode を設定する:
   ```bash
   wrangler d1 execute ubm-hyogo-db --env production --command "PRAGMA journal_mode=WAL;"
   ```
5. production の設定を確認する:
   ```bash
   wrangler d1 execute ubm-hyogo-db --env production --command "PRAGMA journal_mode;"
   # → wal が返ることを確認
   ```

**rollback 手順（WAL mode を無効化する場合）:**

```bash
# WAL mode を DELETE mode（デフォルト）に戻す
wrangler d1 execute ubm-hyogo-db --env staging --command "PRAGMA journal_mode=DELETE;"
wrangler d1 execute ubm-hyogo-db --env production --command "PRAGMA journal_mode=DELETE;"
```

### sanity check

| チェック | コマンド | 期待結果 |
| --- | --- | --- |
| staging WAL 確認 | `wrangler d1 execute ubm-hyogo-db --env staging --command "PRAGMA journal_mode;"` | `wal` |
| production WAL 確認 | `wrangler d1 execute ubm-hyogo-db --env production --command "PRAGMA journal_mode;"` | `wal` |
| wrangler.toml D1 binding 確認 | `grep -A5 "d1_databases" apps/api/wrangler.toml` | binding・database_name・database_id が含まれる |
| WAL 設定根拠コメント確認 | `grep -i "WAL" apps/api/wrangler.toml` | コメント行が含まれる |
