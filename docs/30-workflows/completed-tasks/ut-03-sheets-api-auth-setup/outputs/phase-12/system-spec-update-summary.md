# Phase 12: システム仕様書更新サマリ

## 更新対象（aiworkflow-requirements skill）

UT-03 は Sheets API Service Account 認証モジュールの実装まで完了した workflow である。Phase 12 では aiworkflow-requirements 正本へ「実装済み契約」と「既存 Forms 契約との差分」を same-wave で明示する。

| 反映先 | same-wave 反映内容 | 後続で扱う内容 |
| --- | --- | --- |
| `.claude/skills/aiworkflow-requirements/references/architecture-monorepo.md` | `packages/integrations/google/src/sheets/auth.ts`、`sheets` namespace export、consumer（UT-09 / UT-21）を実装済み契約として記録 | 下流 sync client 実装時の import 実例 |
| `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | Sheets sync は `GOOGLE_SERVICE_ACCOUNT_JSON`、既存 Forms sync は `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY` として併存することを記録 | `apps/api/wrangler.toml` / Cloudflare Secrets 実投入 |
| `.claude/skills/aiworkflow-requirements/references/environment-variables.md` | `GOOGLE_SERVICE_ACCOUNT_JSON` / `SHEETS_SCOPES` / `SHEETS_SPREADSHEET_ID` を Sheets 認証契約として記録 | dev / staging / production の実投入と rotation SOP |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | UT-03 ステータスブロックを `completed` として追記し Sheets auth 実装契約への参照を明示 | 後続 UT-09 / UT-21 のステータス遷移時に同ブロックを更新 |
| `.claude/skills/aiworkflow-requirements/indexes/*` | references 更新が発生した場合に `generate-index.js` で再生成 | 実装 wave の正本更新後に再生成 |

## 既存 Google Forms 契約との差分

| 用途 | 現行正本 | UT-03 予約契約 | 判断 |
| --- | --- | --- | --- |
| Google Forms response sync | `GOOGLE_SERVICE_ACCOUNT_EMAIL` + `GOOGLE_PRIVATE_KEY` | 変更なし | Forms 既存実装を置換しない |
| Google Sheets sync auth | 未確定 / 既存同期由来 | `GOOGLE_SERVICE_ACCOUNT_JSON` | Sheets 認証専用の新規契約として予約 |
| Spreadsheet ID | sync 実装側で確定 | `SHEETS_SPREADSHEET_ID` | UT-09 で consumer として実投入 |

## CLAUDE.md への影響

- `bash scripts/cf.sh` ラッパー使用例に `secret put GOOGLE_SERVICE_ACCOUNT_JSON` を追記候補。
- 既存の `.env` op 参照ルールに本タスクは違反しない（追加ルール不要）。

## 不変条件への影響

- 既存の不変条件 1-7 を変更しない。
- 不変条件 #5（D1 アクセスは apps/api に閉じる）に整合（本モジュールは D1 を触らない）。

## 反映時の検証

```bash
node .claude/skills/aiworkflow-requirements/scripts/generate-index.js
git diff .claude/skills/aiworkflow-requirements/
```

実装 wave で references を編集した場合は、CI の `verify-indexes-up-to-date` gate に通ることを確認する。
