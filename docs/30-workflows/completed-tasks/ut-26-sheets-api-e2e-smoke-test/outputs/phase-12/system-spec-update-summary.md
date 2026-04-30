# System Spec Update Summary (UT-26)

## Step 1-A: 完了記録

UT-26 は `implemented`（live 実行 pending）。Issue #41 は CLOSED のまま。PR 側から「Re-link to closed issue #41」として参照する。

## Step 1-B: 実装状態

- vitest 10 ケース全 pass（リポジトリ全体 242 件 pass）
- 本番動作は変更なし（smoke route は `ENVIRONMENT === "production"` で 404）
- staging への deploy + live 疎通実行は credentials 配置完了後に実施

## Step 1-C: 関連タスクへの影響

| タスク | 役割 | 本タスクの影響 |
| --- | --- | --- |
| UT-03 | Sheets auth integration owner | 変更なし。`apps/api/src/jobs/sheets-fetcher.ts` を再利用 |
| UT-25 | Secret 配置 owner | 変更なし。env 名は既存 `GOOGLE_SHEETS_SA_JSON` |
| UT-09 | Sheets→D1 同期 consumer | 本タスク live 実行成功後に「実 API 疎通保証」前提で着手可能 |
| UT-10 | Error mapping consumer | 本タスクで観測した 401/403/429 mapping を formalize 対象として渡す |

## Step 2: 仕様書 Decision

仕様書（index.md Decision Log 2026-04-29）で課題化していた env 名差分を以下で確定:

- 採用: 既存 `GOOGLE_SHEETS_SA_JSON` / `SHEETS_SPREADSHEET_ID` を再利用
- 不採用: 新規 rename / alias 追加（UT-09 / UT-25 に波及するため、既存名を維持）
- 新規: `SMOKE_ADMIN_TOKEN`（dev/staging のみ）

UT-26 内の task docs / artifacts は `GOOGLE_SHEETS_SA_JSON` に統一済み。

## Step 3: aiworkflow-requirements 正本同期

- `.claude/skills/aiworkflow-requirements/references/api-endpoints.md`: `GET /admin/smoke/sheets`、production 404、`tokenFetchesDuringSmoke=1`、range 制限を追記
- `.claude/skills/aiworkflow-requirements/references/environment-variables.md`: `GOOGLE_SHEETS_SA_JSON` / `SHEETS_SPREADSHEET_ID` / `SMOKE_ADMIN_TOKEN` を追記
- `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` / `indexes/keywords.json`: `generate-index.js` で再生成

## next: Phase 13 PR 説明で本サマリへリンク
