# システム仕様更新サマリ

## Step 1: 既存仕様との整合確認

| 仕様 | パス | 整合 |
|------|------|------|
| データ取得 | `docs/00-getting-started-manual/specs/03-data-fetching.md` | 反映 SLA セクションを追記済み |
| API schema | `docs/00-getting-started-manual/specs/01-api-schema.md` | consent / publish_state 定義と整合。変更なし |
| Google Form | `docs/00-getting-started-manual/google-form/02-result.md` | 編集/回答一覧 URL を Task D 定数の正本として参照 |

## Step 2: 本サイクルでの spec 変更

- 本サイクルで `03-data-fetching.md` へ「反映 SLA（フォーム送信から表示までのレイテンシ）」を追記済み。
- UI 表示は `GET /public/stats` の `lastSync.responseSyncFinishedAt` を `/members` と `/profile` で利用する。
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`、quick-reference、resource-map、topic-map、keywords、workflow artifact inventory、changelog を同一 wave で更新済み。
- Task B は current 正本 `/admin/sync/responses?fullSync=false|true` に補正済み。legacy `/admin/sync/run` / `/admin/sync/backfill` は grep gate で不使用を確認。

## Step 3: Index / skill 判定

| 対象 | 判定 | 記録 |
|---|---|---|
| aiworkflow-requirements Step 1-A | updated | active workflow / artifact inventory / changelog |
| aiworkflow-requirements Step 1-B | updated | quick-reference / resource-map / topic-map / keywords |
| aiworkflow-requirements Step 1-C | updated | data-fetching SLA spec |
| aiworkflow-requirements Step 1-D | updated | current sync endpoint wording aligned to `/admin/sync/responses` |
| task-specification-creator | no-op | 新規 template 改善は不要。Phase 11 pending boundary は既存二層 evidence rule で表現可能 |
| quick validate | PASS | JSON parity, focused tests, typecheck, lint, grep gate |

## 反映 SLA（確定値・doc 化対象）

| 段階 | トリガー | 所要 |
|------|---------|------|
| フォーム送信 → 取込 | response sync cron `*/15 * * * *` | 最大 15 分 |
| D1 書込 → 公開判定 | `runResponseSync()` + auto-publish | 数秒〜数十秒 |
| 画面反映（一覧） | Web ISR `revalidate=30` | 最大 30 秒 |
| 最悪ケース | hourly scheduled sync `0 * * * *` 待ち | 約 15〜45 分 |

- 一覧 `/members`: 公開条件 3 つを満たすメンバーのみ。
- 本人 `/profile`: 公開状態に関係なく本人データを即時表示（`no-store`）。
