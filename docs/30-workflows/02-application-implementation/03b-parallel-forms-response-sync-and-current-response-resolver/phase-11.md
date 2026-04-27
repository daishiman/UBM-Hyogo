# Phase 11: 手動 smoke

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 03b-parallel-forms-response-sync-and-current-response-resolver |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke |
| Wave | 3 |
| Mode | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 10（最終レビュー） |
| 次 Phase | 12（ドキュメント更新） |
| 状態 | pending |

## 目的

curl / wrangler / forms.responses.list の手動実行で response 同期 / 再回答 → current 切替 / consent snapshot / unknown → diff queue / 排他の動作を人が確認する。evidence を outputs/phase-11/ に保存し、Wave 9a staging smoke の素材にする。

## 実行タスク

1. local dev で `POST /admin/sync/responses` を 1 度呼ぶ。
2. wrangler d1 execute で `member_responses` / `member_identities` / `member_status` / `response_fields` / `schema_diff_queue` の row を確認。
3. fixture を差し替えて再回答シナリオで current 切替を確認。
4. unknown question fixture で diff queue 投入を確認。
5. 同種 job 排他（409 Conflict）を試す。
6. cursor pagination（page1 → page2 → 終了）を確認。
7. evidence を outputs/phase-11/manual-evidence.md に保存。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-05/sync-runbook.md | 手順 |
| 必須 | outputs/phase-05/pseudocode.md | 期待挙動 |
| 必須 | doc/00-getting-started-manual/specs/15-infrastructure-runbook.md | wrangler 操作 |
| 必須 | outputs/phase-04/test-matrix.md | fixture |
| 参考 | outputs/phase-06/failure-cases.md | 異常系再現 |

## 実行手順

### ステップ 1: local 起動
- `pnpm --filter @ubm/api dev`
- `wrangler d1 migrations apply ubm_hyogo_staging --local`
- 条件を満たす場合は `forms.responses.list` の mock を local の Forms client に注入（fixture 切替）。

### ステップ 2: 同期実行（page1 fixture）
- `curl -X POST http://localhost:8787/admin/sync/responses -H 'Authorization: Bearer dev-admin'`
- 期待: `{ "jobId": "...", "status": "succeeded", "processedCount": 5 }`

### ステップ 3: row 確認
- `wrangler d1 execute ubm_hyogo_staging --local --command "SELECT count(*) FROM member_responses"` → 5
- `wrangler d1 execute ubm_hyogo_staging --local --command "SELECT count(DISTINCT response_email) FROM member_identities"` → 5
- `wrangler d1 execute ubm_hyogo_staging --local --command "SELECT count(*) FROM member_status WHERE is_deleted=0"` → 5
- `wrangler d1 execute ubm_hyogo_staging --local --command "SELECT count(*) FROM response_fields WHERE stable_key IS NOT NULL"` → 5 × 既知数

### ステップ 4: 再回答シナリオ
- fixture を `forms-list-re-submission.json` に切替（同 email で 2 件、後者の submittedAt が新しい）。
- 再度 `POST /admin/sync/responses ?fullSync=true`。
- 期待: `member_identities.current_response_id` が後者に切り替わる、`member_responses` は 2 row、`member_status.public_consent` が後者の値に。

### ステップ 5: unknown question
- fixture を `forms-list-unknown.json` に切替。
- `POST /admin/sync/responses ?fullSync=true`。
- `wrangler d1 execute ... --command "SELECT count(*) FROM schema_diff_queue WHERE status='open'"` → 1
- `wrangler d1 execute ... --command "SELECT extra_fields_json FROM response_fields WHERE response_id='<id>'"` → unknown question_id を含む

### ステップ 6: 排他確認
- 並列に 2 リクエスト。
- 期待: 1 つ目 200、2 つ目 409 Conflict。

### ステップ 7: cursor pagination
- fixture を `forms-list-page1.json` (nextPageToken='p2') と `forms-list-page2.json` (nextPageToken=null) に切替。
- `POST /admin/sync/responses ?fullSync=true`。
- 期待: 計 10 件 processed、`sync_jobs.payload.cursor` が末尾で null。

### ステップ 8: evidence 保存
- 後述「manual evidence template」を outputs/phase-11/manual-evidence.md にコピー、実値を埋める。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 12 | smoke evidence をドキュメント changelog に反映 |
| Wave 9a | staging で同手順を実行し staging evidence を outputs に追加 |
| Wave 8b | E2E シナリオの引き継ぎ素材 |

## 多角的チェック観点

| 観点 | 不変条件番号 | 適用理由 |
| --- | --- | --- |
| consent キー | #2 | smoke で member_status.public_consent / rules_consent を SELECT |
| responseEmail | #3 | member_responses.response_email を SELECT |
| 上書き禁止 | #4 | publish_state / is_deleted が変わらないことを SELECT |
| schema 集約 | #14 | schema_diff_queue を SELECT |
| 排他 | sync_jobs | 409 を実機確認 |
| 無料枠 | #10 | per sync write 200 内 |
| ID 混同 | #7 | TS compile が通る前提 |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | local 起動 | 11 | pending | wrangler dev |
| 2 | 同期実行 page1 | 11 | pending | curl |
| 3 | row 確認 | 11 | pending | 4 種 SELECT |
| 4 | 再回答シナリオ | 11 | pending | re-submission fixture |
| 5 | unknown シナリオ | 11 | pending | unknown fixture + diff queue |
| 6 | 排他確認 | 11 | pending | 並列 2 req |
| 7 | cursor pagination | 11 | pending | page1 + page2 |
| 8 | evidence 保存 | 11 | pending | manual-evidence.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/main.md | smoke サマリ |
| ドキュメント | outputs/phase-11/manual-evidence.md | curl / wrangler 出力 |
| メタ | artifacts.json | phase 11 を `completed` に更新 |

