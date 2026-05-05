# Phase 12 Task 12-2: System Spec Update Summary

## 更新対象 specs（明示）

| spec | 役割 | 本タスクでの扱い |
| --- | --- | --- |
| `docs/00-getting-started-manual/specs/01-api-schema.md` | Forms schema / `responseId` / `publicConsent` / `rulesConsent` の正本 | 直接書き換えない。本タスク → spec への参照リンクの整合性確認のみ |
| `docs/00-getting-started-manual/specs/03-data-fetching.md` | sync_jobs / cursor pagination / current response / consent snapshot 契約 | 直接書き換えない。同上 |
| `docs/00-getting-started-manual/specs/08-free-database.md` | D1 / WAL 非対応 / PRAGMA 制約 / free-tier baseline | 直接書き換えない。同上 |

本タスクは docs-only であり、specs を直接書き換えない。本タスク仕様書 → specs 参照リンクの整合性確認と、specs 側に legacy umbrella close-out への参照行を追記すべきか否かの判定対象として上記 3 ファイルを明示する。

## Step 1-A: タスク完了記録

| 項目 | 内容 |
| --- | --- |
| 完了タスク登録 | `task-sync-forms-d1-legacy-umbrella-001` を `spec_created` ステータスで完了タスクセクションに追加（実装ではなく仕様確定の意） |
| LOGS 反映 | `aiworkflow-requirements/LOGS/20260430-task-sync-forms-d1-legacy-umbrella.md` に legacy umbrella close-out / current facts / follow-up 分離を記録 |
| topic-map.md | generated artifact のため手編集せず、`generate-index.js` 再生成で artifact inventory / lessons / legacy register を索引化する |

## Step 1-B: 実装状況テーブル更新

| キー | 値 |
| --- | --- |
| status | `spec_created`（`completed` ではない） |
| 理由 | 旧 UT-09 を direct 実装ではなく legacy umbrella として閉じる方針確定であり、実装は 03a / 03b / 04c / 09b / 02c の責務 |

## Step 1-C: 関連タスクテーブル更新

| 受け手タスク | 追記内容 |
| --- | --- |
| 03a-parallel-forms-schema-sync-and-stablekey-alias-queue | `関連タスク` 表に `task-sync-forms-d1-legacy-umbrella-001` を upstream / legacy-umbrella として追記 |
| 03b-parallel-forms-response-sync-and-current-response-resolver | 同上 |
| 04c-parallel-admin-backoffice-api-endpoints | 同上 |
| 09b-parallel-cron-triggers-monitoring-and-release-runbook | 同上 |
| 02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary | 同上 |

> 上記の追記は今回のレビュー時点で未反映。埋もれやすい逆リンクであり、`docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-followup-cleanup-001.md` に明示的な follow-up として登録する。

## Step 2（条件付き）: aiworkflow-requirements references スキャン

```bash
rg -n "Google Sheets API|spreadsheets\.values\.get|sync_audit" \
  .claude/skills/aiworkflow-requirements/references
```

| ケース | 対応 |
| --- | --- |
| hit がある | `outputs/phase-12/system-spec-update-summary.md` に「対象 file / 該当行 / 更新指示（Forms API へ書き換え or stale 明記）」を表で列挙 |
| hit が 0 | N/A として記録 |

**実測結果**: hit あり。0 hit 想定は誤りだったため撤回し、以下に分類する。

| 対象 file | 該当内容 | 分類 | 更新指示 |
| --- | --- | --- | --- |
| `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | 単一 `POST /admin/sync` と Google Sheets 由来同期ジョブ | current drift | `POST /admin/sync/schema` / `POST /admin/sync/responses` の current canonical と矛盾しないよう stale 明記または削除 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow.md` | `sync_audit` を current facts として固定した履歴行 | historical/current drift 混在 | 03-serial 当時の履歴であることを明示し、現行は `sync_jobs` と注記 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-backlog.md` | `sync_audit` backlog 2 件 | backlog drift | 閉じる / supersede / `sync_jobs` へ読み替えのいずれかを判定 |
| `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | Google Sheets API v4 / `SHEETS_SPREADSHEET_ID` / `GOOGLE_SERVICE_ACCOUNT_JSON` | stale runtime guidance | Forms API 用 secrets（`GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY` / `GOOGLE_FORM_ID`）との関係を整理 |
| `.claude/skills/aiworkflow-requirements/references/environment-variables.md` | Sheets 実装ファイル名、単一 `/admin/sync` | current drift | sync endpoint と secret 説明を Forms API / split endpoint へ更新 |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | Google Sheets API 用 Service Account JSON | stale secret guidance | 旧 secret と現行 Forms API secret の扱いを分類 |
| `lessons-learned-*` | `/admin/sync/responses` や `/admin/sync*` の歴史的知見 | historical allowed | 現行仕様と矛盾しないものは履歴として維持 |

上記は複数の正本仕様にまたがるため、このタスク内で即時全置換しない。`task-sync-forms-d1-legacy-followup-cleanup-001` で current / historical / superseded を分類してから更新する。

## current facts（読み替え一覧）

- Google Sheets API 前提は **stale**。Forms API（`forms.get` / `forms.responses.list`）が **current**
- 単一 `/admin/sync` は **stale**。`/admin/sync/schema` / `/admin/sync/responses` が **current**
- `sync_audit` は **stale**。`sync_jobs` が **current**
- `dev / main 環境` 単独表記は **stale**。`dev branch -> staging env` / `main branch -> production env` が **current**
- `PRAGMA journal_mode=WAL` 前提は **stale**。`SQLITE_BUSY` retry/backoff + 短い transaction + batch-size 制限が **current**

## runtime / 実装影響

| 項目 | 状態 |
| --- | --- |
| runtime code 変更 | なし |
| D1 schema 変更 | なし |
| 新規実装タスクの起票 | あり（仕様掃除 / 逆リンク / skill 改善の follow-up。runtime code ではない） |
| Cloudflare Secrets 追加 | なし |

## 次 Phase

documentation-changelog.md（Task 12-3）と unassigned-task-detection.md（Task 12-4）に本サマリの内容を反映する。
