# documentation-changelog — UT-25 ワークフローで更新したドキュメント変更履歴

## 凡例

| 状態 | 意味 |
| --- | --- |
| created | 本ワークフローで新規作成 |
| updated | 本ワークフローで既存ファイルを更新 |
| not_changed | 本ワークフロー外で変更（参照のみ） |

## ワークフロー本体（`docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/`）

| パス | 状態 | 概要 | 担当 Phase |
| --- | --- | --- | --- |
| index.md | created | タスク仕様書 index（メタ情報 / AC-1〜AC-11 / Phase 一覧 / Secrets 一覧 / 苦戦箇所） | Phase 1 |
| artifacts.json | created | Phase 1〜13 機械可読サマリー（status / outputs / depends_on / user_approval_required） | Phase 1 |
| phase-01.md | created | 要件定義（真の論点 / 4 条件 PASS / AC マトリクス前駆） | Phase 1 |
| phase-02.md | created | 設計（投入経路 / staging-first / rollback / wrangler.toml env 切替） | Phase 2 |
| phase-03.md | created | 設計レビュー（代替案 A〜E / MINOR UT25-M-01,02 / NO-GO 条件 / Phase 13 blocked 条件） | Phase 3 |
| phase-04.md | created | テスト戦略 | Phase 4 |
| phase-05.md | created | 実装ランブック（投入手順スクリプト化） | Phase 5 |
| phase-06.md | created | 異常系検証（`--env` 漏れ事故 / `private_key` 改行破壊） | Phase 6 |
| phase-07.md | created | AC マトリクス（AC-1〜AC-11） | Phase 7 |
| phase-08.md | created | DRY 化 | Phase 8 |
| phase-09.md | created | 品質保証 | Phase 9 |
| phase-10.md | created | 最終レビュー | Phase 10 |
| phase-11.md | created | 手動 smoke test（staging 投入リハーサル） | Phase 11 |
| phase-12.md | created | ドキュメント更新（本ファイル群を生成） | Phase 12 |
| phase-13.md | created | PR 作成 / ユーザー承認後 secret 投入 | Phase 13 |

## outputs（`docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/outputs/`）

| パス | 状態 | 概要 | 担当 Phase |
| --- | --- | --- | --- |
| phase-01/main.md | created | Phase 1 成果物 | Phase 1 |
| phase-02/main.md | created | Phase 2 成果物 | Phase 2 |
| phase-03/main.md | created | Phase 3 成果物 | Phase 3 |
| phase-04/main.md | created | Phase 4 成果物 | Phase 4 |
| phase-05/main.md | created | Phase 5 成果物 | Phase 5 |
| phase-06/main.md | created | Phase 6 成果物 | Phase 6 |
| phase-07/main.md | created | Phase 7 成果物 | Phase 7 |
| phase-08/main.md | created | Phase 8 成果物 | Phase 8 |
| phase-09/main.md | created | Phase 9 成果物 | Phase 9 |
| phase-10/main.md | created | Phase 10 成果物 | Phase 10 |
| phase-11/main.md | created | Phase 11 walkthrough トップ index | Phase 11 |
| phase-11/manual-smoke-log.md | created | staging 投入リハーサル実行ログ | Phase 11 |
| phase-11/link-checklist.md | created | ワークフロー内リンク健全性チェック | Phase 11 |
| phase-12/main.md | created | Phase 12 トップ index（読み順 / トレーサビリティ） | Phase 12 |
| phase-12/implementation-guide.md | created | UT-26 担当者向け実装ガイド（中学生レベル概念説明 + コマンド系列） | Phase 12 |
| phase-12/system-spec-update-summary.md | updated | aiworkflow-requirements 正本反映結果 | Phase 12 review |
| phase-12/documentation-changelog.md | created | 本ファイル | Phase 12 |
| phase-12/unassigned-task-detection.md | created | 派生未アサインタスク検出 | Phase 12 |
| phase-12/skill-feedback-report.md | created | task-specification-creator skill フィードバック | Phase 12 |
| phase-12/phase12-task-spec-compliance-check.md | created | 本ワークフロー全体の skill 適合チェック | Phase 12 |
| phase-13/main.md | created | Phase 13 トップ index（ユーザー承認チェックリスト / 実投入境界） | Phase 13 |
| phase-13/deploy-runbook.md | created | staging→production 実投入手順書 | Phase 13 |
| phase-13/rollback-runbook.md | created | rollback 手順書（delete + 再 put） | Phase 13 |
| phase-13/secret-list-evidence-staging.txt | created | staging 投入 evidence プレースホルダ（実投入後にユーザーが置換） | Phase 13 |
| phase-13/secret-list-evidence-production.txt | created | production 投入 evidence プレースホルダ（実投入後にユーザーが置換） | Phase 13 |

## ワークフロー外（参照のみ・本 Phase で更新しない）

| パス | 状態 | 反映予定 |
| --- | --- | --- |
| .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | updated | `GOOGLE_SERVICE_ACCOUNT_JSON` / `scripts/cf.sh` 投入ルール / legacy alias 境界を反映 |
| .claude/skills/aiworkflow-requirements/references/environment-variables.md | updated | canonical secret / legacy alias / `scripts/cf.sh` secret コマンドを反映 |
| .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | updated | Sheets API v4 secret 境界と `GOOGLE_SERVICE_ACCOUNT_JSON` 正本名を反映 |
| apps/api/src/jobs/sheets-fetcher.ts | referenced | Service Account JSON を消費する実装 |
| apps/api/src/jobs/sync-sheets-to-d1.ts | updated | `GOOGLE_SERVICE_ACCOUNT_JSON` を canonical とし、`GOOGLE_SHEETS_SA_JSON` legacy alias を移行期間だけ許容 |
| apps/api/wrangler.toml | not_changed | 01b で staging / production env 宣言済 |
| scripts/cf.sh | not_changed | 既存ラッパー実装 |
| CLAUDE.md | not_changed | 既存ルール（wrangler 直接禁止 / op 経由注入）に整合 |

## 派生作業（Phase 13 完了後の別オペレーション）

| 作業 | 担当 | 期日 |
| --- | --- | --- |
| Phase 13 deploy-runbook 実走（staging→production） | ユーザー | Phase 13 PR マージ後 |
| `secret-list-evidence-{staging,production}.txt` のプレースホルダ置換 | ユーザー | 実走完了直後 |
| aiworkflow-requirements index 再生成 | 本レビュー修正の検証 | Phase 12 review 後 |
| `unassigned-task-detection.md` 派生タスクの issue 化 | プロダクトマネジメント | Phase 13 完了後 |
| UT-26（Sheets API E2E 疎通）着手 | UT-26 担当 | Phase 13 完了後 |
