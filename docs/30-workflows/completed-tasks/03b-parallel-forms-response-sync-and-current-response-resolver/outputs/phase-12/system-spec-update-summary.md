# system spec 更新概要

## 結論

- Phase 12 再判定により、03b は docs-only ではなく実装ありタスクとして扱う。
- `aiworkflow-requirements` 正本へ、管理同期 API、D1 response sync テーブル運用、Cloudflare cron / secrets、環境変数を反映した。

## 更新対象

| spec ファイル | 影響 | 備考 |
|--------------|------|------|
| `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | 更新 | `POST /admin/sync/responses` と 409 二重起動応答を追加 |
| `.claude/skills/aiworkflow-requirements/references/database-schema.md` | 更新 | `member_responses` / `response_fields` / `schema_diff_queue` / `sync_jobs.metrics_json.cursor` の 03b 運用を追加 |
| `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | 更新 | API Worker cron `*/15 * * * *` と WebCrypto signer / Forms secrets を追加 |
| `.claude/skills/aiworkflow-requirements/references/environment-variables.md` | 更新 | `GOOGLE_FORM_ID` / Google service account secrets / `SYNC_ADMIN_TOKEN` を追加 |

## 仕様明文化の余地（別タスク候補）

| 項目 | 推奨 task | 理由 |
|------|-----------|------|
| consent 正規化規則（`同意する` 等の文字列マッチ表） | spec 改訂 task | 本タスク `extract-consent.ts` に局所定義しているが、複数タスクが同じ規則を持つので spec 集約推奨 |
| `member_responses.response_email` UNIQUE 制約の DDL 上の明示 | 01a-parallel-d1-database-schema-migrations-and-tag-seed の確認 | 0001 で UNIQUE 済みだが spec 側に再掲が望ましい |
| sync_jobs `job_type` enum と `metrics_json` schema の集約 | 03a と共有 spec（`_design/` 配下）化 | 03a と本タスクで共通の挙動を持つため |

## 不変条件への影響

| 不変条件 | 影響 | 担保 |
|---------|------|------|
| #1 schema 固定禁止 | 影響なし | stableKey は `schema_questions` 経由 |
| #2 consent キー統一 | 影響なし | コード側で正規化、入力側に旧名が残っても spec は不変 |
| #3 responseEmail = system field | 影響なし | spec 通り `member_responses.response_email` に保存 |
| #4 profile 本文上書き禁止 | 影響なし | 同 `responseId` の upsert のみ |
| #5 apps/web → D1 直禁止 | 影響なし | sync は apps/api に閉じる |
| #6 GAS 排除 | 影響なし | Forms API + Workers のみ |
| #7 ResponseId / MemberId 混同禁止 | 影響なし | brand 型は `@ubm-hyogo/shared` 既定義 |
| #10 無料枠 | 影響なし | per sync write cap + high-water cursor + cron */15 |
| #14 schema 集約 | 影響なし | unknown は `schema_diff_queue` 経由 |
