# Phase 12 outputs / documentation-changelog — ドキュメント更新履歴

## 概要

Phase 1〜13 の仕様書整備に伴うドキュメント変更履歴を Step 1-A / 1-B / 1-C / Step 2 別に個別記録する。実 secret 配置に伴う追加変更は Phase 13 ユーザー承認後の別オペレーションで追加記録する。

## 変更履歴

| 日付 | 変更種別 | 対象ファイル | 変更概要 |
| --- | --- | --- | --- |
| 2026-04-29 | 新規 | `docs/30-workflows/ut-27-github-secrets-variables-deployment/index.md` | ワークフロー index（AC-1〜AC-15 / Phase 一覧 / 依存関係 / Secret 一覧 / Variable 一覧） |
| 2026-04-29 | 新規 | `docs/30-workflows/ut-27-github-secrets-variables-deployment/artifacts.json` | Phase 1〜13 機械可読サマリー |
| 2026-04-29 | 新規 | `docs/30-workflows/ut-27-github-secrets-variables-deployment/phase-{01..13}.md` | Phase 1〜13 仕様書 |
| 2026-04-29 | 新規 | `docs/30-workflows/ut-27-github-secrets-variables-deployment/outputs/artifacts.json` | root `artifacts.json` と同期した validator 用コピー |
| 2026-04-29 | 新規 | `docs/30-workflows/ut-27-github-secrets-variables-deployment/outputs/phase-{01..10}/main.md` | Phase 1〜10 outputs |
| 2026-04-29 | 新規 | `docs/30-workflows/ut-27-github-secrets-variables-deployment/outputs/phase-11/{main,manual-smoke-log,manual-test-result,link-checklist}.md` | NON_VISUAL Phase 11 必須 4 成果物 |
| 2026-04-29 | 新規 | `docs/30-workflows/ut-27-github-secrets-variables-deployment/outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md` | Phase 12 必須 6+1 成果物 |
| 2026-04-29 | 新規 | `docs/30-workflows/ut-27-github-secrets-variables-deployment/outputs/phase-13/{main,apply-runbook,op-sync-runbook,verification-log}.md` | Phase 13 PR 手順 + 実 secret 配置 runbook + 実走時追記先の予約成果物（NOT EXECUTED） |
| 2026-04-29 | 同期（Step 1-A） | `docs/30-workflows/LOGS.md` | UT-27 spec_created 行追加 |
| 2026-04-29 | 判定（Step 1-A） | `.claude/skills/task-specification-creator/LOGS.md` | 実ファイルなし。`system-spec-update-summary.md` と同じく対象外（パス補正）として記録し、skill feedback 側に改善候補を残す |
| 2026-04-29 | 同期（Step 1-A） | `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | deployment-gha / deployment-secrets-management / environment-variables の UT-27 反映見出し index 再生成 |
| 2026-04-29 | 判定（Step 1-A） | `CLAUDE.md`「シークレット管理」章 | 追記不要。CLAUDE.md は一次正本（ローカル `.env` / CLI ルール）を保持し、UT-27 固有の GitHub 派生コピー運用は aiworkflow-requirements 3 正本へ集約 |
| 2026-04-29 | 同期（Step 1-B） | `docs/30-workflows/LOGS.md` | UT-27 行 spec_created（Phase 1〜3 = completed / Phase 4〜13 = pending） |
| 2026-04-29 | 予約（Step 1-C） | `docs/30-workflows/unassigned-task/UT-{05,28}-*.md` / `01b-*.md` | UT-27 への双方向リンク追加は Phase 13 PR 前確認に予約。今回差分には含めない |
| 2026-04-29 | 予約（Step 1-C） | `docs/30-workflows/unassigned-task/UT-06-*` / `UT-29-cd-post-deploy-smoke-healthcheck.md` / `UT-25-*` | 下流・関連タスクへのリンク追加は Phase 13 PR 前確認に予約。今回差分には含めない |
| 2026-04-29 | 同期（Step 2） | `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` | UT-27 の Secret/Variable 配置決定マトリクスを追記 |
| 2026-04-29 | 同期（Step 2） | `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | UT-27 の 1Password 一時環境変数 + unset パターン / 同名併存禁止 / API Token 最小スコープを追記 |
| 2026-04-29 | 同期（Step 2） | `.claude/skills/aiworkflow-requirements/references/environment-variables.md` | UT-27 の 1Password 正本 + Last-Updated メモ運用を追記 |
| 2026-04-29 | 追記方針 | `docs/30-workflows/ut-27-github-secrets-variables-deployment/outputs/phase-12/unassigned-task-detection.md` | 同期手順の追加改善候補は本成果物内に集約。実在しない `doc/01-infrastructure-setup/...` には記録しない |

## Phase 13 ユーザー承認後の追加変更（NOT EXECUTED）

| 種別 | 対象ファイル | 内容 | タイミング |
| --- | --- | --- | --- |
| 更新 | `outputs/phase-13/op-sync-runbook.md` | 既存予約成果物へ 1Password ↔ GitHub 同期実走ログを追記 | user 実 secret 配置承認後 |
| 更新 | `outputs/phase-13/verification-log.md` | 既存予約成果物へ dev push smoke 実走ログ（commit SHA / run URL / 通知到達）を追記 | user 実 dev push 承認後 |
| 更新 | `artifacts.json` | Phase 13 を `completed` に更新 | 実走完了後 |

## 注意事項

- secret / token / Webhook URL の**実値は本 changelog に一切記載しない**。
- 実値の更新履歴は 1Password Item Notes の Last-Updated メモで管理する。
