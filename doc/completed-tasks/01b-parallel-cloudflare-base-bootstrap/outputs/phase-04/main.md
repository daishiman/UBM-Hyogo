# Phase 4 成果物: 事前検証手順（Pre-verification Checklist）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 4 / 13 |
| 名称 | 事前検証手順 |
| 状態 | completed |
| 作成日 | 2026-04-23 |

## 1. 入力確認

Phase 3 の GO 判定:
- 4条件すべて PASS
- MINOR M-01（develop→dev 統一）は Phase 12 行き
- Phase 4 即時着手可能

確定済み設計:
- Pages: `ubm-hyogo-web` / `ubm-hyogo-web-staging`
- Workers: `ubm-hyogo-api` / `ubm-hyogo-api-staging`
- D1: `ubm-hyogo-db-prod` / `ubm-hyogo-db-staging`
- ブランチ: `dev`→staging、`main`→production
- API Token: Pages:Edit + Workers:Edit + D1:Edit（最小権限）

## 2. Pre-verification Checklist

### 2-1. wrangler CLI 環境確認

| チェック項目 | 確認コマンド | 期待結果 | 状態 |
| --- | --- | --- | --- |
| wrangler インストール | `wrangler --version` | v3.x 以上 | docs-only: 手順として記録 |
| Cloudflare ログイン | `wrangler whoami` | ユーザー名とアカウントIDが表示される | docs-only: 手順として記録 |
| Account ID 取得 | `wrangler whoami` の出力から記録 | Account ID が確認できる | docs-only: 手順として記録 |

### 2-2. 既存リソース名の競合確認

| チェック項目 | 確認コマンド | 期待結果 | 状態 |
| --- | --- | --- | --- |
| Pages プロジェクト一覧 | `wrangler pages list` | `ubm-hyogo-web` が存在しないこと（初回は存在しない） | docs-only: 手順として記録 |
| Workers 一覧 | `wrangler whoami` + Dashboard 確認 | `ubm-hyogo-api` が存在しないこと | docs-only: 手順として記録 |
| D1 データベース一覧 | `wrangler d1 list` | `ubm-hyogo-db-prod` / `ubm-hyogo-db-staging` が存在しないこと | docs-only: 手順として記録 |

### 2-3. wrangler.toml 検証

| チェック項目 | 確認コマンド | 期待結果 | 状態 |
| --- | --- | --- | --- |
| Workers dry-run | `wrangler deploy --dry-run --config apps/api/wrangler.toml` | エラーなし | docs-only: 手順として記録 |
| staging dry-run | `wrangler deploy --env staging --dry-run --config apps/api/wrangler.toml` | デプロイ先が `ubm-hyogo-api-staging` と表示される | docs-only: 手順として記録 |

### 2-4. 正本仕様参照確認

| チェック項目 | 確認コマンド | 期待結果 | 状態 |
| --- | --- | --- | --- |
| deployment-cloudflare.md | `ls .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | ファイルが存在する | OK |
| deployment-core.md | `ls .claude/skills/aiworkflow-requirements/references/deployment-core.md` | ファイルが存在する | OK |
| deployment-secrets-management.md | `ls .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | ファイルが存在する | OK |
| architecture-overview-core.md | `ls .claude/skills/aiworkflow-requirements/references/architecture-overview-core.md` | ファイルが存在する | OK |
| deployment-branch-strategy.md | `ls .claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md` | ファイルが存在する | OK |

### 2-5. branch drift 確認

| チェック項目 | 確認コマンド | 期待結果 | 状態 |
| --- | --- | --- | --- |
| `develop` 表記の残存確認 | `rg "develop" doc/01b-parallel-cloudflare-base-bootstrap` | Phase 12 M-01 として記録済み | 記録済み |
| `dev` が正本ブランチ | `rg "dev" .claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md` | `dev` が staging に対応している | OK |

## 3. 期待出力表

| 検証 | PASS 条件 | FAIL 時の対処 |
| --- | --- | --- |
| wrangler login | Account ID が取得できる | `wrangler login` を再実行 |
| Pages 存在確認 | 初回はなし（Phase 5 で作成する） | 既存の場合は名前競合を確認 |
| Workers dry-run | エラーゼロ | wrangler.toml の `name` フィールドを確認 |
| D1 存在確認 | 初回はなし（Phase 5 で作成する） | 既存の場合はIDを記録 |
| 正本仕様参照 | 5参照ファイルが存在する | `.claude/skills/aiworkflow-requirements/references/` を確認 |

## 4. 4条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | セットアップ前の環境確認により Phase 5 の手戻りリスクを排除 |
| 実現性 | PASS | 全確認コマンドが wrangler CLI 無料機能で実行可能 |
| 整合性 | PASS | 確定済み設計のリソース名と一致している |
| 運用性 | PASS | FAIL 時の対処手順が明記されている |

## 5. downstream handoff

Phase 5 では本 Phase の pre-verification checklist を前提として以下を実行する:
- wrangler 環境・Account ID・スコープが問題ないことを確認してから手順実行
- D1 作成時は `wrangler d1 create` で出力される database_id を記録する

## 完了条件チェック

- [x] 主成果物が作成済み
- [x] 正本仕様参照が残っている（5ファイル存在確認済み）
- [x] downstream handoff が明記されている
- [x] pre-verification checklist が記述済み