## 完了条件

- [ ] 同期成功の curl response が evidence に貼られている
- [ ] 4 種の row count が evidence に貼られている
- [ ] 再回答 → current 切替の SELECT 結果が evidence に貼られている
- [ ] unknown → diff queue の SELECT 結果が evidence に貼られている
- [ ] 409 Conflict が evidence に貼られている
- [ ] cursor pagination 終了の SELECT 結果が evidence に貼られている

## タスク100%実行確認【必須】

- [ ] サブタスク 8 件すべて completed
- [ ] evidence に再回答 → current 切替の証跡
- [ ] evidence に unknown → diff queue の証跡
- [ ] 409 例
- [ ] artifacts.json の phase 11 が `completed`

## 次 Phase

- 次: 12（ドキュメント更新）
- 引き継ぎ事項: smoke 結果、staging 再現手順
- ブロック条件: smoke 失敗 → Phase 5 / 6 へ戻る

## manual evidence template

```markdown
# 手動 smoke evidence — 03b-parallel-forms-response-sync-and-current-response-resolver

## 実行日時
- 2026-MM-DD HH:MM JST

## 実行者
- <name>

## 1. 同期実行（page1 fixture）
```bash
curl -X POST http://localhost:8787/admin/sync/responses -H 'Authorization: Bearer dev-admin'
```

response:
```json
{ "jobId": "<uuid>", "status": "succeeded", "processedCount": 5 }
```

## 2. row count
```bash
wrangler d1 execute ubm_hyogo_staging --local --command "SELECT count(*) FROM member_responses"
# → 5
wrangler d1 execute ubm_hyogo_staging --local --command "SELECT count(DISTINCT response_email) FROM member_identities"
# → 5
wrangler d1 execute ubm_hyogo_staging --local --command "SELECT count(*) FROM member_status WHERE is_deleted=0"
# → 5
wrangler d1 execute ubm_hyogo_staging --local --command "SELECT count(*) FROM response_fields WHERE stable_key IS NOT NULL"
# → 5 × <既知数>
```

## 3. 再回答シナリオ
```bash
# fixture: forms-list-re-submission.json
curl -X POST 'http://localhost:8787/admin/sync/responses?fullSync=true' -H 'Authorization: Bearer dev-admin'
wrangler d1 execute ubm_hyogo_staging --local --command "SELECT response_email, current_response_id, last_submitted_at FROM member_identities WHERE response_email='dup@example.com'"
# → current_response_id が後者の id、last_submitted_at が新しい submittedAt
wrangler d1 execute ubm_hyogo_staging --local --command "SELECT count(*) FROM member_responses WHERE response_email='dup@example.com'"
# → 2
wrangler d1 execute ubm_hyogo_staging --local --command "SELECT public_consent FROM member_status WHERE member_id=(SELECT member_id FROM member_identities WHERE response_email='dup@example.com')"
# → 後者 fixture の値
```

## 4. unknown question
```bash
# fixture: forms-list-unknown.json
curl -X POST 'http://localhost:8787/admin/sync/responses?fullSync=true' -H 'Authorization: Bearer dev-admin'
wrangler d1 execute ubm_hyogo_staging --local --command "SELECT count(*) FROM schema_diff_queue WHERE status='open'"
# → 1
wrangler d1 execute ubm_hyogo_staging --local --command "SELECT extra_fields_json FROM response_fields WHERE response_id='<id>' LIMIT 1"
# → unknown question_id を含む JSON
```

## 5. 排他
```bash
curl -X POST http://localhost:8787/admin/sync/responses -H 'Authorization: Bearer dev-admin' &
curl -X POST http://localhost:8787/admin/sync/responses -H 'Authorization: Bearer dev-admin' &
```

response:
- 1 つ目: 200 succeeded
- 2 つ目: 409 Conflict

## 6. cursor pagination
```bash
# fixture page1 (nextPageToken='p2') + page2 (nextPageToken=null)
curl -X POST 'http://localhost:8787/admin/sync/responses?fullSync=true' -H 'Authorization: Bearer dev-admin'
wrangler d1 execute ubm_hyogo_staging --local --command "SELECT count(*) FROM member_responses"
# → 10
wrangler d1 execute ubm_hyogo_staging --local --command "SELECT payload FROM sync_jobs WHERE kind='response_sync' ORDER BY started_at DESC LIMIT 1"
# → cursor が null（または key 自体が消えている）
```

## 7. PII redact 確認
- log に responseEmail / responseId / questionId が出ていない（grep で確認）。

## 8. 結論
- 全項目 PASS / FAIL: PASS
- 残課題: なし
```
