# Phase 12: ドキュメント更新履歴

## 2026-04-29 — UT-03 タスク仕様書を初版作成

| 種別 | 内容 |
| --- | --- |
| 新規 | `docs/30-workflows/ut-03-sheets-api-auth-setup/` ディレクトリ一式（Phase 1-13 仕様書 + outputs + index.md + artifacts.json） |
| 連動 | `docs/30-workflows/unassigned-task/UT-03-sheets-api-auth-setup.md` を原典として参照（変更なし） |
| 修正 | Phase 12 `main.md` を追加し、artifacts.json と compliance check を 7 必須成果物に同期 |
| 修正 | Phase 11 NON_VISUAL outputs を必須 3 点（main / manual-smoke-log / link-checklist）へ縮約 |
| 修正 | `GOOGLE_SERVICE_ACCOUNT_JSON` と既存 Forms secret 契約の併存方針を明記 |
| 状態 | workflow_state = `completed`（Sheets auth 実装込み）|
| GitHub Issue | #52（CLOSED のままタスク仕様書を作成） |

## 2026-04-29 反映済み（aiworkflow-requirements 正本更新）

| 種別 | 内容 |
| --- | --- |
| 反映 | `.claude/skills/aiworkflow-requirements/references/architecture-monorepo.md` に `packages/integrations/google/src/sheets/` 実装済み契約を追記 |
| 反映 | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` に Sheets sync 用 `GOOGLE_SERVICE_ACCOUNT_JSON` と Forms sync の併存方針を追記 |
| 反映 | `.claude/skills/aiworkflow-requirements/references/environment-variables.md` に `GOOGLE_SERVICE_ACCOUNT_JSON` / `SHEETS_SCOPES` / `SHEETS_SPREADSHEET_ID` を Sheets 認証契約として追記 |
| 反映 | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` に UT-03 ステータスブロックを `completed` として追記 |
| 反映 | `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` に Sheets auth 関連トピックを追加 |

## 反映予定（並行作業中・別エージェント）

- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` の Sheets auth セクション追加
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` の `GOOGLE_SERVICE_ACCOUNT_JSON` 参照追記
- `.claude/skills/aiworkflow-requirements/indexes/keywords.json` への Sheets / service-account / spreadsheet キーワード追加
- `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js` 実行（最終整合確認）
- CLAUDE.md は変更なし（既存ルールで被覆）

## 関連 PR

- 仕様書 PR: feat/issue-52-ut-03-sheets-api-auth-task-spec → main（Phase 13 で作成）
- 実装 PR: 別途未来のブランチで（本タスクは仕様書のみ）
