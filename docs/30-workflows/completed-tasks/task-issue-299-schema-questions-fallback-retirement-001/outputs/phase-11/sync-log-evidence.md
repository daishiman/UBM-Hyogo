# Sync Log Evidence

## 取得状況

- 03a sync log / metric の fallback hit カウンタ取得: **acquisition_unavailable**

## 取得不能の理由

- `apps/api/src/repository/schemaQuestions.ts#findStableKeyByQuestionId` の fallback path はカウンタ／metric を持たない実装（issue-191 移行期間限定で残した最小実装で、`workers-analytics-engine` への emit や log line を一切埋め込んでいない）。
- Cloudflare `wrangler tail` の retroactive query は不可（過去 log の検索はサポートされない）。
- 既存の Analytics Engine dataset `SYNC_ALERTS`（`apps/api/wrangler.toml`）は cap-hit alert 用で、fallback hit のシグナルを emit しない。

## 代替の安全担保

| 項目 | 内容 |
| --- | --- |
| coverage query | production / staging とも 0 件（`coverage-evidence.md` 参照） |
| 静的 grep | `findStableKeyByQuestionId` 内の `stable_key FROM schema_questions WHERE question_id` は削除後 0 件 |
| unit test | alias miss + known miss → `source='unknown'` を 6/6 PASS で確認（`test-results.md` 参照） |

→ 03a sync log での fallback hit zero 観測は不能だが、coverage query 0 件で「対象データが存在しない」ことが裏付けられており、削除後に hit が発生し得る母集合が存在しない。Phase 11 spec の「取得不能時は理由を明記」条件を満たす。
