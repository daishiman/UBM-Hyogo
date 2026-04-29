# Test Matrix（Phase 4）

| AC | 内容 | unit test ID | contract test ID | authz | E2E (08b) | fixture |
| --- | --- | --- | --- | --- | --- | --- |
| AC-1 | current_response 切替 | `T-U-01` `pickCurrentResponse: submittedAt 最新採用` / `T-U-02` `responseId lex tiebreak` | `T-C-01` `member_identities.current_response_id 切替` | - | `E-01` 再回答 | `re-submission.json` |
| AC-2 | unknown → extra + queue | `T-U-03` `normalizeResponse: unknown 分離` / `T-U-04` `enqueueIfAbsent: 重複 no-op` | `T-C-02` `response_fields.extra` + `schema_diff_queue` | - | `E-02` unknown 追加 | `unknown.json` |
| AC-3 | consent snapshot | `T-U-05` `extractConsent: consented/declined/unknown` / `T-U-06` `snapshotConsent: public/rules のみ更新` | `T-C-03` `member_status row` | - | `E-03` consent 撤回 | `re-submission.json` |
| AC-4 | responseEmail = system field | `T-U-07` `normalizeResponse: responseEmail を answers に含めない` | `T-C-04` `member_responses.response_email 列、response_fields に重複なし` | - | - | `page1.json` |
| AC-5 | cursor pagination | `T-U-08` `cursorStore: read/write` / `T-U-09` `runResponseSync: nextPageToken loop` | `T-C-05` `sync_jobs.metrics.cursor` | - | `E-04` 2 page | `page1+page2.json` |
| AC-6 | 同種 job 排他 | `T-U-10` `runResponseSync: skipped on lock` | `T-C-06` `POST /admin/sync/responses 409` | `T-A-01` admin + running | - | - |
| AC-7 | ID 混同禁止 | `T-U-11` `type test: @ts-expect-error` | - | - | - | - |
| AC-8 | ruleConsent 排除 | `T-U-12` `extractConsent: ruleConsent → rulesConsent` | `T-C-07` `response_fields に ruleConsent stableKey なし` | - | - | `rule-consent.json` |
| AC-9 | is_deleted skip | `T-U-13` `snapshotConsent: is_deleted=true で skip` | `T-C-08` `member_status 不変` | - | - | - |
| AC-10 | per-sync write < 200 | `T-U-14` `runResponseSync: writeCap で break` | `T-C-09` `sync_jobs.metrics.writes` | - | - | `page1+page2.json` |

## authorization 詳細

| test ID | ケース | 期待 |
| --- | --- | --- |
| T-A-00 | Authorization ヘッダなし | 401 |
| T-A-01 | 既に running の同種 sync_job がある状態 | 409 |
| T-A-02 | 正しい admin token + idle | 200 |
| T-A-03 | SYNC_ADMIN_TOKEN 未設定 | 500 |

## ファイル対応

| test ID prefix | 配置 |
| --- | --- |
| T-U-* | `apps/api/src/jobs/*.test.ts` および `apps/api/src/jobs/mappers/*.test.ts` |
| T-C-* | 同上の test 内 contract assertion |
| T-A-* | `apps/api/src/routes/admin/responses-sync.test.ts` |
| E-* | 08b 委譲 |
