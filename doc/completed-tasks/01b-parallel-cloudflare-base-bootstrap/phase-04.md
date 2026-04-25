# Phase 4: 事前検証手順

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | cloudflare-base-bootstrap |
| Phase 番号 | 4 / 13 |
| Phase 名称 | 事前検証手順 |
| 作成日 | 2026-04-23 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (セットアップ実行) |
| 状態 | pending |

## 目的

Cloudflare 基盤ブートストラップ における Phase 4 の判断と成果物を固定し、下流 Phase の手戻りを防ぐ。
Phase 5（セットアップ実行）に進む前に、wrangler CLI 環境・Account ID・API トークンスコープが正常であることを確認し、リソース名の競合や設定の不整合を事前に排除する。

## 実行タスク

- input / output を確定する
- 正本仕様との整合を確認する
- 4条件と downstream 影響を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Cloudflare セットアップ |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-core.md | Pages / Workers / D1 役割 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | token placement |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-overview-core.md | web/api split |
| 参考 | Cloudflare Dashboard / Wrangler CLI | 初回セットアップ |

## 実行手順

### ステップ 1: input と前提の確認

- Phase 1-3 の設計書（index.md 含む）を読み込み、確定済み設計を把握する。
- 正本仕様との差分を先に洗い出す。
- 確定済み設計の確認事項:
  - Pages: `ubm-hyogo-web`（production） / `ubm-hyogo-web-staging`（staging）
  - Workers: `ubm-hyogo-api`（production） / `ubm-hyogo-api-staging`（staging）
  - D1: `ubm-hyogo-db-prod` / `ubm-hyogo-db-staging`
  - ブランチ: `dev` → staging、`main` → production
  - APIトークン: Pages:Edit + Workers:Edit + D1:Edit（最小権限）

### ステップ 2: Phase 成果物の作成

- 本 Phase の主成果物を `outputs/phase-04/main.md` に作成・更新する。
- pre-verification checklist として、以下の検証結果を記録する:
  - wrangler CLI バージョンと認証状態
  - Account ID 取得確認
  - 既存リソース名の競合有無
  - D1 データベースの事前存在確認
- downstream task から参照される path を具体化する。

### ステップ 3: 4条件と handoff の確認

- 価値性 / 実現性 / 整合性 / 運用性を再確認する。
- 次 Phase に渡す blocker と open question を記録する。
- wrangler 環境・Account ID・スコープが問題ないことを確認してから Phase 5 へ進む。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | 本 Phase の出力を入力として使用 |
| Phase 7 | AC トレースに使用 |
| Phase 10 | gate 判定の根拠 |
| Phase 12 | close-out と spec sync 判断 |

## 多角的チェック観点（AIが判断）

- 価値性: 誰のどのコストを下げるか明確か。
- 実現性: 初回無料運用スコープで成立するか。
- 整合性: branch / env / runtime / data / secret が一致するか。
- 運用性: rollback / handoff / same-wave sync が可能か。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | input 確認 | 4 | pending | Phase 1-3 設計書と index.md の読み込み完了 |
| 2 | 成果物更新 | 4 | pending | outputs/phase-04/main.md（pre-verification checklist） |
| 3 | 4条件確認 | 4 | pending | wrangler 環境・Account ID・スコープが問題ないことを確認してから Phase 5 へ |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/main.md | Phase 4 の主成果物（pre-verification checklist） |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- 主成果物が作成済み
- 正本仕様参照が残っている
- downstream handoff が明記されている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（権限・無料枠・drift）も検証済み
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 5 (セットアップ実行)
- 引き継ぎ事項: Cloudflare 基盤ブートストラップ の判断を次 Phase で再利用する。
- ブロック条件: 本 Phase の主成果物が未作成なら次 Phase に進まない。

## 検証コマンド一覧

| コマンド | 目的 | 期待結果 |
| --- | --- | --- |
| `wrangler whoami` | Cloudflareログイン確認 | ユーザー名とアカウントIDが表示される |
| `wrangler pages list` | Pages プロジェクト一覧確認 | `ubm-hyogo-web` が存在するか確認（初回は存在しない） |
| `wrangler deploy --dry-run --config apps/api/wrangler.toml` | Workers デプロイ可否確認 | エラーなし |
| `wrangler d1 list` | D1 データベース一覧確認 | `ubm-hyogo-db-prod`/`ubm-hyogo-db-staging` が存在するか確認 |
| `rg -n "dev\|main\|D1\|Sheets\|1Password" doc/01b-parallel-cloudflare-base-bootstrap` | 主要語の横断確認 | 必要箇所が見つかる |
| `node .claude/skills/aiworkflow-requirements/scripts/search-spec.js "Cloudflare" -C 2` | 正本仕様検索 | 必要 reference が出る |

## 期待出力表

| 検証 | PASS 条件 | FAIL 時の対処 |
| --- | --- | --- |
| wrangler login | Account ID が取得できる | `wrangler login` を再実行 |
| Pages 存在確認 | 初回はなし（Phase 5 で作成する） | 既存の場合は名前競合を確認 |
| Workers dry-run | エラーゼロ | wrangler.toml の `name` フィールドを確認 |
| D1 存在確認 | 初回はなし（Phase 5 で作成する） | 既存の場合はIDを記録 |
| 正本仕様参照 | 4 参照ファイルが存在する | skill の references/ を確認 |

## verify suite (手動 or 自動)

- 手動: README と index / phase の整合確認
- 手動: source-of-truth と branch/env の説明確認
- 自動: wrangler whoami / wrangler pages list / wrangler d1 list で環境を確認
- 自動: rg / search-spec / git diff で最低限を確認
