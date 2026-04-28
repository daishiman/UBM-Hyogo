# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 本番デプロイ実行 (UT-06) |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-04-27 |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | pending |

## 目的

OpenNext Workers（`apps/web`）/ API Workers（`apps/api`）/ D1 の本番初回デプロイに必要なスコープ、受入条件、依存関係、既存資産、実行前承認条件を固定する。
Phase 2 以降で topology やコマンドを発明しないよう、aiworkflow-requirements の Cloudflare 正本仕様と現行コードの命名規則を Phase 1 で確定する。

## 実行タスク

- タスク分類を implementation（本番環境への実デプロイ）として記録する
- AC-1〜AC-8 を index.md と照合し、Phase 別の証跡責務を割り当てる
- 既存コードの命名規則（workspace 名、wrangler env、Cloudflare resource name）を確認する
- carry-over 確認として `git log --oneline -5` と完了済み上流タスクとの差分を記録する
- targeted run 方針を列挙し、全件 `pnpm test` が重い場合の代替コマンドを決める
- 正本仕様 `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` と deployment-core.md を照合する
- 本番実行承認を Phase 4 の `production-approval.md` に前置きする方針を固定する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/index.md | タスク概要・AC・依存関係の正本 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | OpenNext Workers / API Workers / D1 の正本仕様 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-core.md | go-live / rollback 方針 |
| 必須 | docs/30-workflows/completed-tasks/03-serial-data-source-and-storage-contract/index.md | D1 runbook（マイグレーション適用手順） |
| 必須 | docs/30-workflows/01-infrastructure-setup/04-serial-cicd-secrets-and-environment-sync/index.md | Secrets / 環境変数の前提 |
| 必須 | docs/30-workflows/01-infrastructure-setup/05b-parallel-smoke-readiness-and-handoff/index.md | readiness checklist |

## 実行手順

### ステップ 1: タスク分類とスコープ固定

- taskType を `implementation` とし、docs-only / spec_created ではないことを明記する
- 本番書き込みを伴う操作（D1 migration、Workers deploy）を不可逆リスクとして分類する
- UT-06 は Wave 1 の infra first deploy に限定し、09c production release とは役割を分離する

### ステップ 2: AC と証跡責務の割り当て

| AC | 証跡責務 | 主 Phase |
| --- | --- | --- |
| AC-1 | Web URL 200 OK | Phase 5 / 11 |
| AC-2 | API Workers `/health` healthy | Phase 5 / 11 |
| AC-3 | D1 migrations list 履歴 | Phase 5 |
| AC-4 | Workers から D1 SELECT | Phase 5 / 11 |
| AC-5 | smoke test 全件 PASS | Phase 11 |
| AC-6 | deploy-execution-log | Phase 5 |
| AC-7 | D1 export backup evidence | Phase 5 |
| AC-8 | rollback-runbook / abnormal-case-matrix | Phase 2 / 6 |

### ステップ 3: 既存資産インベントリ

- `apps/web/wrangler.toml`、`apps/api/wrangler.toml`、D1 migrations、`.mise.toml`、package scripts を確認する
- Cloudflare resource name は kebab-case、wrangler env は `production`、workspace filter は repo の package name に合わせる
- `git log --oneline -5` で上流完了タスクと今タスクの新規作業を分離する

### ステップ 4: targeted run 方針

| 対象 | コマンド | 目的 |
| --- | --- | --- |
| web build | `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` | OpenNext adapter 出力確認 |
| api build | `mise exec -- pnpm --filter @ubm-hyogo/api build` | API Workers build 確認 |
| typecheck | `mise exec -- pnpm typecheck` | 型整合 |
| wrangler | `bash scripts/cf.sh --version` / `wrangler whoami` | CLI とアカウント確認 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | AC、既存資産、正本仕様照合結果を設計入力にする |
| Phase 4 | targeted run 方針を verify suite に展開する |
| Phase 5 | 本番実行前承認と D1 backup 前置きの根拠にする |
| Phase 7 | AC matrix の正本として使う |

## 多角的チェック観点（AIが判断）

- 価値性: Wave 1 infra first deploy が後続 UT-08 / UT-09 を解放するか
- 実現性: 初回スコープが手動で監査可能な厚みに収まっているか
- 整合性: OpenNext Workers 正本仕様と Phase 2 以降の topology が矛盾しないか
- 運用性: 承認、backup、rollback、smoke evidence が同一 release transaction として追跡できるか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | taskType / scope 固定 | 1 | pending | implementation |
| 2 | AC 証跡責務割当 | 1 | pending | Phase 7 に連携 |
| 3 | 正本仕様照合 | 1 | pending | deployment-cloudflare.md |
| 4 | 既存資産インベントリ | 1 | pending | apps/web / apps/api / D1 |
| 5 | targeted run 方針 | 1 | pending | Phase 4 に連携 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/requirements-summary.md | スコープ、AC、依存関係、承認方針 |
| ドキュメント | outputs/phase-01/existing-assets-inventory.md | wrangler / package scripts / migrations 棚卸し |
| ドキュメント | outputs/phase-01/spec-extraction-map.md | aiworkflow-requirements 正本との対応 |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- [ ] タスク分類が implementation として記録されている
- [ ] AC-1〜AC-8 の証跡責務が Phase 別に割り当てられている
- [ ] OpenNext Workers / API Workers / D1 topology が正本仕様と照合されている
- [ ] 既存資産インベントリと命名規則が記録されている
- [ ] carry-over 差分と targeted run 方針が記録されている
- [ ] Phase 4 の `production-approval.md` を本番実行前ゲートにする方針が明記されている

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] 次 Phase への引き継ぎ事項を記述
- [ ] artifacts.json の該当 phase を completed に更新

## 次Phase

- 次: 2 (設計)
- 引き継ぎ事項: AC 証跡責務、OpenNext Workers topology、既存資産インベントリ、targeted run 方針を Phase 2 に渡す
- ブロック条件: 正本仕様と topology の矛盾が未解決の場合は Phase 2 に進まない
